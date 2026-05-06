export interface VitalMetadata {
    id?: string;
    shortName?: string;
    short_name?: string;
    displayName?: string;
    display_name?: string;
    unit?: string;
    emoji?: string;
    color?: string;
}
export declare class VitalMetadataCache {
    private static cache;
    static getMeta(id: string): VitalMetadata | null;
}
//# sourceMappingURL=VitalMetadataCache.d.ts.map