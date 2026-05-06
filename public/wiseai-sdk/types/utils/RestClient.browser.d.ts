import { RestClientBase } from './RestClient.base';
import { InferenceMode, VitalLensAPIResponse } from '../types';
import { ResolveModelResponse } from '../types/IRestClient';
export declare class RestClient extends RestClientBase {
    /**
     * Get the REST endpoint.
     * @param mode - The inference mode
     * @returns The REST endpoint.
     */
    protected getRestEndpoint(mode: InferenceMode): string;
    /**
     * Sends a HTTP GET request using the browser's fetch API to resolve which model to use.
     * @param requestedModel - The requested model (optional)
     * @returns The response
     */
    resolveModel(requestedModel?: string): Promise<ResolveModelResponse>;
    /**
     * Sends an HTTP POST request using the browser's fetch API.
     * @param headers - The headers.
     * @param body - The body.
     * @param mode - The inference mode ('file' or 'stream').
     * @returns The server's response as a JSON-parsed object.
     */
    protected postRequest(headers: Record<string, string>, body: Record<string, unknown> | Uint8Array, mode: InferenceMode): Promise<VitalLensAPIResponse>;
    /**
     * Compresses a Uint8Array using the specified COMPRESSION_MODE.
     * @param data - The binary data to compress.
     * @returns A Promise that resolves with the compressed data as a Uint8Array.
     * @throws An error if an unsupported compression mode is specified.
     */
    protected compress(data: Uint8Array): Promise<Uint8Array>;
}
//# sourceMappingURL=RestClient.browser.d.ts.map