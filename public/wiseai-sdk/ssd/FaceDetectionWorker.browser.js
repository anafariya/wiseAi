import { FaceDetectionWorkerBase } from './FaceDetectionWorker.base';
export class FaceDetectionWorker extends FaceDetectionWorkerBase {
    worker;
    messageHandlers = [];
    onmessage = null;
    onmessageerror = null;
    onerror = null;
    constructor(worker) {
        super();
        this.worker = worker;
        worker.onmessage = (ev) => {
            if (this.onmessage)
                this.onmessage(ev);
            this.messageHandlers.forEach((handler) => handler(ev));
        };
        worker.onerror = (ev) => {
            if (this.onerror)
                this.onerror(ev);
        };
    }
    postMessage(message, transfer) {
        this.worker.postMessage(message, transfer ?? []);
    }
    terminate() {
        this.worker.terminate();
        return Promise.resolve(0);
    }
    addEventListener(type, listener) {
        if (type === 'message' && typeof listener === 'function') {
            this.messageHandlers.push(listener);
        }
    }
    removeEventListener(type, listener) {
        if (type === 'message' && typeof listener === 'function') {
            this.messageHandlers = this.messageHandlers.filter((l) => l !== listener);
        }
    }
}
