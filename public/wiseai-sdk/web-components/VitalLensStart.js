import template from './start.html';
const logoUrl = '/wiseai.jpg';
export class VitalLensStart extends HTMLElement {
    mode = 'eco';
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = template;
    }
    connectedCallback() {
        this.shadowRoot.querySelector('#logo').src = logoUrl;
        // Apply attributes
        this.shadowRoot.querySelector('#titleEl').textContent =
            this.getAttribute('title-text') || 'WiseAI';
        this.shadowRoot.querySelector('#subtitleEl').innerHTML =
            this.getAttribute('subtitle') || '';
        this.shadowRoot.querySelector('#timingHintEl').innerHTML =
            this.getAttribute('timing-hint') || '';
        this.shadowRoot.querySelector('#startBtn').textContent =
            this.getAttribute('button-label') || 'Start';
        if (this.hasAttribute('hide-mode-toggle')) {
            this.shadowRoot.querySelector('#modeToggle').style.display = 'none';
        }
        // Bind events
        this.shadowRoot.querySelector('#startBtn').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('start'));
        });
        this.shadowRoot.querySelector('#modeToggle').addEventListener('click', () => {
            this.mode = this.mode === 'eco' ? 'standard' : 'eco';
            this.updateModeUI();
            this.dispatchEvent(new CustomEvent('modechange', { detail: { mode: this.mode } }));
        });
        this.updateModeUI();
    }
    updateModeUI() {
        const isEco = this.mode === 'eco';
        this.shadowRoot.querySelector('#ecoIcon').classList.toggle('active', isEco);
        this.shadowRoot.querySelector('#stdIcon').classList.toggle('active', !isEco);
        this.shadowRoot.querySelector('#modeTitle').textContent = isEco
            ? 'Eco Mode'
            : 'Standard Mode';
        this.shadowRoot.querySelector('#modeDesc').textContent = isEco
            ? 'Standard accuracy, for slower connections'
            : 'High accuracy, for fast connections';
    }
}
customElements.define('wiseai-start', VitalLensStart);
