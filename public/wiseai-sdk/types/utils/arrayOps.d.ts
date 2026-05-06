import { Frame } from '../processing/Frame';
/**
 * Merges an array of Frame objects into a single Frame asynchronously.
 * @param frames - An array of Frame objects to merge.
 * @param keepTensor - Whether to keep the tensor in the resulting frame.
 * @returns A Promise resolving to a single Frame with concatenated data and concatenated timestamps.
 */
export declare function mergeFrames(frames: Frame[], keepTensor?: boolean): Promise<Frame>;
/**
 * Converts a Uint8Array into a base64 string.
 * @param uint8Array The array to be converted
 * @returns The resulting base64 string
 */
export declare function uint8ArrayToBase64(uint8Array: Uint8Array): string;
/**
 * Converts a Float32Array into a base64 string.
 * @param arr The array to be converted
 * @returns The resulting base64 string
 */
export declare function float32ArrayToBase64(arr: Float32Array): string;
//# sourceMappingURL=arrayOps.d.ts.map