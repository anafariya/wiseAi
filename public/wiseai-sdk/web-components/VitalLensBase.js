import { VitalLens } from '../core/VitalLens.browser';
export class VitalLensBase extends HTMLElement {
    vitalLensInstance;
    apiKey = null;
    proxyUrl = null;
    latestResult = null;
    isProcessingFlag = false;
    supportedVitals = [];
    VITAL_CONF_THRESHOLD = 0.8;
    FACE_CONF_THRESHOLD = 0.5;
    HRV_CONF_THRESHOLD = 0.7;
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Redirect console.error to show in a UI popup
        const originalConsoleError = console.error.bind(console);
        console.error = (...args) => {
            originalConsoleError(...args);
            this.showError(args.join(' '));
        };
    }
    connectedCallback() {
        // This will be called by subclasses after they load their HTML
        if (this.shadowRoot.innerHTML) {
            this.getElements();
            this.apiKey = this.getAttribute('api-key');
            this.proxyUrl = this.getAttribute('proxy-url');
        }
    }
    disconnectedCallback() {
        this.destroy();
    }
    async initVitalLensInstance(options = {}) {
        if (this.vitalLensInstance) {
            await this.vitalLensInstance.close();
        }
        const vitalLensOptions = {
            method: 'wiseai',
            apiKey: this.apiKey ?? undefined,
            proxyUrl: this.proxyUrl ?? undefined,
            waveformMode: 'incremental',
            ...options,
        };
        try {
            this.vitalLensInstance = new VitalLens(vitalLensOptions);
            this.vitalLensInstance.addEventListener('vitals', (result) => this.handleVitalLensResults(result));
            this.vitalLensInstance.addEventListener('streamReset', (event) => this.handleStreamReset(event));
            setTimeout(() => {
                if (this.vitalLensInstance) {
                    this.supportedVitals = this.vitalLensInstance.getSupportedVitals();
                    this.updateHRVDisplay();
                }
            }, 500);
        }
        catch (e) {
            console.error(e);
            this.showError(e.message);
        }
    }
    handleVitalLensResults(result) {
        this.latestResult = result;
        // Re-check vitals in case of dynamic model changes
        if (this.vitalLensInstance) {
            this.supportedVitals = this.vitalLensInstance.getSupportedVitals();
        }
        this.updateUI(result);
        this.updateHRVDisplay();
    }
    handleStreamReset(event) {
        this.showError(event.message);
        this.isProcessingFlag = false; // Stop the processing state
        this.resetUI();
    }
    updateHRVDisplay() {
        const hrvContainer = this.shadowRoot?.querySelector('#hrv-container');
        if (hrvContainer) {
            if (!this.supportedVitals)
                return;
            const hasHrv = this.supportedVitals.some((v) => v.startsWith('hrv_'));
            hrvContainer.style.display = hasHrv ? 'flex' : 'none';
        }
    }
    showError(message) {
        const errorPopup = this.shadowRoot?.querySelector('#errorPopup');
        if (errorPopup) {
            errorPopup.textContent = message;
            errorPopup.style.display = 'block';
            setTimeout(() => {
                errorPopup.style.display = 'none';
            }, 10000);
        }
    }
    isFaceGood(result, videoWidth, videoHeight) {
        if (!result.face?.coordinates || result.face.coordinates.length === 0)
            return false;
        const coords = result.face.coordinates[result.face.coordinates.length - 1];
        const [x0, y0, x1, y1] = coords;
        if (!videoWidth || !videoHeight)
            return false;
        const cx = (x0 + x1) / 2 / videoWidth;
        const cy = (y0 + y1) / 2 / videoHeight;
        const w = (x1 - x0) / videoWidth;
        return cx > 0.3 && cx < 0.7 && cy > 0.3 && cy < 0.7 && w > 0.15;
    }
    resolveFeedbackState(currentState, result, faceConfHistory, ppgConfHistory, fps, videoWidth, videoHeight, hasEnoughData) {
        const samplesInOneSecond = Math.round(fps);
        const lastSecFaceConf = faceConfHistory.slice(-samplesInOneSecond);
        const avgFaceConf = lastSecFaceConf.length
            ? lastSecFaceConf.reduce((a, b) => a + b, 0) / lastSecFaceConf.length
            : 0.0;
        const lastSecPpgConf = ppgConfHistory.slice(-samplesInOneSecond);
        const avgPpgConf = lastSecPpgConf.length
            ? lastSecPpgConf.reduce((a, b) => a + b, 0) / lastSecPpgConf.length
            : 0.0;
        const isLowSignal = avgPpgConf < this.VITAL_CONF_THRESHOLD ||
            avgFaceConf < this.FACE_CONF_THRESHOLD;
        const goodFace = this.isFaceGood(result, videoWidth, videoHeight);
        if (currentState === 'searching' && goodFace) {
            return { state: 'warmingUp', message: 'Calibrating... Hold still.' };
        }
        if (!goodFace) {
            return { state: 'recovering', message: 'Adjust your position.' };
        }
        if (isLowSignal) {
            return {
                state: 'recovering',
                message: 'Low confidence. Improve lighting and hold still.',
            };
        }
        if (!hasEnoughData) {
            return { state: 'warmingUp', message: 'Calibrating... Hold still.' };
        }
        return { state: 'tracking', message: 'Scanning...' };
    }
    destroy() {
        if (this.vitalLensInstance) {
            this.vitalLensInstance
                .close()
                .catch((e) => console.error('Error closing VitalLens instance:', e));
        }
        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = '';
        }
    }
}
