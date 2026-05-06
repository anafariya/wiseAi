import { InferenceMode, VitalLensOptions, VitalLensResult } from '../types/core';
import { MethodHandler } from './MethodHandler';
import { Frame } from '../processing/Frame';
import { IRestClient } from '../types/IRestClient';
/**
 * Handler for processing frames using the VitalLens API via REST.
 */
export declare class VitalLensAPIHandler extends MethodHandler {
    private client;
    private options;
    private ready;
    private requestedModelName?;
    private resolvedModelName?;
    constructor(client: IRestClient, options: VitalLensOptions);
    /**
     * Initialise the method.
     */
    init(): Promise<void>;
    /**
     * Parses the response from /resolve-model and sets the method config.
     * @param response The response from the API.
     */
    private _parseAndSetConfig;
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
     * Get the method name. Subclasses must implement this.
     * @returns The method name.
     */
    protected getMethodName(): string;
    /**
     * Private helper to parse the API response.
     * @param response - The response from the API.
     * @param framesChunk - Frame chunk sent, already in shape (n_frames, 40, 40, 3).
     * @returns A VitalLensResult
     */
    private _parseAPIResponse;
    /**
     * Sends a buffer of frames to the VitalLens API via the selected client and processes the response.
     * @param framesChunk - Frame chunk to send, already in shape (n_frames, 40, 40, 3).
     * @param mode - The inference mode.
     * @param state - Optional recurrent state from the previous API call.
     * @param bufferSize - Optional current size of the buffer.
     * @returns A promise that resolves to the processed result.
     */
    process(framesChunk: Frame, mode: InferenceMode, state?: Float32Array, bufferSize?: number): Promise<VitalLensResult | undefined>;
}
//# sourceMappingURL=VitalLensAPIHandler.d.ts.map