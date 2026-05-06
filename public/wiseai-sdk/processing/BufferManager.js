import { FrameBuffer } from './FrameBuffer';
import { RGBBuffer } from './RGBBuffer';
import { getCoreSync } from '../core/wasmProvider';
export class BufferManager {
    buffers;
    state = null;
    planner = null;
    constructor() {
        this.buffers = new Map();
    }
    ensurePlanner(methodConfig) {
        if (!this.planner) {
            const core = getCoreSync();
            const supportedVitals = methodConfig.supportedVitals || [];
            const sessionConfig = {
                model_name: methodConfig.method,
                supported_vitals: supportedVitals,
                return_waveforms: supportedVitals.filter((v) => v.includes('waveform')),
                fps_target: methodConfig.fpsTarget,
                input_size: methodConfig.inputSize || 40,
                n_inputs: methodConfig.minWindowLengthState || 16,
                roi_method: methodConfig.roiMethod,
            };
            const bufferConfig = core.computeBufferConfig(sessionConfig);
            this.planner = new core.BufferPlanner(bufferConfig);
        }
    }
    processTarget(targetRoi, timestamp, methodConfig) {
        this.ensurePlanner(methodConfig);
        if (!this.planner)
            return null;
        const activeBuffers = Array.from(this.buffers.entries()).map(([id, data]) => ({
            id,
            roi: {
                x: data.roi.x0,
                y: data.roi.y0,
                width: data.roi.x1 - data.roi.x0,
                height: data.roi.y1 - data.roi.y0,
            },
            count: data.buffer.size(),
            created_at: data.createdAt,
            last_seen: data.lastSeen,
        }));
        const rect = {
            x: targetRoi.x0,
            y: targetRoi.y0,
            width: targetRoi.x1 - targetRoi.x0,
            height: targetRoi.y1 - targetRoi.y0,
        };
        const action = this.planner.evaluateTarget(rect, timestamp, activeBuffers);
        if (action.action === 'Create') {
            const newId = crypto.randomUUID();
            let newBuffer;
            if (methodConfig.method.startsWith('vitallens')) {
                newBuffer = new FrameBuffer(targetRoi, methodConfig);
            }
            else {
                newBuffer = new RGBBuffer(targetRoi, methodConfig);
            }
            this.buffers.set(newId, {
                buffer: newBuffer,
                createdAt: timestamp,
                lastSeen: timestamp,
                roi: targetRoi,
            });
            return targetRoi;
        }
        else if (action.action === 'KeepAlive') {
            const matchedId = action.matched_id;
            if (matchedId && this.buffers.has(matchedId)) {
                this.buffers.get(matchedId).lastSeen = timestamp;
                return this.buffers.get(matchedId).roi;
            }
        }
        return null;
    }
    poll(currentTime, mode, flush = false) {
        if (!this.planner)
            return null;
        const activeBuffers = Array.from(this.buffers.entries()).map(([id, data]) => ({
            id,
            roi: {
                x: data.roi.x0,
                y: data.roi.y0,
                width: data.roi.x1 - data.roi.x0,
                height: data.roi.y1 - data.roi.y0,
            },
            count: data.buffer.size(),
            created_at: data.createdAt,
            last_seen: data.lastSeen,
        }));
        const hasState = this.state !== null;
        const plan = this.planner.poll(activeBuffers, currentTime, mode, hasState, flush);
        if (plan.buffers_to_drop) {
            for (const dropId of plan.buffers_to_drop) {
                this.buffers.get(dropId)?.buffer.clear();
                this.buffers.delete(dropId);
            }
        }
        return plan.command;
    }
    async add(frame, overrideRoi) {
        for (const { buffer } of this.buffers.values()) {
            await buffer.add(frame, overrideRoi);
        }
    }
    async consumeCommand(command) {
        const target = this.buffers.get(command.buffer_id);
        if (!target)
            return null;
        return target.buffer.consume(command.take_count, command.keep_count);
    }
    isEmpty() {
        return this.buffers.size === 0;
    }
    cleanup() {
        for (const { buffer } of this.buffers.values()) {
            buffer.clear();
        }
        this.buffers.clear();
        this.state = null;
    }
    setState(state) {
        this.state = state;
    }
    resetState() {
        this.state = null;
    }
    getState() {
        return this.state;
    }
}
