import { toSessionConfig, toSessionInput, toVitalLensResult, } from './SessionAdapter';
export class Session {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wasmSession;
    methodConfig;
    options;
    constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    core, methodConfig, options) {
        this.methodConfig = methodConfig;
        this.options = options;
        const config = toSessionConfig(methodConfig, options.overrideFpsTarget);
        this.wasmSession = new core.Session(config);
    }
    async processIncrementalResult(incrementalResult, defaultWaveformMode, returnResult = true) {
        const time = incrementalResult.time ?? [];
        if (time.length === 0)
            return null;
        const sessionInput = toSessionInput(incrementalResult);
        // TODO: Expose waveform window configuration to users (e.g., allow custom duration).
        const reqMode = this.options.waveformMode || defaultWaveformMode;
        let wasmMode = 'Incremental';
        if (reqMode === 'global') {
            wasmMode = 'Global';
        }
        else if (reqMode === 'windowed') {
            wasmMode = { Windowed: { seconds: 10.0 } };
        }
        const wasmResult = this.wasmSession.processJs(sessionInput, wasmMode);
        if (returnResult) {
            return toVitalLensResult(wasmResult, incrementalResult);
        }
        return null;
    }
    async getResult() {
        const wasmResult = this.wasmSession.processJs({ timestamp: [], signals: {} }, 'Global');
        return toVitalLensResult(wasmResult);
    }
    getEmptyResult() {
        return {
            face: {},
            vitals: {},
            waveforms: {},
            time: [],
            message: 'Prediction is empty because no face was detected.',
        };
    }
    reset() {
        this.wasmSession.reset();
    }
}
