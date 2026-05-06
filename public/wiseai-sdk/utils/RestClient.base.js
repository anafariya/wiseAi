import { float32ArrayToBase64, uint8ArrayToBase64 } from './arrayOps';
/**
 * Utility class for managing REST communication.
 */
export class RestClientBase {
    proxyUrl = null;
    apiKey;
    constructor(apiKey, proxyUrl) {
        this.proxyUrl = proxyUrl ?? null;
        this.apiKey = apiKey;
    }
    /**
     * Handles the HTTP response, throwing an error for non-OK status codes.
     * @param response - The Fetch API response object.
     * @returns The JSON-parsed response body.
     */
    async handleResponse(response) {
        const bodyText = await response.text(); // Read the response body as text
        const structuredResponse = {
            statusCode: response.status,
            body: {},
        };
        try {
            // Parse the text and cast it to VitalLensResult
            structuredResponse.body = JSON.parse(bodyText);
        }
        catch (error) {
            console.error('Error parsing JSON:', error);
        }
        return structuredResponse;
    }
    /**
     * Sends frames to the VitalLens API for estimation.
     * @param metadata - The metadata object.
     * @param frames - The raw frame data as a Uint8Array.
     * @param mode - The inference mode ('file' or 'stream').
     * @param state - The state data as a Float32Array (optional).
     * @returns The server's response as a JSON-parsed object.
     */
    async sendFrames(metadata, frames, mode, state) {
        if (mode === 'stream') {
            // Stream mode: binary (application/octet-stream)
            // Put metadata and state in the headers.
            const customHeaders = {};
            Object.entries(metadata).forEach(([key, value]) => {
                customHeaders[`X-${key.charAt(0).toUpperCase() + key.slice(1)}`] =
                    String(value);
            });
            if (state) {
                customHeaders['X-State'] = float32ArrayToBase64(state);
            }
            const compressedFrames = await this.compress(frames);
            // Capture the start time
            const response = await this.postRequest(customHeaders, compressedFrames, mode);
            return response;
        }
        else {
            // File mode: JSON (base64 encoding)
            const base64Frames = uint8ArrayToBase64(frames);
            const payload = {
                video: base64Frames,
                ...metadata,
            };
            if (state) {
                payload.state = float32ArrayToBase64(state);
            }
            return this.postRequest({}, payload, mode);
        }
    }
}
