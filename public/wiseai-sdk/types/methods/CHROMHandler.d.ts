import { Frame } from '../processing/Frame';
import { SimpleMethodHandler } from './SimpleMethodHandler';
/**
 * Handler for processing frames using the CHROM algorithm.
 */
export declare class CHROMHandler extends SimpleMethodHandler {
    /**
     * Get the method name. Subclasses must implement this.
     * @returns The method name.
     */
    protected getMethodName(): string;
    /**
     * Implementation of the CHROM algorithm.
     * @param rgb - Tensor2D with rgb signals to process.
     * @returns The estimated pulse signal.
     */
    protected algorithm(rgb: Frame): number[];
}
//# sourceMappingURL=CHROMHandler.d.ts.map