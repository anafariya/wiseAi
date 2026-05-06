import { MethodConfig, ROI } from '../types/core';
import { Frame } from './Frame';
/**
 * An abstract class to manage buffering of frames.
 */
export declare abstract class Buffer {
    protected roi: ROI;
    protected methodConfig: MethodConfig;
    private buffer;
    constructor(roi: ROI, methodConfig: MethodConfig);
    /**
     * Get the current buffer size.
     * @returns The size of the buffer.
     */
    size(): number;
    /**
     * Adds a frame to the buffer.
     * @param frame - The frame to add.
     * @param overrideRoi - Use this ROI instead of buffer ROI (optional).
     */
    add(frame: Frame, overrideRoi?: ROI): Promise<void>;
    /**
     * Consumes a specific number of frames from the buffer and retains a specific overlap count.
     */
    consume(takeCount: number, keepCount: number): Promise<Frame | null>;
    /**
     * Clears the buffer.
     */
    clear(): void;
    /**
     * Abstract method for preprocessing a frame.
     * Must be implemented in subclasses.
     * @param frame - The frame to preprocess.
     * @param keepTensor - Whether to keep the tensor in the resulting frame.
     * @param overrideRoi - Use this ROI instead of buffer ROI (optional).
     * @returns The processed frame.
     */
    protected abstract preprocess(frame: Frame, keepTensor: boolean, overrideRoi?: ROI): Promise<Frame>;
}
//# sourceMappingURL=Buffer.d.ts.map