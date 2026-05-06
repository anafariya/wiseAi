import { FFmpegWrapperBase } from './FFmpegWrapper.base';
import { VideoInput, VideoProbeResult, VideoProcessingOptions } from '../types';
export default class FFmpegWrapper extends FFmpegWrapperBase {
    private ffmpeg?;
    private loadedFileName;
    private coreURL?;
    private wasmURL?;
    constructor(coreURL?: string, wasmURL?: string);
    /**
     * Initialize the FFmpeg instance for the appropriate environment.
     */
    init(): Promise<void>;
    /**
     * Loads the video input into the FFmpeg virtual file system.
     * @param input - The video input (URL, File, or Blob).
     * @returns The virtual file name used for the input.
     */
    loadInput(input: VideoInput): Promise<string>;
    /**
     * Cleans up the input file from the FFmpeg virtual file system.
     */
    cleanup(): void;
    /**
     * Probes the video file to extract metadata.
     * @param input - The video input (URL, File, or Blob).
     * @returns A promise resolving to metadata about the video.
     */
    probeVideo(input: VideoInput): Promise<VideoProbeResult>;
    /**
     * Reads video frames and applies transformations.
     * @param input URL or File or Blob representing a video file.
     * @param options - Video processing options.
     * @param probeInfo - Video probe information.
     * @returns A promise resolving to a Uint8Array containing processed video as raw RGB24 buffer.
     */
    readVideo(input: VideoInput, options: VideoProcessingOptions, probeInfo: VideoProbeResult): Promise<Uint8Array>;
    /**
     * A helper function that takes ffmpeg log output and extracts metadata.
     *
     * It attempts to parse:
     * - Duration (in the format "Duration: hh:mm:ss.ss")
     * - Video stream details (codec, resolution, and frame rate)
     * - Bitrate (in kb/s)
     *
     * It then infers the total frame count as (duration * fps).
     *
     * @param output - The combined ffmpeg log output.
     * @returns A VideoProbeResult object or null if parsing fails.
     */
    parseFFmpegOutput(output: string): VideoProbeResult | null;
}
//# sourceMappingURL=FFmpegWrapper.browser.d.ts.map