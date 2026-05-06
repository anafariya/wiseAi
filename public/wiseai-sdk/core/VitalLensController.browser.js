import { VitalLensControllerBase } from './VitalLensController.base';
import { RestClient } from '../utils/RestClient.browser';
import { StreamProcessor } from '../processing/StreamProcessor.browser';
import faceDetectionWorkerDataURI from '../../dist/faceDetection.worker.browser.bundle.js';
import FFmpegWrapper from '../utils/FFmpegWrapper.browser';
import { FaceDetectionWorker } from '../ssd/FaceDetectionWorker.browser';
import { createWorkerBlobURL } from '../utils/workerOps';
import { FFMPEG_CORE_URL, FFMPEG_WASM_URL, } from '../utils/FFmpegAssets.browser';
export class VitalLensController extends VitalLensControllerBase {
    createRestClient(apiKey, proxyUrl) {
        return new RestClient(apiKey, proxyUrl);
    }
    createFFmpegWrapper() {
        return new FFmpegWrapper(FFMPEG_CORE_URL, FFMPEG_WASM_URL);
    }
    createFaceDetectionWorker() {
        const blobURL = createWorkerBlobURL(faceDetectionWorkerDataURI);
        const worker = new Worker(blobURL, { type: 'module' });
        let baseURL = window.location.href;
        try {
            if (typeof import.meta !== 'undefined' && import.meta.url) {
                baseURL = import.meta.url;
            }
        }
        catch {
            /* ignore */
        }
        worker.postMessage({
            type: 'init',
            baseURL,
            coreURL: FFMPEG_CORE_URL,
            wasmURL: FFMPEG_WASM_URL,
        });
        return new FaceDetectionWorker(worker);
    }
    createStreamProcessor(options, getConfig, frameIterator, bufferManager, faceDetectionWorker, methodHandler, onPredict, onNoFace, onStreamReset, onFaceDetected) {
        return new StreamProcessor(options, getConfig, frameIterator, bufferManager, faceDetectionWorker, methodHandler, onPredict, onNoFace, onStreamReset, onFaceDetected);
    }
}
