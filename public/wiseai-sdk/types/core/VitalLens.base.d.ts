import { VitalLensOptions, VitalLensResult, VideoInput, Vital } from '../types/core';
import { IVitalLensController } from '../types/IVitalLensController';
/**
 * Base class for the VitalLens library, providing a unified API for file-based
 * and live stream video processing.
 */
export declare abstract class VitalLensBase {
    private controller;
    /**
     * Initializes the VitalLens instance with the provided options.
     * @param options - Configuration options for the library.
     */
    constructor(options: VitalLensOptions);
    /**
     * Subclasses must return the correct environment-specific VitalLensController instance.
     */
    protected abstract createController(options: VitalLensOptions): IVitalLensController;
    /**
     * Set a MediaStream, an HTMLVideoElement, or both for live stream processing.
     * @param stream - The MediaStream to process (optional).
     * @param videoElement - The HTMLVideoElement to use for processing (optional).
     */
    setVideoStream(stream?: MediaStream, videoElement?: HTMLVideoElement): Promise<void>;
    /**
     * Controls whether API inference is enabled.
     * Set to false to perform local face detection only (saving costs).
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
     * Resets all internal buffers and estimation states.
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
     * Must be called after the instance has initialized.
     * @returns An array of supported vital sign keys.
     */
    getSupportedVitals(): Vital[];
    /**
     * Registers an event listener for a specific event.
     * @param event - The event to listen to (e.g., 'vitals').
     * @param callback - The function to call when the event occurs.
     */
    addEventListener(event: string, callback: (data: unknown) => void): void;
    /**
     * Removes an event listener for a specific event.
     * @param event - The event for which to remove the listener (e.g., 'vitals').
     */
    removeEventListener(event: string): void;
    /**
     * Closes VitalLens and disposes of its resources.
     */
    close(): Promise<void>;
}
//# sourceMappingURL=VitalLens.base.d.ts.map