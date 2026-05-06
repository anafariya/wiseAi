import { StreamProcessorBase } from './StreamProcessor.base';
import { Frame } from './Frame';
export declare class StreamProcessor extends StreamProcessorBase {
    private faceDetectionRequestId;
    /**
     * Triggers face detection on a single frame.
     * @param frame - Current frame to detect face in.
     * @param currentTime - Timestamp in seconds.
     */
    protected triggerFaceDetection(frame: Frame, currentTime: number): void;
    /**
     * Handles worker responses with face detection results.
     * @param event - The detection event.
     */
    protected handleFaceDetectionResult(event: MessageEvent): void;
}
//# sourceMappingURL=StreamProcessor.browser.d.ts.map