import { Frame } from './Frame';
import { FrameIteratorBase } from './FrameIterator.base';
/**
 * Frame iterator for MediaStreams (e.g., live video from a webcam).
 */
export declare class StreamFrameIterator extends FrameIteratorBase {
    private videoElement;
    private stream;
    constructor(stream?: MediaStream, existingVideoElement?: HTMLVideoElement);
    /**
     * Starts the iterator by initializing the video element and playing the stream.
     */
    start(): Promise<void>;
    /**
     * Retrieves the next frame from the video stream.
     * @returns A promise resolving to the next frame or null if the iterator is closed.
     */
    next(): Promise<Frame | null>;
    /**
     * Stops the iterator by pausing the video element and stopping the stream.
     */
    stop(): void;
}
//# sourceMappingURL=StreamFrameIterator.d.ts.map