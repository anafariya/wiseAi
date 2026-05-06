import { Frame } from './Frame';
import { Buffer } from './Buffer';
import { ROI } from '../types';
/**
 * A buffer implementation for managing RGB frames with specific preprocessing.
 */
export declare class RGBBuffer extends Buffer {
    /**
     * Preprocesses a frame by cropping and converting ROI to RGB.
     * @param frame - The frame to preprocess.
     * @param keepTensor - Whether to keep the tensor in the resulting frame.
     * @param overrideRoi - Use this ROI instead of buffer ROI (optional).
     * @returns The processed frame.
     */
    protected preprocess(frame: Frame, keepTensor?: boolean, overrideRoi?: ROI): Promise<Frame>;
}
//# sourceMappingURL=RGBBuffer.d.ts.map