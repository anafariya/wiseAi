import { MethodConfig, VideoInput, VitalLensOptions } from '../types/core';
import { Frame } from './Frame';
import { FrameIteratorBase } from './FrameIterator.base';
import { IFFmpegWrapper } from '../types/IFFmpegWrapper';
import { IFaceDetectionWorker } from '../types/IFaceDetectionWorker';
/**
 * Extracts a representative RGB value from a frame's pixel data over the given ROI.
 * In this implementation, we compute the average RGB values over the ROI.
 * @param frameData - Uint8Array containing pixel data for the cropped frame.
 * @param frameWidth - Width of the cropped frame.
 * @param frameHeight - Height of the cropped frame.
 * @param roi - ROI (with coordinates relative to the cropped frame).
 * @returns A tuple [R, G, B] representing the average color within the ROI.
 */
export declare function extractRGBForROI(frameData: Uint8Array, frameWidth: number, frameHeight: number, roi: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}): [number, number, number];
/**
 * Frame iterator for video files (e.g., local file paths, File, or Blob inputs).
 * Yields 2D `Frame`s representing RGB signal from pre-processed segments of the video file
 */
export declare class FileRGBIterator extends FrameIteratorBase {
    private videoInput;
    private options;
    private getConfig;
    private faceDetectionWorker;
    private ffmpeg;
    private currentFrameIndex;
    private probeInfo;
    private roi;
    private rgb;
    private get methodConfig();
    private get fpsTarget();
    private get dsFactor();
    constructor(videoInput: VideoInput, options: VitalLensOptions, getConfig: () => MethodConfig, faceDetectionWorker: IFaceDetectionWorker | null, ffmpeg: IFFmpegWrapper);
    /**
     * Starts the iterator by initializing the FFmpeg wrapper, probing the video, and pre-computing the rgb values.
     * Pre-computing is done because the chunks returned in next() have large overlaps which would lead to redundant work.
     */
    start(): Promise<void>;
    /**
     * Retrieves the next rgb frame from the video file.
     * @returns A promise resolving to the next frame or null if the iterator is closed or EOF is reached.
     */
    next(): Promise<Frame | null>;
    /**
     * Stops the iterator and releases resources used by the FFmpeg wrapper.
     */
    stop(): void;
}
//# sourceMappingURL=FileRGBIterator.d.ts.map