import { MethodConfig, VideoInput, VitalLensOptions } from '../types/core';
import { Frame } from './Frame';
import { FrameIteratorBase } from './FrameIterator.base';
import { IFFmpegWrapper } from '../types/IFFmpegWrapper';
import { IFaceDetectionWorker } from '../types/IFaceDetectionWorker';
/**
 * Frame iterator for video files (e.g., local file paths, File, or Blob inputs).
 * Yields 4D `Frame`s representing pre-processed segments of the video file
 */
export declare class FileFrameIterator extends FrameIteratorBase {
    private videoInput;
    private options;
    private getConfig;
    private faceDetectionWorker;
    private ffmpeg;
    private currentFrameIndex;
    private probeInfo;
    private roi;
    private get methodConfig();
    private get fpsTarget();
    private get dsFactor();
    constructor(videoInput: VideoInput, options: VitalLensOptions, getConfig: () => MethodConfig, faceDetectionWorker: IFaceDetectionWorker | null, ffmpeg: IFFmpegWrapper);
    /**
     * Starts the iterator by initializing the FFmpeg wrapper and probing the video.
     */
    start(): Promise<void>;
    /**
     * Retrieves the next frame from the video file.
     * @returns A promise resolving to the next frame or null if the iterator is closed or EOF is reached.
     */
    next(): Promise<Frame | null>;
    /**
     * Stops the iterator and releases resources used by the FFmpeg wrapper.
     */
    stop(): void;
}
//# sourceMappingURL=FileFrameIterator.d.ts.map