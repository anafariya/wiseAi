import { FaceDetectorAsyncBase } from './FaceDetectorAsync.base';
export declare class FaceDetectorAsync extends FaceDetectorAsyncBase {
    private jsonUrl?;
    private binUrl?;
    constructor(maxFaces?: number, scoreThreshold?: number, iouThreshold?: number, jsonUrl?: string | undefined, binUrl?: string | undefined);
    protected init(): Promise<void>;
}
//# sourceMappingURL=FaceDetectorAsync.browser.d.ts.map