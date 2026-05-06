import { BufferManager } from '../processing/BufferManager';
import { MethodHandler } from '../methods/MethodHandler';
import { VitalLensOptions, VitalLensResult, VideoInput, MethodConfig, Vital } from '../types/core';
import { IVitalLensController } from '../types/IVitalLensController';
import { Session } from '../processing/Session';
import { IRestClient } from '../types/IRestClient';
import { IStreamProcessor } from '../types/IStreamProcessor';
import { IFrameIterator } from '../types/IFrameIterator';
import { IFFmpegWrapper } from '../types/IFFmpegWrapper';
import { FrameIteratorFactory } from '../processing/FrameIteratorFactory';
import { IFaceDetectionWorker } from '../types/IFaceDetectionWorker';
/**
 * Base class for VitalLensController, managing frame processing, buffering,
 * and predictions for both file-based and live stream scenarios.
 */
export declare abstract class VitalLensControllerBase implements IVitalLensController {
    protected options: VitalLensOptions;
    protected frameIteratorFactory: FrameIteratorFactory | null;
    protected bufferManager: BufferManager;
    protected streamProcessor: IStreamProcessor | null;
    protected methodHandler: MethodHandler;
    protected methodConfig: MethodConfig;
    protected faceDetectionWorker: IFaceDetectionWorker | null;
    protected ffmpeg: IFFmpegWrapper | null;
    protected session: Session | null;
    protected eventListeners: {
        [event: string]: ((data: unknown) => void)[];
    };
    constructor(options: VitalLensOptions);
    /**
     * Subclasses must return the appropriate RestClient instance.
     */
    protected abstract createRestClient(apiKey: string, proxyUrl?: string): IRestClient;
    /**
     * Subclasses must return the appropriate FFmpegWrapper instance.
     */
    protected abstract createFFmpegWrapper(): IFFmpegWrapper;
    /**
     * Subclasses must return the appropriate Worker instance.
     */
    protected abstract createFaceDetectionWorker(): IFaceDetectionWorker;
    /**
     * Subclasses must return the appropriate StreamProcessor instance.
     */
    protected abstract createStreamProcessor(options: VitalLensOptions, getConfig: () => MethodConfig, frameIterator: IFrameIterator, bufferManager: BufferManager, faceDetectionWorker: IFaceDetectionWorker | null, methodHandler: MethodHandler, onPredict: (result: VitalLensResult) => Promise<void>, onNoFace: () => Promise<void>, onStreamReset: () => Promise<void>, onFaceDetected?: (face: {
        coordinates: [number, number, number, number];
        confidence: number;
    } | null) => void): IStreamProcessor;
    /**
     * Creates the appropriate method handler based on the options.
     * @param options - Configuration options.
     * @returns The method handler instance.
     */
    protected createMethodHandler(options: VitalLensOptions): MethodHandler;
    /**
     * Sets a MediaStream, an HTMLVideoElement, or both for live stream processing.
     * @param stream - MediaStream to process (optional).
     * @param videoElement - HTMLVideoElement to use for processing (optional).
     */
    setVideoStream(stream?: MediaStream, videoElement?: HTMLVideoElement): Promise<void>;
    /**
     * Sets whether API inference is enabled.
     */
    setInferenceEnabled(enabled: boolean): void;
    /**
     * Starts processing for live streams or resumes if paused.
     */
    startVideoStream(): void;
    /**
     * Pauses processing for live streams, including frame capture and predictions.
     */
    pauseVideoStream(): void;
    /**
     * Stops all ongoing processing and clears resources.
     */
    stopVideoStream(): void;
    /**
     * Resets internal state.
     */
    reset(): void;
    /**
     * Processes a video file or input.
     * @param videoInput - The video input to process (string, File, or Blob).
     * @returns The results after processing the video.
     */
    processVideoFile(videoInput: VideoInput): Promise<VitalLensResult>;
    /**
     * Returns the vital signs supported by the currently resolved model.
     * @returns An array of supported vital sign keys.
     */
    getSupportedVitals(): Vital[];
    /**
     * Adds an event listener for a specific event.
     * @param event - Event name (e.g., 'vitals').
     * @param listener - Callback to invoke when the event is emitted.
     */
    addEventListener(event: string, listener: (data: unknown) => void): void;
    /**
     * Removes an event listener for a specific event.
     * @param event - Event name (e.g., 'vitals')
     */
    removeEventListener(event: string): void;
    /**
     * Stop worker and dispose of all resources
     */
    dispose(): Promise<void>;
    /**
     * Dispatches an event to all registered listeners.
     * @param event - Event name.
     * @param data - Data to pass to the listeners.
     */
    private dispatchEvent;
    /**
     * Returns `true` if streamProcessor is not null and actively processing.
     * @returns `true` if streamProcessor is not null and actively processing.
     */
    private isProcessing;
}
//# sourceMappingURL=VitalLensController.base.d.ts.map