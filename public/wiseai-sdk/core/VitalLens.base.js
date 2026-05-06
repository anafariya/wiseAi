/**
 * Base class for the VitalLens library, providing a unified API for file-based
 * and live stream video processing.
 */
export class VitalLensBase {
    controller;
    /**
     * Initializes the VitalLens instance with the provided options.
     * @param options - Configuration options for the library.
     */
    constructor(options) {
        this.controller = this.createController(options);
    }
    /**
     * Set a MediaStream, an HTMLVideoElement, or both for live stream processing.
     * @param stream - The MediaStream to process (optional).
     * @param videoElement - The HTMLVideoElement to use for processing (optional).
     */
    async setVideoStream(stream, videoElement) {
        if (!stream && !videoElement) {
            throw new Error('You must provide either a MediaStream, an HTMLVideoElement, or both.');
        }
        await this.controller.setVideoStream(stream, videoElement);
    }
    /**
     * Controls whether API inference is enabled.
     * Set to false to perform local face detection only (saving costs).
     */
    setInferenceEnabled(enabled) {
        this.controller.setInferenceEnabled(enabled);
    }
    /**
     * Starts processing for live streams or resumes if paused.
     */
    startVideoStream() {
        this.controller.startVideoStream();
    }
    /**
     * Pauses processing for live streams, including frame capture and predictions.
     */
    pauseVideoStream() {
        this.controller.pauseVideoStream();
    }
    /**
     * Stops all ongoing processing and clears resources.
     */
    stopVideoStream() {
        this.controller.stopVideoStream();
    }
    /**
     * Resets all internal buffers and estimation states.
     */
    reset() {
        this.controller.reset();
    }
    /**
     * Processes a video file or input.
     * @param videoInput - The video input to process (string, File, or Blob).
     * @returns The results after processing the video.
     */
    async processVideoFile(videoInput) {
        return this.controller.processVideoFile(videoInput);
    }
    /**
     * Returns the vital signs supported by the currently resolved model.
     * Must be called after the instance has initialized.
     * @returns An array of supported vital sign keys.
     */
    getSupportedVitals() {
        return this.controller.getSupportedVitals();
    }
    /**
     * Registers an event listener for a specific event.
     * @param event - The event to listen to (e.g., 'vitals').
     * @param callback - The function to call when the event occurs.
     */
    addEventListener(event, callback) {
        this.controller.addEventListener(event, callback);
    }
    /**
     * Removes an event listener for a specific event.
     * @param event - The event for which to remove the listener (e.g., 'vitals').
     */
    removeEventListener(event) {
        this.controller.removeEventListener(event);
    }
    /**
     * Closes VitalLens and disposes of its resources.
     */
    async close() {
        await this.controller.dispose();
    }
}
