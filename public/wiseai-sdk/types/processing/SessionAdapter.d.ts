import { MethodConfig, VitalLensResult } from '../types/core';
export declare function toSessionConfig(methodConfig: MethodConfig, overrideFpsTarget?: number): {
    model_name: import("../types/core").Method;
    supported_vitals: import("../types/core").Vital[];
    fps_target: number;
    input_size: number;
    n_inputs: number;
    roi_method: "face" | "upper_body" | "upper_body_cropped" | "forehead";
    return_waveforms: import("../types/core").Vital[];
};
export declare function toSessionInput(result: VitalLensResult): {
    face: unknown;
    signals: Record<string, unknown>;
    timestamp: number[];
};
interface WasmResult {
    timestamp?: number[];
    message?: string;
    fps?: number;
    face?: {
        coordinates?: [number, number, number, number][];
        confidence?: number[];
        note?: string;
    };
    waveforms?: Record<string, {
        data: number[];
        confidence: number[];
        unit: string;
        note: string;
    }>;
    vitals?: Record<string, {
        value: number;
        confidence: number;
        unit: string;
        note: string;
    }>;
}
export declare function toVitalLensResult(wasmResult: WasmResult, incrementalResult?: VitalLensResult): VitalLensResult;
export {};
//# sourceMappingURL=SessionAdapter.d.ts.map