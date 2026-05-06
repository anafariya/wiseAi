import { Frame } from '../processing/Frame';
import { SimpleMethodHandler } from './SimpleMethodHandler';
/**
 * Handler for processing frames using the POS algorithm.
 */
export declare class POSHandler extends SimpleMethodHandler {
    /**
     * Get the method name. Subclasses must implement this.
     * @returns The method name.
     */
    protected getMethodName(): string;
    /**
     * Implementation of the POS algorithm.
     * @param rgb - A Frame whose data represents an RGB signal with shape [n, 3].
     * @returns The estimated POS signal as a 1D array.
     */
    protected algorithm(rgb: Frame): number[];
}
//# sourceMappingURL=POSHandler.d.ts.map