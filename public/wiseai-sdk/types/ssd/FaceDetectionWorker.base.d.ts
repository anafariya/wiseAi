import { IFaceDetectionWorker } from '../types/IFaceDetectionWorker';
import { ROI, VideoProbeResult } from '../types/core';
import { FaceDetectorInput } from './FaceDetectorAsync.base';
export declare abstract class FaceDetectionWorkerBase implements IFaceDetectionWorker {
    abstract postMessage(message: unknown, transfer?: Transferable[]): void;
    abstract terminate(): void | Promise<number>;
    abstract addEventListener?(type: string, listener: EventListenerOrEventListenerObject): void;
    abstract removeEventListener?(type: string, listener: EventListenerOrEventListenerObject): void;
    abstract onmessage: ((ev: MessageEvent) => unknown) | null;
    abstract onmessageerror: ((ev: MessageEvent) => unknown) | null;
    abstract onerror?: ((ev: ErrorEvent) => unknown) | null;
    /**
     * Convenience method to send a detection request.
     * @param data - The input data (may be a Frame or a File/Blob)
     * @param dataType - Either 'frame' for Frame or 'video' for File/Blob
     * @param fs - Target frequency for face detection
     * @param timestamp - Optional timestamp
     * @returns Promise resolving to detections and probeInfo
     */
    detectFaces(data: FaceDetectorInput, dataType: 'video' | 'frame', fs: number, timestamp?: number): Promise<{
        detections: ROI[];
        probeInfo: VideoProbeResult;
    }>;
}
//# sourceMappingURL=FaceDetectionWorker.base.d.ts.map