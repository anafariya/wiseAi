import { VitalLensResult } from '../types';
export declare class WaveformPlayer {
    private onUpdate;
    private bufferOffset;
    private windowSize;
    private fps;
    private ppgQueue;
    private respQueue;
    private ppgHistory;
    private ppgConfHistory;
    private respHistory;
    private respConfHistory;
    private timeAnchor;
    private playbackLoopId;
    constructor(onUpdate: (ppgHistory: number[], ppgConfHistory: number[], respHistory: number[], respConfHistory: number[]) => void, bufferOffset?: number, windowSize?: number, fps?: number);
    setFps(fps: number): void;
    addData(result: VitalLensResult): void;
    private start;
    stop(): void;
    reset(): void;
}
//# sourceMappingURL=WaveformPlayer.d.ts.map