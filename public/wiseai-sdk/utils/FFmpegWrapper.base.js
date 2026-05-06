/**
 * Base class for FFmpegWrapper
 * Contains shared functionality for FFmpeg processing.
 */
export class FFmpegWrapperBase {
    /**
     * Assembles video processing filters for FFmpeg.
     * Handles frame downsampling, temporal trimming, spatial cropping, and scaling.
     *
     * @param options - Video processing options.
     * @param probeInfo - Metadata about the video (e.g., FPS, dimensions).
     * @returns Filters array.
     */
    assembleVideoFilters(options, probeInfo) {
        const filters = [];
        const { fps } = probeInfo;
        // Parse options
        const dsFactor = options.fpsTarget && options.fpsTarget < fps
            ? Math.round(fps / options.fpsTarget)
            : 1;
        let targetW = options.crop
            ? options.crop.x1 - options.crop.x0
            : probeInfo.width;
        let targetH = options.crop
            ? options.crop.y1 - options.crop.y0
            : probeInfo.height;
        if (options.scale) {
            const preserveAspectRatio = options.preserveAspectRatio || false;
            if (preserveAspectRatio) {
                const scaleRatio = Math.max(options.scale.height, options.scale.width) /
                    Math.max(targetW, targetH);
                targetW = Math.round(targetW * scaleRatio);
                targetH = Math.round(targetH * scaleRatio);
            }
            else {
                targetW = options.scale.width;
                targetH = options.scale.height;
            }
        }
        // Apply trimming
        if (options.trim) {
            const { startFrame, endFrame } = options.trim;
            filters.push(`trim=start_frame=${startFrame}:end_frame=${endFrame}`);
            filters.push('setpts=PTS-STARTPTS');
        }
        // Apply frame downsampling
        if (dsFactor > 1) {
            filters.push(`select='not(mod(n\\,${dsFactor}))'`);
            filters.push('setpts=N/FRAME_RATE/TB');
        }
        // Apply cropping
        if (options.crop) {
            // Note: If video has rotation, ffmpeg swaps given params around if necessary
            // E.g., if video has -90 rotation, w:h:x:y are internally swapped to h:w:y:x by ffmpeg
            const { x0, y0, x1, y1 } = options.crop;
            filters.push(`crop=${x1 - x0}:${y1 - y0}:${x0}:${y0}`);
        }
        // Apply scaling
        if (options.scale) {
            const scaleAlgorithm = options.scaleAlgorithm || 'bicubic';
            // Note: If video has rotation, ffmpeg swaps given params around if necessary
            // E.g., if video has -90 rotation, w:h are internally swapped to h:w by ffmpeg
            filters.push(`scale=${targetW}:${targetH}:flags=${scaleAlgorithm}`);
        }
        return filters;
    }
}
