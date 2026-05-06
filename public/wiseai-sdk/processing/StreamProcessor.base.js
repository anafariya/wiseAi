import { FDET_DEFAULT_FS_STREAM } from '../config/constants';
/**
 * Manages the processing loop for live streams, including frame capture,
 * buffering, and triggering predictions.
 */
export class StreamProcessorBase {
    options;
    getConfig;
    frameIterator;
    bufferManager;
    faceDetectionWorker;
    onPredict;
    onNoFace;
    onStreamReset;
    onFaceDetected;
    isPaused = true;
    isPredicting = false;
    inferenceEnabled = true;
    isDetecting = false;
    roi = null;
    pendingRoi = null;
    fDetFs = 0.5;
    lastProcessedTime = 0; // In seconds
    lastFaceDetectionTime = 0; // In seconds
    methodHandler;
    get methodConfig() {
        return this.getConfig();
    }
    get targetFps() {
        return this.options.overrideFpsTarget ?? this.methodConfig.fpsTarget;
    }
    /**
     * Creates a new StreamProcessor.
     * @param options - Configuration options for VitalLens.
     * @param getConfig - Get the method-specific settings (e.g. fps, ROI sizing).
     * @param frameIterator - Source of frames (webcam or other).
     * @param bufferManager - Manages frames for each ROI and method state.
     * @param faceDetectionWorker - Face detection worker (optional if global ROI is given).
     * @param methodHandler - Handles actual vital sign algorithm processing.
     * @param onPredict - Callback invoked with each new VitalLensResult.
     * @param onNoFace - Callback invoked when face is lost.
     * @param onStreamReset - Callback invoked when stream is reset.
     * @param onFaceDetected - Callback for raw face detection events.
     */
    constructor(options, getConfig, frameIterator, bufferManager, faceDetectionWorker, methodHandler, onPredict, onNoFace, onStreamReset, onFaceDetected) {
        this.options = options;
        this.getConfig = getConfig;
        this.frameIterator = frameIterator;
        this.bufferManager = bufferManager;
        this.faceDetectionWorker = faceDetectionWorker;
        this.onPredict = onPredict;
        this.onNoFace = onNoFace;
        this.onStreamReset = onStreamReset;
        this.onFaceDetected = onFaceDetected;
        this.methodHandler = methodHandler;
        this.fDetFs = this.options.fDetFs ?? FDET_DEFAULT_FS_STREAM;
        if (this.faceDetectionWorker) {
            this.faceDetectionWorker.onmessage =
                this.handleFaceDetectionResult.bind(this);
            this.faceDetectionWorker.onerror = (error) => {
                console.error('Face detection worker error:', error);
            };
        }
    }
    /**
     * Initializes the StreamProcessor, setting up a global ROI if provided.
     */
    init() {
        if (!this.faceDetectionWorker && this.options.globalRoi) {
            this.roi = this.options.globalRoi;
        }
    }
    /**
     * Enable or disable the API inference step.
     */
    setInferenceEnabled(enabled) {
        this.inferenceEnabled = enabled;
    }
    /**
     * Starts the stream processing loop.
     */
    async start() {
        await this.methodHandler.init();
        this.init();
        this.isPaused = false;
        const iterator = this.frameIterator[Symbol.asyncIterator]();
        const processFrames = async () => {
            while (!this.isPaused) {
                const currentTime = performance.now() / 1000; // In seconds
                // Keep global ROI active
                if (this.options.globalRoi) {
                    const activeRoi = this.bufferManager.processTarget(this.options.globalRoi, currentTime, this.methodConfig);
                    if (activeRoi) {
                        this.pendingRoi = activeRoi;
                    }
                }
                if (this.pendingRoi) {
                    this.roi = this.pendingRoi;
                    this.pendingRoi = null;
                }
                // Throttle to target FPS
                if (currentTime - this.lastProcessedTime < 1 / this.targetFps) {
                    await new Promise((resolve) => setTimeout(resolve, (1 / this.targetFps - (currentTime - this.lastProcessedTime)) *
                        1000));
                    continue;
                }
                const { value: frame, done } = await iterator.next();
                if (done || this.isPaused)
                    break;
                if (!frame)
                    continue;
                this.lastProcessedTime = currentTime;
                // Retain the full frame. Released when face detection finishes/fails/not required.
                frame.retain();
                try {
                    // Add frame to buffer(s). Use buffer ROI for vitallens, otherwise pass this.roi
                    if (!this.bufferManager.isEmpty()) {
                        await this.bufferManager.add(frame, !this.methodConfig.method.startsWith('vitallens')
                            ? (this.roi ?? undefined)
                            : undefined);
                    }
                    // If inference enabled and buffers + method are ready, run a prediction
                    if (this.inferenceEnabled &&
                        this.methodHandler.getReady() &&
                        !this.isPredicting) {
                        const command = this.bufferManager.poll(currentTime, 'Stream');
                        if (command) {
                            this.isPredicting = true;
                            this.bufferManager.consumeCommand(command).then((mergedFrame) => {
                                if (!mergedFrame) {
                                    this.isPredicting = false;
                                    return;
                                }
                                const currentState = this.bufferManager.getState();
                                const bufferSize = command.take_count;
                                this.methodHandler
                                    .process(mergedFrame, 'stream', currentState, bufferSize)
                                    .then((incrementalResult) => {
                                    if (incrementalResult) {
                                        if (incrementalResult.state) {
                                            this.bufferManager.setState(new Float32Array(incrementalResult.state.data));
                                        }
                                        else {
                                            this.bufferManager.resetState();
                                        }
                                        this.onPredict(incrementalResult);
                                    }
                                })
                                    .catch((error) => {
                                    console.error('Error during prediction:', error);
                                    if (error.message.includes('Resetting stream')) {
                                        this.stop();
                                        this.onStreamReset();
                                    }
                                })
                                    .finally(() => {
                                    this.isPredicting = false;
                                    if (!this.methodConfig.method.startsWith('vitallens')) {
                                        mergedFrame.release();
                                    }
                                });
                            });
                        }
                    }
                    if (this.faceDetectionWorker &&
                        !this.isDetecting &&
                        currentTime - this.lastFaceDetectionTime > 1 / this.fDetFs) {
                        this.triggerFaceDetection(frame, currentTime);
                    }
                    else {
                        frame.release();
                    }
                }
                catch (error) {
                    console.error('Error processing frame:', error);
                    frame.release();
                }
            }
        };
        // Start capturing from frameIterator
        await this.frameIterator.start();
        // Start the async loop
        processFrames().catch((error) => {
            console.error('Error in stream processing loop:', error);
        });
    }
    /**
     * Returns `true` we are actively processing
     * @returns Returns `true` we are actively processing
     */
    isProcessing() {
        return !this.isPaused;
    }
    /**
     * Stops the processing loop, halts frame iteration, and clears buffers.
     */
    stop() {
        this.isPaused = true;
        this.frameIterator.stop();
        this.methodHandler.cleanup();
        this.bufferManager.cleanup();
    }
    /**
     * Clears the ROI and buffers.
     */
    reset() {
        this.roi = null;
        this.pendingRoi = null;
        this.bufferManager.cleanup();
        this.isPredicting = false;
    }
}
