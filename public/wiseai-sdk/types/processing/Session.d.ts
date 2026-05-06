import { MethodConfig, VitalLensOptions, VitalLensResult } from '../types/core';
export declare class Session {
    private wasmSession;
    private methodConfig;
    private options;
    constructor(core: any, methodConfig: MethodConfig, options: VitalLensOptions);
    processIncrementalResult(incrementalResult: VitalLensResult, defaultWaveformMode: string, returnResult?: boolean): Promise<VitalLensResult | null>;
    getResult(): Promise<VitalLensResult>;
    getEmptyResult(): VitalLensResult;
    reset(): void;
}
//# sourceMappingURL=Session.d.ts.map