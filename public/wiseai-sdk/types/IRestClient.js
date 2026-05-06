/**
 * Type guard to check if an object is an IRestClient.
 * @param client - The object to check.
 * @returns True if the object implements IRestClient.
 */
export function isRestClient(client) {
    if (typeof client !== 'object' || client === null) {
        return false;
    }
    const candidate = client;
    return (typeof candidate.sendFrames === 'function' &&
        typeof candidate.connect !== 'function');
}
