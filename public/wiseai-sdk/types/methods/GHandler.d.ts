import { Frame } from '../processing/Frame';
import { SimpleMethodHandler } from './SimpleMethodHandler';
/**
 * Handler for processing frames using the G algorithm.
 */
export declare class GHandler extends SimpleMethodHandler {
    /**
     * Get the method name. Subclasses must implement this.
     * @returns The method name.
     */
    protected getMethodName(): string;
    /**
     * Implementation of the G algorithm.
     * @param rgb - Tensor2D with rgb signals to process.
     * @returns The estimated signal as number[].
     */
    protected algorithm(rgb: Frame): number[];
}
//# sourceMappingURL=GHandler.d.ts.map