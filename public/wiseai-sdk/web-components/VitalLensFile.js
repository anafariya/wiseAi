import { VitalLensBase } from './VitalLensBase';
import { VitalMetadataCache } from '../utils/VitalMetadataCache';
import template from './file.html';
export class VitalLensFile extends VitalLensBase {
    state = 'idle';
    startScreen;
    processingScreen;
    resultScreen;
    errorScreen;
    progressText;
    errorText;
    fileInput;
    retryBtn;
    constructor() {
        super();
        this.shadowRoot.innerHTML = template;
    }
    connectedCallback() {
        super.connectedCallback();
        this.startScreen.addEventListener('start', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        this.resultScreen.addEventListener('done', () => this.resetToIdle());
        this.retryBtn.addEventListener('click', () => this.resetToIdle());
        this.startScreen.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        this.startScreen.addEventListener('drop', (e) => {
            e.preventDefault();
            const dragEvent = e;
            if (dragEvent.dataTransfer?.files?.length) {
                this.fileInput.files = dragEvent.dataTransfer.files;
                this.fileInput.dispatchEvent(new Event('change'));
            }
        });
        this.transitionState('idle');
    }
    getElements() {
        this.startScreen = this.shadowRoot.querySelector('#startScreen');
        this.processingScreen =
            this.shadowRoot.querySelector('#processingScreen');
        this.resultScreen = this.shadowRoot.querySelector('#resultScreen');
        this.errorScreen = this.shadowRoot.querySelector('#errorScreen');
        this.progressText = this.shadowRoot.querySelector('#progressText');
        this.errorText = this.shadowRoot.querySelector('#errorText');
        this.fileInput = this.shadowRoot.querySelector('#fileInput');
        this.retryBtn = this.shadowRoot.querySelector('#retryBtn');
    }
    async handleFileSelection(event) {
        const target = event.target;
        if (!target.files || target.files.length === 0)
            return;
        const file = target.files[0];
        if (!file.type.startsWith('video/')) {
            this.showFileError('Please select a valid video file.');
            return;
        }
        this.transitionState('processing');
        this.progressText.textContent = 'Processing video...';
        try {
            await this.initVitalLensInstance({ waveformMode: 'global' });
            this.vitalLensInstance.addEventListener('fileProgress', (msg) => {
                this.progressText.textContent = msg;
            });
            const result = await this.vitalLensInstance.processVideoFile(file);
            this.showResults(result);
        }
        catch (err) {
            console.error(err);
            this.showFileError(err.message || 'An error occurred during processing.');
        }
        finally {
            // Clear the input value so the same file can be selected again if needed
            this.fileInput.value = '';
        }
    }
    transitionState(newState) {
        this.state = newState;
        this.startScreen.style.display = newState === 'idle' ? 'block' : 'none';
        this.processingScreen.style.display =
            newState === 'processing' ? 'flex' : 'none';
        this.resultScreen.style.display =
            newState === 'completed' ? 'block' : 'none';
        this.errorScreen.style.display = newState === 'error' ? 'flex' : 'none';
    }
    showFileError(message) {
        this.errorText.textContent = message;
        this.transitionState('error');
    }
    resetToIdle() {
        this.transitionState('idle');
        if (this.resultScreen && 'destroyCharts' in this.resultScreen) {
            this.resultScreen.destroyCharts();
        }
        if (this.vitalLensInstance) {
            this.vitalLensInstance.close();
            this.vitalLensInstance = undefined;
        }
    }
    showResults(result) {
        const vs = result.vitals;
        const wf = result.waveforms;
        const getConf = (v) => Array.isArray(v?.confidence)
            ? v.confidence[v.confidence.length - 1]
            : (v?.confidence ?? 0);
        const hrConf = getConf(vs.heart_rate);
        const rrConf = getConf(vs.respiratory_rate);
        const sdnnConf = getConf(vs.hrv_sdnn);
        const rmssdConf = getConf(vs.hrv_rmssd);
        const faceConfs = result.face.confidence ?? [];
        const avgFace = faceConfs.length
            ? faceConfs.reduce((a, b) => a + b, 0) / faceConfs.length
            : 0;
        let duration = 0;
        if (result.time && result.time.length > 1) {
            duration = result.time[result.time.length - 1] - result.time[0];
        }
        const sampleCount = result.n ?? result.time?.length ?? 0;
        const buildVital = (id, value, conf, format, useShortTitle = false) => {
            const meta = VitalMetadataCache.getMeta(id);
            const title = useShortTitle
                ? meta?.short_name || meta?.shortName || id
                : meta?.display_name || meta?.displayName || id;
            return {
                id,
                title,
                value: value ?? null,
                unit: (meta?.unit || '').toUpperCase(),
                format,
                confidence: conf,
                emoji: meta?.emoji || '',
            };
        };
        const primaryVitals = [
            buildVital('heart_rate', hrConf >= this.VITAL_CONF_THRESHOLD ? vs.heart_rate?.value : null, hrConf, '%.0f', false),
            buildVital('respiratory_rate', rrConf >= this.VITAL_CONF_THRESHOLD ? vs.respiratory_rate?.value : null, rrConf, '%.0f', false),
        ];
        const secondaryVitals = [
            buildVital('hrv_sdnn', sdnnConf >= this.HRV_CONF_THRESHOLD ? vs.hrv_sdnn?.value : null, sdnnConf, '%.0f', true),
            buildVital('hrv_rmssd', rmssdConf >= this.HRV_CONF_THRESHOLD ? vs.hrv_rmssd?.value : null, rmssdConf, '%.0f', true),
        ].filter((v) => v.value !== null);
        if (this.resultScreen && 'destroyCharts' in this.resultScreen) {
            this.resultScreen.destroyCharts();
        }
        this.resultScreen.resultData = {
            primaryVitals,
            secondaryVitals,
            stats: { duration, sampleCount, avgFaceConf: avgFace },
            ppgWaveform: wf.ppg_waveform?.data,
            respWaveform: wf.respiratory_waveform?.data,
        };
        this.transitionState('completed');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateUI(_result) { }
    resetUI() {
        this.resetToIdle();
    }
}
try {
    if (!customElements.get('wiseai-file')) {
        customElements.define('wiseai-file', VitalLensFile);
    }
}
catch {
    // Silent: Duplicate registration
}
