import { Frame } from './Frame';
import { FrameIteratorBase } from './FrameIterator.base';
import { getRepresentativeROI, getROIForMethod } from '../utils/faceOps';
import { FDET_DEFAULT_FS_FILE } from '../config/constants';
/**
 * Frame iterator for video files (e.g., local file paths, File, or Blob inputs).
 * Yields 4D `Frame`s representing pre-processed segments of the video file
 */
export class FileFrameIterator extends FrameIteratorBase {
    videoInput;
    options;
    getConfig;
    faceDetectionWorker;
    ffmpeg;
    currentFrameIndex = 0;
    probeInfo = null;
    roi = [];
    get methodConfig() {
        return this.getConfig();
    }
    get fpsTarget() {
        return this.options.overrideFpsTarget ?? this.methodConfig.fpsTarget;
    }
    get dsFactor() {
        if (!this.probeInfo)
            return 1;
        return Math.max(Math.round(this.probeInfo.fps / this.fpsTarget), 1);
    }
    constructor(videoInput, options, getConfig, faceDetectionWorker, ffmpeg) {
        super();
        this.videoInput = videoInput;
        this.options = options;
        this.getConfig = getConfig;
        this.faceDetectionWorker = faceDetectionWorker;
        this.ffmpeg = ffmpeg;
    }
    /**
     * Starts the iterator by initializing the FFmpeg wrapper and probing the video.
     */
    async start() {
        // Get the ROI
        if (this.faceDetectionWorker) {
            // Run face detection
            const { detections, probeInfo } = await this.faceDetectionWorker.detectFaces(this.videoInput, 'video', this.options.fDetFs ?? FDET_DEFAULT_FS_FILE);
            // Derive roi from faces
            this.probeInfo = probeInfo;
            this.roi = detections.map((det) => getROIForMethod(det, this.methodConfig, { height: probeInfo.height, width: probeInfo.width }, true));
            // Load ffmpeg after finishing face detection
            await this.ffmpeg.init();
            await this.ffmpeg.loadInput(this.videoInput);
        }
        else {
            // Load ffmpeg
            await this.ffmpeg.init();
            await this.ffmpeg.loadInput(this.videoInput);
            // Probe to get video information
            this.probeInfo = await this.ffmpeg.probeVideo(this.videoInput);
            if (!this.probeInfo) {
                throw new Error('Failed to retrieve video probe information. Ensure the input is valid.');
            }
            // Use global ROI
            this.roi = Array(this.probeInfo.totalFrames).fill(this.options.globalRoi);
        }
    }
    /**
     * Retrieves the next frame from the video file.
     * @returns A promise resolving to the next frame or null if the iterator is closed or EOF is reached.
     */
    async next() {
        if (!this.probeInfo) {
            throw new Error('Probe information is not available. Ensure `start()` has been called before `next()`.');
        }
        if (this.isClosed || this.currentFrameIndex >= this.probeInfo.totalFrames) {
            return null;
        }
        const startFrameIndex = Math.max(0, this.currentFrameIndex - this.methodConfig.minWindowLength * this.dsFactor);
        const framesToRead = Math.min(this.methodConfig.maxWindowLength * this.dsFactor, this.probeInfo.totalFrames - startFrameIndex);
        const roi = getRepresentativeROI(this.roi.slice(startFrameIndex, startFrameIndex + framesToRead));
        const frameData = await this.ffmpeg.readVideo(this.videoInput, {
            fpsTarget: this.fpsTarget,
            crop: roi,
            scale: this.methodConfig.inputSize
                ? {
                    width: this.methodConfig.inputSize,
                    height: this.methodConfig.inputSize,
                }
                : undefined,
            trim: {
                startFrame: startFrameIndex,
                endFrame: startFrameIndex + framesToRead,
            },
            pixelFormat: 'rgb24',
            scaleAlgorithm: 'bilinear',
        }, this.probeInfo);
        if (!frameData) {
            this.stop();
            return null;
        }
        this.currentFrameIndex += framesToRead;
        const width = this.methodConfig.inputSize || roi.x1 - roi.x0;
        const height = this.methodConfig.inputSize || roi.y1 - roi.y0;
        if (!width || !height) {
            throw new Error('Unable to determine frame dimensions. Ensure scale or ROI dimensions are provided.');
        }
        const dsFramesExpected = Math.ceil(framesToRead / this.dsFactor);
        const totalPixelsPerFrame = width * height * 3;
        const expectedBufferLength = dsFramesExpected * totalPixelsPerFrame;
        if (frameData.length !== expectedBufferLength) {
            throw new Error(`Buffer length mismatch. Expected ${expectedBufferLength}, but received ${frameData.length}.`);
        }
        const shape = [dsFramesExpected, height, width, 3];
        // Generate timestamps for each frame in the batch
        const frameTimestamps = Array.from({ length: dsFramesExpected }, (_, i) => (startFrameIndex + i * this.dsFactor) / this.probeInfo.fps);
        // ROI for each frame in the batch
        const rois = Array.from({ length: dsFramesExpected }, () => roi);
        return Frame.fromUint8Array(frameData, shape, frameTimestamps, rois);
    }
    /**
     * Stops the iterator and releases resources used by the FFmpeg wrapper.
     */
    stop() {
        super.stop();
        this.ffmpeg.cleanup();
    }
}
