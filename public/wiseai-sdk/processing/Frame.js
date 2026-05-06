import tf from 'tfjs-provider';
/**
 * Determines the size (number of elements) from an ArrayBuffer of raw data.
 * @param rawData The raw data
 * @param dtype The data type
 * @returns The number of elements in the raw data
 */
export function getActualSizeFromRawData(rawData, dtype) {
    switch (dtype) {
        case 'uint8':
            return new Uint8Array(rawData).length;
        case 'int32':
            return new Int32Array(rawData).length;
        case 'float32':
            return new Float32Array(rawData).length;
        default:
            throw new Error(`Unsupported dtype: ${dtype}`);
    }
}
/**
 * Extracts the raw data from a tf.Tensor.
 * @param tensor The tensor
 * @returns The raw data
 */
export function getRawDataFromTensor(tensor) {
    const typedData = tensor.dataSync();
    const expectedSize = tensor.shape.reduce((a, b) => a * b, 1);
    const exactBuffer = typedData.buffer.slice(typedData.byteOffset, typedData.byteOffset + typedData.byteLength);
    const actualSize = getActualSizeFromRawData(exactBuffer, tensor.dtype);
    if (expectedSize !== actualSize) {
        throw new Error(`Mismatch in tensor size: expected ${expectedSize}, but got ${actualSize}`);
    }
    return exactBuffer;
}
/**
 * Represents one or multiple frames in the video processing pipeline.
 */
export class Frame {
    rawData;
    tensor;
    shape;
    dtype;
    timestamp; // In seconds
    roi;
    refCount = 0;
    constructor(options) {
        const { rawData, tensor, shape, dtype, keepTensor, timestamp, roi } = options;
        this.timestamp = timestamp ?? [];
        this.roi = roi ?? [];
        if (tensor) {
            // We received a tensor
            if (keepTensor) {
                // Keep the tensor
                this.tensor = tensor;
            }
            else {
                // Do not keep the tensor. Convert to raw data:
                this.rawData = getRawDataFromTensor(tensor);
            }
            this.shape = tensor.shape;
            this.dtype = tensor.dtype;
        }
        else {
            // We received raw data - store it
            if (!rawData || !shape || !dtype) {
                throw new Error(`Frame: rawData, shape, and dtype are required if 'keepTensor' is false.`);
            }
            this.rawData = rawData;
            this.shape = shape;
            this.dtype = dtype;
        }
    }
    /**
     * Creates a Frame from an existing tf.Tensor, optionally keeping the tensor itself.
     * @param tensor The source tensor
     * @param keepTensor If true, store the tf.Tensor directly
     * @param timestamp Optional timestamps
     * @param roi Optional regions of interest
     * @returns Newly instantiated Frame
     */
    static fromTensor(tensor, keepTensor = false, timestamp, roi) {
        return new Frame({
            tensor,
            keepTensor,
            shape: tensor.shape,
            dtype: tensor.dtype,
            timestamp,
            roi,
        });
    }
    /**
     * Creates a Frame from a Uint8Array (no tf.Tensor involved).
     * @param array The Uint8Array containing data.
     * @param shape The shape of the data (e.g. [nFrames, height, width, channels]).
     * @param timestamp Optional timestamps.
     * @param roi Optional regions of interest.
     * @returns Newly instantiated Frame
     */
    static fromUint8Array(array, shape, timestamp, roi) {
        const rawData = array.buffer;
        const expectedSize = shape.reduce((a, b) => a * b, 1);
        const actualSize = getActualSizeFromRawData(rawData, 'uint8');
        if (expectedSize !== actualSize) {
            throw new Error(`Mismatch in raw data size: expected ${expectedSize}, but got ${actualSize}`);
        }
        return new Frame({
            rawData,
            shape,
            dtype: 'uint8',
            keepTensor: false,
            timestamp,
            roi,
        });
    }
    /**
     * Creates a Frame from a Float32Array (no tf.Tensor involved).
     * @param array The Float32Array containing data.
     * @param shape The shape of the data (e.g. [nFrames, height, width, channels]).
     * @param timestamp Optional timestamps.
     * @param roi Optional regions of interest.
     * @returns Newly instantiated Frame
     */
    static fromFloat32Array(array, shape, timestamp, roi) {
        const rawData = array.buffer;
        const expectedSize = shape.reduce((a, b) => a * b, 1);
        const actualSize = getActualSizeFromRawData(rawData, 'float32');
        if (expectedSize !== actualSize) {
            throw new Error(`Mismatch in raw data size: expected ${expectedSize}, but got ${actualSize}`);
        }
        return new Frame({
            rawData,
            shape,
            dtype: 'float32',
            keepTensor: false,
            timestamp,
            roi,
        });
    }
    /**
     * Reconstructs a Frame instance from transferable data.
     * @param data The transferable data object.
     * @returns Newly instantiated Frame
     */
    static fromTransferable(data) {
        return new Frame({
            rawData: data.rawData,
            shape: data.shape,
            dtype: data.dtype,
            timestamp: data.timestamp,
            roi: data.roi,
        });
    }
    /**
     * Returns a tf.Tensor. If `keepTensor` was true, this will be the same reference
     * originally passed in (unless disposed of). If `keepTensor` was false,
     * this will create a new tensor from raw data each time.
     * @returns The Tensor
     */
    getTensor() {
        if (this.tensor) {
            // We are storing the tensor
            return this.tensor;
        }
        // Otherwise, we must have raw data
        if (!this.rawData || !this.shape || !this.dtype) {
            throw new Error('No tensor stored and insufficient data to create one.');
        }
        let typedArray;
        let tensorDType = this.dtype;
        if (this.dtype === 'uint8') {
            // Convert uint8 to int32 since tfjs does not support uint8 tensors
            typedArray = new Int32Array(new Uint8Array(this.rawData));
            tensorDType = 'int32'; // Use int32 for compatibility
        }
        else {
            const TypedArrayClass = this.getTypedArrayClass();
            typedArray = new TypedArrayClass(this.rawData);
        }
        const expectedSize = this.shape.reduce((a, b) => a * b, 1);
        const actualSize = typedArray.length;
        if (expectedSize !== actualSize) {
            throw new Error(`Mismatch in tensor size: expected ${expectedSize}, but got ${actualSize}`);
        }
        return tf.tensor(typedArray, this.shape, tensorDType);
    }
    /**
     * Increments the reference count when another process needs to use this frame.
     */
    retain() {
        this.refCount++;
    }
    /**
     * Decrements the reference count. If it reaches zero, disposes the tensor.
     */
    release() {
        this.refCount--;
        if (this.refCount <= 0) {
            this.disposeTensor();
        }
    }
    /**
     * If a tensor is stored, calls tensor.dispose().
     */
    disposeTensor() {
        if (this.tensor) {
            this.tensor.dispose();
            this.tensor = undefined;
        }
        this.refCount = 0;
    }
    /**
     * Returns a plain object representation of this Frame that is transferable.
     * It includes the raw data and metadata necessary to reconstruct the Frame.
     * @returns The transferable representation
     */
    toTransferable() {
        return {
            rawData: this.rawData || getRawDataFromTensor(this.tensor),
            shape: this.shape,
            dtype: this.dtype,
            timestamp: this.timestamp,
            roi: this.roi,
        };
    }
    /**
     * Returns the raw data as a Uint8Array.
     * @returns Raw data as a Uint8Array
     */
    getUint8Array() {
        if (!this.rawData) {
            throw new Error('No raw data stored.');
        }
        else if (this.rawData && this.dtype === 'uint8') {
            return new Uint8Array(this.rawData);
        }
        else {
            const TypedArrayClass = this.getTypedArrayClass();
            const typedArray = new TypedArrayClass(this.rawData);
            return new Uint8Array(typedArray);
        }
    }
    /**
     * Returns the raw data as a Float32Array.
     * @returns Raw data as a Float32Array
     */
    getFloat32Array() {
        if (!this.rawData) {
            throw new Error('No raw data stored.');
        }
        else if (this.rawData && this.dtype === 'float32') {
            return new Float32Array(this.rawData);
        }
        else {
            const TypedArrayClass = this.getTypedArrayClass();
            const typedArray = new TypedArrayClass(this.rawData);
            return new Float32Array(typedArray);
        }
    }
    /**
     * Provides access to the raw data.
     * @returns The raw data (may be undefined)
     */
    getRawData() {
        return this.rawData;
    }
    /**
     * Provides the tensor shape.
     * @returns The tensor shape.
     */
    getShape() {
        return this.shape;
    }
    /**
     * Provides the tensor dtype.
     * @returns The data type.
     */
    getDType() {
        return this.dtype;
    }
    /**
     * Provides the tensor dtype.
     * @returns The timestamps
     */
    getTimestamp() {
        return this.timestamp;
    }
    /**
     * Provides the tensor dtype.
     * @returns The ROIs
     */
    getROI() {
        return this.roi;
    }
    /**
     * Indicates whether we are storing a tf.Tensor
     * @returns True if a tensor is stored.
     */
    hasTensor() {
        return this.tensor !== undefined;
    }
    /**
     * Utility to figure out which TypedArray we need for a given dtype
     * @returns The typed array class required for this frame's dtype.
     */
    getTypedArrayClass() {
        switch (this.dtype) {
            case 'uint8':
                return Uint8Array;
            case 'float32':
                return Float32Array;
            case 'int32':
                return Int32Array;
            default:
                throw new Error(`Unsupported dtype: ${this.dtype}`);
        }
    }
}
