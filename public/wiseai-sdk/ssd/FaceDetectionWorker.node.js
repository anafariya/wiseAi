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
        worker.on('message', (msg) => {
            const event = { data: msg };
            if (this.onmessage) {
                this.onmessage(event);
            }
            this.messageHandlers.forEach((handler) => handler(event));
        });
        worker.on('error', (err) => {
            if (this.onerror) {
                const event = {
                    message: err.message,
                    filename: '',
                    lineno: 0,
                    colno: 0,
                    error: err,
                };
                this.onerror(event);
            }
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    postMessage(message, transfer) {
        this.worker.postMessage(message);
    }
    terminate() {
        const result = this.worker.terminate();
        return Promise.resolve(result);
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
