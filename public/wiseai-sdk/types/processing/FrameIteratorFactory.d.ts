import { MethodConfig, VitalLensOptions, VideoInput } from '../types/core';
import { IFFmpegWrapper } from '../types/IFFmpegWrapper';
import { IFrameIterator } from '../types/IFrameIterator';
import { IFaceDetectionWorker } from '../types/IFaceDetectionWorker';
/**
 * Creates iterators for video processing, including frame capture and preprocessing.
 */
export declare class FrameIteratorFactory {
    private options;
    private getConfig;
    constructor(options: VitalLensOptions, getConfig: () => MethodConfig);
    /**
     * Creates a frame iterator for live streams.
     * @param stream - The MediaStream to process.
     * @param videoElement - Optional video element if the client is already rendering the stream.
     * @returns A stream frame iterator.
     */
    createStreamFrameIterator(stream?: MediaStream, videoElement?: HTMLVideoElement): IFrameIterator;
    /**
     * Creates a frame iterator for file-based inputs.
     * @param videoInput - The video input to process.
     * @param ffpmeg - The ffmpeg wrapper.
     * @param faceDetectionWorker - The face detection worker.
     * @returns A file frame iterator.
     */
    createFileFrameIterator(videoInput: VideoInput, ffmpeg: IFFmpegWrapper, faceDetectionWorker: IFaceDetectionWorker | null): IFrameIterator;
}
//# sourceMappingURL=FrameIteratorFactory.d.ts.map