import { FaceDetectionWorkerBase } from './FaceDetectionWorker.base';
export declare class FaceDetectionWorker extends FaceDetectionWorkerBase {
    private worker;
    private messageHandlers;
    onmessage: ((ev: MessageEvent) => unknown) | null;
    onmessageerror: ((ev: MessageEvent) => unknown) | null;
    onerror: ((ev: ErrorEvent) => unknown) | null;
    constructor(worker: Worker);
    postMessage(message: unknown, transfer?: Transferable[]): void;
    terminate(): Promise<number>;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}
//# sourceMappingURL=FaceDetectionWorker.browser.d.ts.map