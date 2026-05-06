import { MethodConfig, ROI } from '../types/core';
import { Frame } from './Frame';
interface BufferCommand {
    buffer_id: string;
    take_count: number;
    keep_count: number;
}
export declare class BufferManager {
    private buffers;
    private state;
    private planner;
    constructor();
    private ensurePlanner;
    processTarget(targetRoi: ROI, timestamp: number, methodConfig: MethodConfig): ROI | null;
    poll(currentTime: number, mode: 'Stream' | 'File', flush?: boolean): BufferCommand | undefined | null;
    add(frame: Frame, overrideRoi?: ROI): Promise<void>;
    consumeCommand(command: BufferCommand): Promise<Frame | null>;
    isEmpty(): boolean;
    cleanup(): void;
    setState(state: Float32Array): void;
    resetState(): void;
    getState(): Float32Array | null;
}
export {};
//# sourceMappingURL=BufferManager.d.ts.map