import { getCore } from './wasmProvider';
import { BufferManager } from '../processing/BufferManager';
import { MethodHandlerFactory } from '../methods/MethodHandlerFactory';
import { METHODS_CONFIG } from '../config/methodsConfig';
import { Session } from '../processing/Session';
import { isBrowser } from '../utils/env';
import { FrameIteratorFactory } from '../processing/FrameIteratorFactory';
/**
 * Base class for VitalLensController, managing frame processing, buffering,
 * and predictions for both file-based and live stream scenarios.
 */
export class VitalLensControllerBase {
    options;
    frameIteratorFactory = null;
    bufferManager;
    streamProcessor = null;
    methodHandler;
    methodConfig;
    faceDetectionWorker = null;
    ffmpeg = null;
    session = null;
    eventListeners = {};
    constructor(options) {
        this.options = options;
        this.methodConfig = METHODS_CONFIG[this.options.method];
        this.bufferManager = new BufferManager();
        this.methodHandler = this.createMethodHandler(options);
        this.frameIteratorFactory = new FrameIteratorFactory(options, () => this.methodHandler.getConfig());
        if (options.globalRoi === undefined) {
            this.faceDetectionWorker = this.createFaceDetectionWorker();
        }
    }
    /**
     * Creates the appropriate method handler based on the options.
     * @param options - Configuration options.
     * @returns The method handler instance.
     */
    createMethodHandler(options) {
        const requestMode = options.requestMode || 'rest';
        const dependencies = {
            restClient: options.method.startsWith('wiseai') && requestMode === 'rest'
                ? this.createRestClient(this.options.apiKey ?? '', this.options.proxyUrl)
                : undefined,
        };
        return MethodHandlerFactory.createHandler(options, dependencies);
    }
    /**
     * Sets a MediaStream, an HTMLVideoElement, or both for live stream processing.
     * @param stream - MediaStream to process (optional).
     * @param videoElement - HTMLVideoElement to use for processing (optional).
     */
    async setVideoStream(stream, videoElement) {
        const core = await getCore();
        await this.methodHandler.init();
        if (!this.session) {
            this.session = new Session(core, this.methodHandler.getConfig(), this.options);
        }
        if (!isBrowser) {
            throw new Error('setVideoStream is not supported yet in the Node environment.');
        }
        if (!this.frameIteratorFactory) {
            throw new Error('FrameIteratorFactory is not initialized.');
        }
        if (this.streamProcessor) {
            throw new Error('A video stream has already been set. Only one video stream is supported at a time - call stopVideoStream() to remove.');
        }
        const frameIterator = this.frameIteratorFactory.createStreamFrameIterator(stream, videoElement);
        this.streamProcessor = this.createStreamProcessor(this.options, () => this.methodHandler.getConfig(), frameIterator, this.bufferManager, this.faceDetectionWorker, this.methodHandler, async (incrementalResult) => {
            // onPredict - process and dispatch incremental result unless paused
            if (this.isProcessing()) {
                const processedResult = await this.session.processIncrementalResult(incrementalResult, this.options.waveformMode || 'incremental', true // ensure it returns the result
                );
                if (processedResult) {
                    this.dispatchEvent('vitals', processedResult);
                }
            }
        }, async () => {
            // onNoFace - reset the vitals estimate manager and dispatch empty result
            this.session.reset();
            this.dispatchEvent('vitals', this.session.getEmptyResult());
            this.dispatchEvent('faceDetected', null);
        }, async () => {
            // onStreamReset - dispatch a public event so the UI can react.
            this.dispatchEvent('streamReset', {
                message: 'Connection unstable. Stream is resetting.',
            });
        }, (face) => {
            this.dispatchEvent('faceDetected', face);
        });
    }
    /**
     * Sets whether API inference is enabled.
     */
    setInferenceEnabled(enabled) {
        if (this.streamProcessor) {
            this.streamProcessor.setInferenceEnabled(enabled);
        }
    }
    /**
     * Starts processing for live streams or resumes if paused.
     */
    startVideoStream() {
        if (!this.isProcessing()) {
            this.streamProcessor.start();
        }
    }
    /**
     * Pauses processing for live streams, including frame capture and predictions.
     */
    pauseVideoStream() {
        if (this.isProcessing()) {
            this.streamProcessor.stop();
            this.session?.reset();
        }
    }
    /**
     * Stops all ongoing processing and clears resources.
     */
    stopVideoStream() {
        if (this.streamProcessor) {
            this.streamProcessor.stop();
            this.streamProcessor = null;
        }
        this.session?.reset();
    }
    /**
     * Resets internal state.
     */
    reset() {
        this.session?.reset();
        if (this.streamProcessor) {
            // If streaming, let the processor handle the reset (clears ROI + Buffers)
            this.streamProcessor.reset();
        }
        else if (this.bufferManager) {
            // Fallback for file mode or uninitialized stream
            this.bufferManager.cleanup();
        }
    }
    /**
     * Processes a video file or input.
     * @param videoInput - The video input to process (string, File, or Blob).
     * @returns The results after processing the video.
     */
    async processVideoFile(videoInput) {
        const core = await getCore();
        await this.methodHandler.init();
        if (!this.session) {
            this.session = new Session(core, this.methodHandler.getConfig(), this.options);
        }
        if (!this.frameIteratorFactory) {
            throw new Error('FrameIteratorFactory is not initialized.');
        }
        if (!this.ffmpeg) {
            this.ffmpeg = this.createFFmpegWrapper();
        }
        const frameIterator = this.frameIteratorFactory.createFileFrameIterator(videoInput, this.ffmpeg, this.faceDetectionWorker);
        this.dispatchEvent('fileProgress', 'Detecting faces...');
        await frameIterator.start();
        let chunkCounter = 1;
        const iterator = frameIterator[Symbol.asyncIterator]();
        while (true) {
            this.dispatchEvent('fileProgress', `Loading video for chunk ${chunkCounter}...`);
            const { value: framesChunk, done } = await iterator.next();
            if (done)
                break;
            this.dispatchEvent('fileProgress', `Estimating vitals for chunk ${chunkCounter}...`);
            const incrementalResult = await this.methodHandler.process(framesChunk, 'file', this.bufferManager.getState() ?? undefined, undefined);
            if (incrementalResult) {
                if (incrementalResult.state) {
                    this.bufferManager.setState(new Float32Array(incrementalResult.state.data));
                }
                // Feed the chunk into Wasm to accumulate in the buffer
                await this.session.processIncrementalResult(incrementalResult, 'incremental', false);
            }
            chunkCounter++;
        }
        // Trigger the final Global calculation on the accumulated buffer
        const result = await this.session.getResult();
        await this.methodHandler.cleanup();
        this.session.reset();
        return result;
    }
    /**
     * Returns the vital signs supported by the currently resolved model.
     * @returns An array of supported vital sign keys.
     */
    getSupportedVitals() {
        return this.methodHandler.getConfig().supportedVitals || [];
    }
    /**
     * Adds an event listener for a specific event.
     * @param event - Event name (e.g., 'vitals').
     * @param listener - Callback to invoke when the event is emitted.
     */
    addEventListener(event, listener) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(listener);
    }
    /**
     * Removes an event listener for a specific event.
     * @param event - Event name (e.g., 'vitals')
     */
    removeEventListener(event) {
        if (this.eventListeners[event]) {
            delete this.eventListeners[event];
        }
    }
    /**
     * Stop worker and dispose of all resources
     */
    async dispose() {
        // Terminate the face detection worker if it exists.
        if (this.faceDetectionWorker) {
            await this.faceDetectionWorker.terminate();
            this.faceDetectionWorker = null;
        }
        // Clean up ffmpeg, streamProcessor, etc.
        if (this.ffmpeg) {
            this.ffmpeg.cleanup();
            this.ffmpeg = null;
        }
        if (this.streamProcessor) {
            this.streamProcessor.stop();
            this.streamProcessor = null;
        }
        // Reset any internal state.
        this.bufferManager.cleanup();
        this.session?.reset();
    }
    /**
     * Dispatches an event to all registered listeners.
     * @param event - Event name.
     * @param data - Data to pass to the listeners.
     */
    dispatchEvent(event, data) {
        this.eventListeners[event]?.forEach((listener) => listener(data));
    }
    /**
     * Returns `true` if streamProcessor is not null and actively processing.
     * @returns `true` if streamProcessor is not null and actively processing.
     */
    isProcessing() {
        return this.streamProcessor !== null && this.streamProcessor.isProcessing();
    }
}
