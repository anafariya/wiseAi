import { InferenceMode, VitalLensAPIResponse } from '../types';
import { IRestClient, ResolveModelResponse } from '../types/IRestClient';
/**
 * Utility class for managing REST communication.
 */
export declare abstract class RestClientBase implements IRestClient {
    protected proxyUrl: string | null;
    protected apiKey: string;
    constructor(apiKey: string, proxyUrl?: string);
    /**
     * Abstract method to get the REST endpoint.
     * @param mode - The inference mode.
     * @returns The REST endpoint.
     */
    protected abstract getRestEndpoint(mode: InferenceMode): string;
    /**
     * Abstract method to resolve the model.
     * @param requestedModel - The requested model (optional)
     */
    abstract resolveModel(requestedModel?: string): Promise<ResolveModelResponse>;
    /**
     * Abstract method for sending HTTP requests.
     * @param headers - The headers.
     * @param body - The body.
     * @param mode - The inference mode ('file' or 'stream').
     * @returns The server's response as a JSON-parsed object.
     */
    protected abstract postRequest(headers: Record<string, string>, body: Record<string, unknown> | Uint8Array, mode: InferenceMode): Promise<VitalLensAPIResponse>;
    /**
     * Abstract method for compressing a Uint8Array.
     * @param data - The binary data to compress.
     * @returns A Promise that resolves with the compressed data as a Uint8Array.
     */
    protected abstract compress(data: Uint8Array): Promise<Uint8Array>;
    /**
     * Handles the HTTP response, throwing an error for non-OK status codes.
     * @param response - The Fetch API response object.
     * @returns The JSON-parsed response body.
     */
    protected handleResponse(response: Response): Promise<VitalLensAPIResponse>;
    /**
     * Sends frames to the VitalLens API for estimation.
     * @param metadata - The metadata object.
     * @param frames - The raw frame data as a Uint8Array.
     * @param mode - The inference mode ('file' or 'stream').
     * @param state - The state data as a Float32Array (optional).
     * @returns The server's response as a JSON-parsed object.
     */
    sendFrames(metadata: Record<string, unknown>, frames: Uint8Array, mode: InferenceMode, state?: Float32Array): Promise<VitalLensAPIResponse>;
}
//# sourceMappingURL=RestClient.base.d.ts.map