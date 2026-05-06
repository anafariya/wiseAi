import { VitalLensBase } from './VitalLensBase';
import { VitalLensResult } from '../types';
export declare class VitalLensFile extends VitalLensBase {
    private state;
    private startScreen;
    private processingScreen;
    private resultScreen;
    private errorScreen;
    private progressText;
    private errorText;
    private fileInput;
    private retryBtn;
    constructor();
    connectedCallback(): void;
    protected getElements(): void;
    private handleFileSelection;
    private transitionState;
    private showFileError;
    private resetToIdle;
    private showResults;
    protected updateUI(_result: VitalLensResult): void;
    protected resetUI(): void;
}
//# sourceMappingURL=VitalLensFile.d.ts.map