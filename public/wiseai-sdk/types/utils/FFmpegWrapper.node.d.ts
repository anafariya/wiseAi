import { FFmpegWrapperBase } from './FFmpegWrapper.base';
import { VideoInput, VideoProbeResult, VideoProcessingOptions } from '../types';
export default class FFmpegWrapper extends FFmpegWrapperBase {
    /**
     * Initializes FFmpeg. For the Node.js implementation, this is a no-op.
     */
    init(): Promise<void>;
    /**
     * Loads the video input file and returns its path.
     * @param input - The video input (file path).
     * @returns The path to the loaded file.
     */
    loadInput(input: VideoInput): Promise<string>;
    /**
     * Cleans up any loaded video file reference.
     */
    cleanup(): void;
    /**
     * Probes the video file to extract metadata.
     * @param input - The video input (file path).
     * @returns A promise resolving to metadata about the video.
     */
    probeVideo(input: VideoInput): Promise<VideoProbeResult>;
    /**
     * Reads video frames and applies transformations.
     * @param input - The video input (file path).
     * @param options - Video processing options.
     * @param probeInfo - Video probe information.
     * @returns A promise resolving to a Uint8Array containing processed frame data.
     */
    readVideo(input: VideoInput, options: VideoProcessingOptions, probeInfo: VideoProbeResult): Promise<Uint8Array>;
    /**
     * Extracts the frame rate from the FFmpeg avg_frame_rate string.
     * @param avgFrameRate - The avg_frame_rate string.
     * @returns The frame rate as a number or null if unavailable.
     */
    private extractFrameRate;
}
//# sourceMappingURL=FFmpegWrapper.node.d.ts.map