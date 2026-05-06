import { FileFrameIterator } from './FileFrameIterator';
import { FileRGBIterator } from './FileRGBIterator';
import { StreamFrameIterator } from './StreamFrameIterator';
/**
 * Creates iterators for video processing, including frame capture and preprocessing.
 */
export class FrameIteratorFactory {
    options;
    getConfig;
    constructor(options, getConfig) {
        this.options = options;
        this.getConfig = getConfig;
    }
    /**
     * Creates a frame iterator for live streams.
     * @param stream - The MediaStream to process.
     * @param videoElement - Optional video element if the client is already rendering the stream.
     * @returns A stream frame iterator.
     */
    createStreamFrameIterator(stream, videoElement) {
        if (!stream && !videoElement) {
            throw new Error('Either a MediaStream or an HTMLVideoElement must be provided.');
        }
        return new StreamFrameIterator(stream, videoElement);
    }
    /**
     * Creates a frame iterator for file-based inputs.
     * @param videoInput - The video input to process.
     * @param ffpmeg - The ffmpeg wrapper.
     * @param faceDetectionWorker - The face detection worker.
     * @returns A file frame iterator.
     */
    createFileFrameIterator(videoInput, ffmpeg, faceDetectionWorker) {
        if (this.options.method.startsWith('wiseai')) {
            return new FileFrameIterator(videoInput, this.options, this.getConfig, faceDetectionWorker, ffmpeg);
        }
        else {
            return new FileRGBIterator(videoInput, this.options, this.getConfig, faceDetectionWorker, ffmpeg);
        }
    }
}
