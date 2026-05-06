import { MethodHandler } from './MethodHandler';
import { InferenceMode, VitalLensOptions, VitalLensResult } from '../types/core';
import { Frame } from '../processing/Frame';
/**
 * Base class for simple rPPG methods (e.g., POS, CHROM, G).
 */
export declare abstract class SimpleMethodHandler extends MethodHandler {
    constructor(options: VitalLensOptions);
    /**
     * Initialise the method.
     */
    init(): Promise<void>;
    /**
     * Cleanup the method.
     */
    cleanup(): Promise<void>;
    /**
     * Get readiness state.
     * @returns Whether the method is ready for prediction.
     */
    getReady(): boolean;
    /**
     * Processes a chunk of rgb signals to compute vitals.
     * @param rgb - Frame of rgb signals to process.
     * @param mode - The inference mode.
     * @returns A promise that resolves to the processed result.
     */
    process(rgb: Frame, mode: InferenceMode): Promise<VitalLensResult>;
    /**
     * Abstract method for subclasses to implement their specific algorithm.
     * @param rgb - Tensor2D with rgb signals to process.
     */
    protected abstract algorithm(rgb: Frame): number[];
}
//# sourceMappingURL=SimpleMethodHandler.d.ts.map