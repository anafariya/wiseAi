import { VitalLens } from '../core/VitalLens.browser';
import { VitalLensOptions, VitalLensResult, Vital } from '../types';
export type SessionState = 'idle' | 'searching' | 'warmingUp' | 'tracking' | 'recovering' | 'issue' | 'completed';
export declare abstract class VitalLensBase extends HTMLElement {
    protected vitalLensInstance?: VitalLens;
    protected apiKey: string | null;
    protected proxyUrl: string | null;
    protected latestResult: VitalLensResult | null;
    protected isProcessingFlag: boolean;
    protected supportedVitals: Vital[];
    protected readonly VITAL_CONF_THRESHOLD = 0.8;
    protected readonly FACE_CONF_THRESHOLD = 0.5;
    protected readonly HRV_CONF_THRESHOLD = 0.7;
    constructor();
    protected abstract getElements(): void;
    protected abstract updateUI(result: VitalLensResult): void;
    protected abstract resetUI(): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected initVitalLensInstance(options?: Partial<VitalLensOptions>): Promise<void>;
    private handleVitalLensResults;
    protected handleStreamReset(event: {
        message: string;
    }): void;
    protected updateHRVDisplay(): void;
    protected showError(message: string): void;
    protected isFaceGood(result: VitalLensResult, videoWidth: number, videoHeight: number): boolean;
    protected resolveFeedbackState(currentState: SessionState, result: VitalLensResult, faceConfHistory: number[], ppgConfHistory: number[], fps: number, videoWidth: number, videoHeight: number, hasEnoughData: boolean): {
        state: SessionState;
        message: string;
    };
    destroy(): void;
}
//# sourceMappingURL=VitalLensBase.d.ts.map