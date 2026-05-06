import { StreamProcessorBase } from './StreamProcessor.base';
import { Frame } from './Frame';
/**
 * Node-specific stub implementation of the StreamProcessor.
 * Currently, face detection is not fully implemented.
 * This class exists to compile and run without errors,
 * and can be extended later with actual worker-based face detection using worker_threads.
 */
export declare class StreamProcessor extends StreamProcessorBase {
    private faceDetectionRequestId;
    /**
     * Triggers face detection on a single frame.
     * In this stub, we simply log a warning and release the frame.
     * @param frame - The current frame to detect a face in.
     * @param currentTime - Timestamp in seconds.
     */
    protected triggerFaceDetection(frame: Frame, currentTime: number): void;
    /**
     * Handles worker responses with face detection results.
     * This stub simply logs the call.
     * @param data - The data received from the worker.
     */
    protected handleFaceDetectionResult(data: unknown): void;
}
//# sourceMappingURL=StreamProcessor.node.d.ts.map