import { VitalLensControllerBase } from './VitalLensController.base';
import { MethodConfig, VitalLensOptions, VitalLensResult } from '../types/core';
import { IRestClient } from '../types/IRestClient';
import { MethodHandler } from '../methods/MethodHandler';
import { BufferManager } from '../processing/BufferManager';
import { IFrameIterator } from '../types/IFrameIterator';
import { IStreamProcessor } from '../types/IStreamProcessor';
import { IFFmpegWrapper } from '../types/IFFmpegWrapper';
import { IFaceDetectionWorker } from '../types/IFaceDetectionWorker';
export declare class VitalLensController extends VitalLensControllerBase {
    protected createRestClient(apiKey: string, proxyUrl?: string): IRestClient;
    protected createFFmpegWrapper(): IFFmpegWrapper;
    protected createFaceDetectionWorker(): IFaceDetectionWorker;
    protected createStreamProcessor(options: VitalLensOptions, getConfig: () => MethodConfig, frameIterator: IFrameIterator, bufferManager: BufferManager, faceDetectionWorker: IFaceDetectionWorker | null, methodHandler: MethodHandler, onPredict: (result: VitalLensResult) => Promise<void>, onNoFace: () => Promise<void>, onStreamReset: () => Promise<void>, onFaceDetected?: (face: {
        coordinates: [number, number, number, number];
        confidence: number;
    } | null) => void): IStreamProcessor;
}
//# sourceMappingURL=VitalLensController.browser.d.ts.map