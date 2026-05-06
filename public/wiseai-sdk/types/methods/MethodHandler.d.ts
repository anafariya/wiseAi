import { Frame } from '../processing/Frame';
import { InferenceMode, MethodConfig, VitalLensOptions, VitalLensResult } from '../types/core';
/**
 * Abstract base class for all method-specific handlers.
 * Subclasses must implement the `process` method.
 */
export declare abstract class MethodHandler {
    protected config: MethodConfig;
    constructor(options: VitalLensOptions);
    /**
     * Returns the current method configuration.
     * @returns The method configuration.
     */
    getConfig(): MethodConfig;
    /**
     * Initialise the method. Subclasses must implement this.
     */
    abstract init(): Promise<void>;
    /**
     * Cleanup the method. Subclasses must implement this.
     */
    abstract cleanup(): Promise<void>;
    /**
     * Get readiness state. Subclasses must implement this.
     * @returns Whether the method is ready for prediction.
     */
    abstract getReady(): boolean;
    /**
     * Get the method name. Subclasses must implement this.
     * @returns The method name.
     */
    protected abstract getMethodName(): string;
    /**
     * Processes the provided buffer of frames and optionally uses the recurrent state.
     * @param framesChunk - Frame chunk to process.
     * @param mode - The inference mode.
     * @param state - Optional recurrent state from previous processing.
     * @param bufferSize - Optional current size of the buffer.
     * @returns A promise that resolves to the processing result.
     */
    abstract process(framesChunk: Frame, mode: InferenceMode, state?: Float32Array, bufferSize?: number): Promise<VitalLensResult | undefined>;
}
//# sourceMappingURL=MethodHandler.d.ts.map