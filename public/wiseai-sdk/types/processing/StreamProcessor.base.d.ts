import { MethodConfig, ROI, VitalLensOptions, VitalLensResult } from '../types';
import { BufferManager } from './BufferManager';
import { MethodHandler } from '../methods/MethodHandler';
import { Frame } from './Frame';
import { IFrameIterator } from '../types/IFrameIterator';
import { IFaceDetectionWorker } from '../types/IFaceDetectionWorker';
/**
 * Manages the processing loop for live streams, including frame capture,
 * buffering, and triggering predictions.
 */
export declare abstract class StreamProcessorBase {
    protected options: VitalLensOptions;
    private getConfig;
    private frameIterator;
    protected bufferManager: BufferManager;
    protected faceDetectionWorker: IFaceDetectionWorker | null;
    private onPredict;
    protected onNoFace: () => Promise<void>;
    protected onStreamReset: () => Promise<void>;
    protected onFaceDetected?: ((face: {
        coordinates: [number, number, number, number];
        confidence: number;
    } | null) => void) | undefined;
    private isPaused;
    private isPredicting;
    protected inferenceEnabled: boolean;
    protected isDetecting: boolean;
    protected roi: ROI | null;
    protected pendingRoi: ROI | null;
    private fDetFs;
    private lastProcessedTime;
    protected lastFaceDetectionTime: number;
    private methodHandler;
    protected get methodConfig(): MethodConfig;
    protected get targetFps(): number;
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
    constructor(options: VitalLensOptions, getConfig: () => MethodConfig, frameIterator: IFrameIterator, bufferManager: BufferManager, faceDetectionWorker: IFaceDetectionWorker | null, methodHandler: MethodHandler, onPredict: (result: VitalLensResult) => Promise<void>, onNoFace: () => Promise<void>, onStreamReset: () => Promise<void>, onFaceDetected?: ((face: {
        coordinates: [number, number, number, number];
        confidence: number;
    } | null) => void) | undefined);
    /**
     * Initializes the StreamProcessor, setting up a global ROI if provided.
     */
    init(): void;
    /**
     * Enable or disable the API inference step.
     */
    setInferenceEnabled(enabled: boolean): void;
    /**
     * Starts the stream processing loop.
     */
    start(): Promise<void>;
    protected abstract triggerFaceDetection(frame: Frame, currentTime: number): void;
    protected abstract handleFaceDetectionResult(event: MessageEvent): void;
    /**
     * Returns `true` we are actively processing
     * @returns Returns `true` we are actively processing
     */
    isProcessing(): boolean;
    /**
     * Stops the processing loop, halts frame iteration, and clears buffers.
     */
    stop(): void;
    /**
     * Clears the ROI and buffers.
     */
    reset(): void;
}
//# sourceMappingURL=StreamProcessor.base.d.ts.map