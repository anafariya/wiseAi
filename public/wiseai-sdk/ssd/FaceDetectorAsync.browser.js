import tf from 'tfjs-provider';
import { FaceDetectorAsyncBase } from './FaceDetectorAsync.base';
import { modelJsonPath, modelBinPath } from './modelAssets';
import { resolveAsset } from '../utils/assetResolver';
export class FaceDetectorAsync extends FaceDetectorAsyncBase {
    jsonUrl;
    binUrl;
    constructor(maxFaces = 1, scoreThreshold = 0.5, iouThreshold = 0.3, jsonUrl, binUrl) {
        super(maxFaces, scoreThreshold, iouThreshold);
        this.jsonUrl = jsonUrl;
        this.binUrl = binUrl;
    }
    async init() {
        try {
            let finalJsonUrl = this.jsonUrl || resolveAsset(modelJsonPath);
            let finalBinUrl = this.binUrl || resolveAsset(modelBinPath);
            let jsonResponse = await fetch(finalJsonUrl);
            const contentType = jsonResponse.headers.get('content-type');
            if (!jsonResponse.ok ||
                (contentType && contentType.includes('text/html'))) {
                console.warn('Local model fetch failed (likely due to bundler). Falling back to CDN...');
                finalJsonUrl = `https://cdn.jsdelivr.net/npm/vitallens/dist/${modelJsonPath}`;
                finalBinUrl = `https://cdn.jsdelivr.net/npm/vitallens/dist/${modelBinPath}`;
                jsonResponse = await fetch(finalJsonUrl);
            }
            const binResponse = await fetch(finalBinUrl);
            if (!jsonResponse.ok)
                throw new Error(`Failed to fetch JSON: ${jsonResponse.status} ${jsonResponse.statusText}`);
            if (!binResponse.ok)
                throw new Error(`Failed to fetch BIN: ${binResponse.status} ${binResponse.statusText}`);
            const jsonObj = await jsonResponse.json();
            const binBuffer = await binResponse.arrayBuffer();
            const weightSpecs = jsonObj.weightsManifest[0].weights;
            const modelArtifacts = {
                modelTopology: jsonObj.modelTopology ?? jsonObj,
                weightSpecs,
                weightData: binBuffer,
                format: 'graph-model',
            };
            this.model = await tf.loadGraphModel(tf.io.fromMemory(modelArtifacts));
        }
        catch (error) {
            console.error('Failed to load the face detection model (Browser):', error);
        }
    }
}
