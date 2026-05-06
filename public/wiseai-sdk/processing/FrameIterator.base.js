/**
 * Abstract base class for frame iterators.
 * Handles the logic for extracting frames from a source (e.g., MediaStream or file).
 * Implements IFrameIterator to expose ID functionality.
 */
export class FrameIteratorBase {
    isClosed = false;
    id;
    constructor() {
        // Generate a unique ID for each iterator
        this.id = crypto.randomUUID();
    }
    /**
     * Stops the iterator by releasing resources.
     */
    stop() {
        this.isClosed = true;
    }
    /**
     * Implements the async iterator protocol.
     * @returns An async iterator for frames.
     */
    [Symbol.asyncIterator]() {
        return {
            next: async () => {
                if (this.isClosed) {
                    return { value: null, done: true };
                }
                const frame = await this.next();
                if (frame === null) {
                    this.stop();
                    return { value: null, done: true };
                }
                return { value: frame, done: false };
            },
        };
    }
    /**
     * Returns the unique ID of this iterator.
     * @returns The unique ID string.
     */
    getId() {
        return this.id;
    }
}
