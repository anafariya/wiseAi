import tf from 'tfjs-provider';
import { Frame } from '../processing/Frame';
import { ROI, VideoInput, VideoProbeResult } from '../types/core';
import { IFaceDetector } from '../types/IFaceDetector';
import { IFFmpegWrapper } from '../types/IFFmpegWrapper';
/**
 * The face detector input can be either a pre-processed Frame or a VideoInput.
 */
export type FaceDetectorInput = Frame | VideoInput;
/**
 * Information recorded for each frame.
 */
export interface DetectionInfo {
    frameIndex: number;
    scanned: boolean;
    faceFound: boolean;
    interpValid: boolean;
    confidence: number;
    roi?: ROI;
}
/**
 * Custom Non-Max Suppression implementation that wraps the optimized TensorFlow.js function.
 * @param boxes - An array of bounding boxes [xMin, yMin, xMax, yMax].
 * @param scores - An array of confidence scores for each box.
 * @param maxOutputSize - The maximum number of boxes to return.
 * @param iouThreshold - The IOU threshold for filtering overlapping boxes.
 * @param scoreThreshold - The score threshold for filtering low-confidence boxes.
 * @returns A Promise resolving to the indices of selected boxes.
 */
export declare function nms(boxes: number[][], scores: number[], maxOutputSize: number, iouThreshold: number, scoreThreshold: number): Promise<number[]>;
/**
 * Face detector class, implementing detection via a machine learning model.
 */
export declare abstract class FaceDetectorAsyncBase implements IFaceDetector {
    private maxFaces;
    private scoreThreshold;
    private iouThreshold;
    protected model: tf.GraphModel | null;
    private loaded;
    private loadingPromise;
    /**
     * @param maxFaces The maximum number of faces to detect.
     * @param scoreThreshold Confidence threshold.
     * @param iouThreshold IOU threshold.
     */
    constructor(maxFaces?: number, scoreThreshold?: number, iouThreshold?: number);
    /**
     * Subclasses must initialize the model appropriately.
     */
    protected abstract init(): Promise<void>;
    /**
     * Public method to ensure the model is fully loaded before detection.
     */
    load(): Promise<void>;
    /**
     * Processes a single batch of frames.
     * @param input - Either a preloaded Frame or a VideoInput file.
     * @param batchFrameIndices - An array of original frame indices to process in this batch.
     * @param ffmpeg - The ffmpeg wrapper (required for VideoInput).
     * @param probeInfo - Probe information about the video (required for VideoInput).
     * @returns An array of DetectionInfo for the frames in the batch.
     */
    private processBatch;
    /**
     * Runs face detection on the provided input (Frame or VideoInput) and returns an array
     * of ROIs (one per frame in the original video).
     * @param input - The input Frame or VideoInput.
     * @param fs - frequency (Hz) at which to scan frames.
     * @param ffmpeg - An FFmpegWrapper (only required if input is VideoInput).
     * @param probeInfo - Info about the input (only required if input is VideoInput).
     * @returns A promise resolving to an array of ROIs.
     */
    detect(input: FaceDetectorInput, fs: number, ffmpeg?: IFFmpegWrapper, probeInfo?: VideoProbeResult): Promise<ROI[]>;
    /**
     * Interpolates detections for frames that were not scanned. For each frame index
     * from 0 to totalFrames-1, if no detection is available, linearly interpolate ROI
     * coordinates from the nearest previous and next valid (faceFound) detections.
     * @param detections - The array of DetectionInfo from scanned frames.
     * @param totalFrames - The total number of frames in the original video.
     * @returns An ROI for every frame (backfilled by interpolation where necessary).
     */
    private interpolateDetections;
}
//# sourceMappingURL=FaceDetectorAsync.base.d.ts.map