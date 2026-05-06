import { VitalLensControllerBase } from './VitalLensController.base';
import { RestClient } from '../utils/RestClient.node';
import { StreamProcessor } from '../processing/StreamProcessor.node';
import faceDetectionWorkerDataURI from '../../dist/faceDetection.worker.node.bundle.js';
import FFmpegWrapper from '../utils/FFmpegWrapper.node';
import { Worker } from 'worker_threads';
import { FaceDetectionWorker } from '../ssd/FaceDetectionWorker.node';
import * as path from 'path';
import { fileURLToPath } from 'url';
function getBaseDir() {
    let currentDir;
    if (typeof __dirname !== 'undefined') {
        currentDir = __dirname;
    }
    else if (typeof import.meta !== 'undefined' && import.meta.url) {
        currentDir = path.dirname(fileURLToPath(import.meta.url));
    }
    else {
        currentDir = process.cwd();
    }
    if (process.env.RUN_INTEGRATION === 'true') {
        return path.resolve(currentDir, '../../dist');
    }
    return currentDir;
}
export class VitalLensController extends VitalLensControllerBase {
    createRestClient(apiKey, proxyUrl) {
        return new RestClient(apiKey, proxyUrl);
    }
    createFFmpegWrapper() {
        return new FFmpegWrapper();
    }
    createFaceDetectionWorker() {
        const code = Buffer.from(faceDetectionWorkerDataURI.split(',')[1], 'base64').toString('utf8');
        const worker = new Worker(code, {
            eval: true,
            workerData: { baseDir: getBaseDir() },
        });
        return new FaceDetectionWorker(worker);
    }
    createStreamProcessor(options, getConfig, frameIterator, bufferManager, faceDetectionWorker, methodHandler, onPredict, onNoFace, onStreamReset, onFaceDetected) {
        return new StreamProcessor(options, getConfig, frameIterator, bufferManager, faceDetectionWorker, methodHandler, onPredict, onNoFace, onStreamReset, onFaceDetected);
    }
}
