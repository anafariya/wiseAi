import tf from 'tfjs-provider';
import { ROI } from '../types';
export interface FrameOptions {
    rawData?: ArrayBuffer;
    tensor?: tf.Tensor;
    shape?: number[];
    dtype?: tf.DataType;
    keepTensor?: boolean;
    timestamp?: number[];
    roi?: ROI[];
}
export interface FrameTransferable {
    rawData: ArrayBuffer;
    shape: number[];
    dtype: tf.DataType;
    timestamp: number[];
    roi: ROI[];
}
/**
 * Determines the size (number of elements) from an ArrayBuffer of raw data.
 * @param rawData The raw data
 * @param dtype The data type
 * @returns The number of elements in the raw data
 */
export declare function getActualSizeFromRawData(rawData: ArrayBuffer, dtype: tf.DataType): number;
/**
 * Extracts the raw data from a tf.Tensor.
 * @param tensor The tensor
 * @returns The raw data
 */
export declare function getRawDataFromTensor(tensor: tf.Tensor): ArrayBuffer;
/**
 * Represents one or multiple frames in the video processing pipeline.
 */
export declare class Frame {
    private rawData?;
    private tensor?;
    private shape;
    private dtype;
    private timestamp;
    private roi;
    private refCount;
    constructor(options: FrameOptions);
    /**
     * Creates a Frame from an existing tf.Tensor, optionally keeping the tensor itself.
     * @param tensor The source tensor
     * @param keepTensor If true, store the tf.Tensor directly
     * @param timestamp Optional timestamps
     * @param roi Optional regions of interest
     * @returns Newly instantiated Frame
     */
    static fromTensor(tensor: tf.Tensor, keepTensor?: boolean, timestamp?: number[], roi?: ROI[]): Frame;
    /**
     * Creates a Frame from a Uint8Array (no tf.Tensor involved).
     * @param array The Uint8Array containing data.
     * @param shape The shape of the data (e.g. [nFrames, height, width, channels]).
     * @param timestamp Optional timestamps.
     * @param roi Optional regions of interest.
     * @returns Newly instantiated Frame
     */
    static fromUint8Array(array: Uint8Array, shape: number[], timestamp?: number[], roi?: ROI[]): Frame;
    /**
     * Creates a Frame from a Float32Array (no tf.Tensor involved).
     * @param array The Float32Array containing data.
     * @param shape The shape of the data (e.g. [nFrames, height, width, channels]).
     * @param timestamp Optional timestamps.
     * @param roi Optional regions of interest.
     * @returns Newly instantiated Frame
     */
    static fromFloat32Array(array: Float32Array, shape: number[], timestamp?: number[], roi?: ROI[]): Frame;
    /**
     * Reconstructs a Frame instance from transferable data.
     * @param data The transferable data object.
     * @returns Newly instantiated Frame
     */
    static fromTransferable(data: FrameTransferable): Frame;
    /**
     * Returns a tf.Tensor. If `keepTensor` was true, this will be the same reference
     * originally passed in (unless disposed of). If `keepTensor` was false,
     * this will create a new tensor from raw data each time.
     * @returns The Tensor
     */
    getTensor(): tf.Tensor;
    /**
     * Increments the reference count when another process needs to use this frame.
     */
    retain(): void;
    /**
     * Decrements the reference count. If it reaches zero, disposes the tensor.
     */
    release(): void;
    /**
     * If a tensor is stored, calls tensor.dispose().
     */
    disposeTensor(): void;
    /**
     * Returns a plain object representation of this Frame that is transferable.
     * It includes the raw data and metadata necessary to reconstruct the Frame.
     * @returns The transferable representation
     */
    toTransferable(): FrameTransferable;
    /**
     * Returns the raw data as a Uint8Array.
     * @returns Raw data as a Uint8Array
     */
    getUint8Array(): Uint8Array;
    /**
     * Returns the raw data as a Float32Array.
     * @returns Raw data as a Float32Array
     */
    getFloat32Array(): Float32Array;
    /**
     * Provides access to the raw data.
     * @returns The raw data (may be undefined)
     */
    getRawData(): ArrayBuffer | undefined;
    /**
     * Provides the tensor shape.
     * @returns The tensor shape.
     */
    getShape(): number[];
    /**
     * Provides the tensor dtype.
     * @returns The data type.
     */
    getDType(): tf.DataType;
    /**
     * Provides the tensor dtype.
     * @returns The timestamps
     */
    getTimestamp(): number[];
    /**
     * Provides the tensor dtype.
     * @returns The ROIs
     */
    getROI(): ROI[];
    /**
     * Indicates whether we are storing a tf.Tensor
     * @returns True if a tensor is stored.
     */
    hasTensor(): boolean;
    /**
     * Utility to figure out which TypedArray we need for a given dtype
     * @returns The typed array class required for this frame's dtype.
     */
    private getTypedArrayClass;
}
//# sourceMappingURL=Frame.d.ts.map