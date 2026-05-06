import { getCoreSync } from '../core/wasmProvider';
export class VitalMetadataCache {
    static cache = {};
    static getMeta(id) {
        if (this.cache[id])
            return this.cache[id];
        try {
            const core = getCoreSync();
            const meta = core.getVitalInfo(id);
            if (meta) {
                this.cache[id] = meta;
                return meta;
            }
        }
        catch {
            // ignore
        }
        return null;
    }
}
