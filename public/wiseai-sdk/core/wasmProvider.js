import init, * as VitalLensCore from 'vitallens-core';
import wasmUri from 'vitallens-core/vitallens_core_bg.wasm';
let initPromise = null;
let resolvedCore = null;
const extractDefault = (obj) => {
    if (obj && typeof obj === 'object' && 'default' in obj) {
        return obj.default;
    }
    return undefined;
};
export function getCore() {
    if (!initPromise) {
        let initFn = init;
        if (typeof initFn !== 'function') {
            const initDefault = extractDefault(initFn);
            if (typeof initDefault === 'function') {
                initFn = initDefault;
            }
            else {
                const coreDefault = extractDefault(VitalLensCore);
                if (typeof coreDefault === 'function') {
                    initFn = coreDefault;
                }
                else {
                    const initDefaultDefault = extractDefault(initDefault);
                    if (typeof initDefaultDefault === 'function') {
                        initFn = initDefaultDefault;
                    }
                }
            }
        }
        if (typeof initFn !== 'function') {
            console.error('Failed to resolve init function. init:', init);
            throw new Error('Could not resolve WebAssembly init function.');
        }
        const callableInitFn = initFn;
        initPromise = callableInitFn({
            module_or_path: wasmUri,
        }).then(() => {
            resolvedCore = VitalLensCore;
            return VitalLensCore;
        });
    }
    return initPromise;
}
export function getCoreSync() {
    if (!resolvedCore) {
        throw new Error('VitalLensCore is not initialized. Call await getCore() first.');
    }
    return resolvedCore;
}
