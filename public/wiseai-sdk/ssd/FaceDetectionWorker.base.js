export class FaceDetectionWorkerBase {
    /**
     * Convenience method to send a detection request.
     * @param data - The input data (may be a Frame or a File/Blob)
     * @param dataType - Either 'frame' for Frame or 'video' for File/Blob
     * @param fs - Target frequency for face detection
     * @param timestamp - Optional timestamp
     * @returns Promise resolving to detections and probeInfo
     */
    async detectFaces(data, dataType, fs, timestamp) {
        return new Promise((resolve, reject) => {
            const requestId = Date.now() + Math.random();
            const onMessage = (evt) => {
                const response = evt.data;
                // Only process messages that are objects with an "id" field.
                if (!response || typeof response !== 'object' || !('id' in response)) {
                    return;
                }
                if (response.id === requestId) {
                    // Use non-null assertion (or store the handler in a local variable)
                    this.removeEventListener?.('message', onMessage);
                    if (response.error) {
                        reject(new Error(response.error));
                    }
                    else {
                        resolve({
                            detections: response.detections,
                            probeInfo: response.probeInfo,
                        });
                    }
                }
            };
            this.addEventListener?.('message', onMessage);
            this.postMessage({
                id: requestId,
                data,
                dataType,
                fs,
                timestamp,
            });
        });
    }
}
