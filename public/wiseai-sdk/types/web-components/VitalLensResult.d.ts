export interface ResolvedVital {
    id: string;
    title: string;
    value: number | null;
    unit: string;
    format: string;
    confidence: number | null;
    emoji: string;
}
export declare class VitalLensResult extends HTMLElement {
    private showDetails;
    private ppgChart;
    private respChart;
    constructor();
    destroyCharts(): void;
    connectedCallback(): void;
    set resultData(data: {
        primaryVitals: ResolvedVital[];
        secondaryVitals: ResolvedVital[];
        stats: {
            duration: number;
            sampleCount: number;
            avgFaceConf: number;
        };
        ppgWaveform?: number[];
        respWaveform?: number[];
    });
    private renderGrid;
    private renderStaticChart;
}
//# sourceMappingURL=VitalLensResult.d.ts.map