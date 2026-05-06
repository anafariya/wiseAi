import { IFrameIterator } from '../types/IFrameIterator';
import { Frame } from './Frame';
/**
 * Abstract base class for frame iterators.
 * Handles the logic for extracting frames from a source (e.g., MediaStream or file).
 * Implements IFrameIterator to expose ID functionality.
 */
export declare abstract class FrameIteratorBase implements IFrameIterator {
    protected isClosed: boolean;
    private id;
    constructor();
    /**
     * Starts the iterator by initializing resources (e.g., stream or file reader).
     */
    abstract start(): Promise<void>;
    /**
     * Stops the iterator by releasing resources.
     */
    stop(): void;
    /**
     * Abstract method for retrieving the next tensor frame.
     * @returns A promise resolving to the next tensor or null if the iterator is stopped.
     */
    abstract next(): Promise<Frame | null>;
    /**
     * Implements the async iterator protocol.
     * @returns An async iterator for frames.
     */
    [Symbol.asyncIterator](): AsyncIterator<Frame>;
    /**
     * Returns the unique ID of this iterator.
     * @returns The unique ID string.
     */
    getId(): string;
}
//# sourceMappingURL=FrameIterator.base.d.ts.map