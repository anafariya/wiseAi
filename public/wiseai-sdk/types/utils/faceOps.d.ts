import { MethodConfig, ROI } from '../types/core';
/**
 * Determines the ROI based on the specified roiMethod.
 * @param det - The face detection {x0, y0, x1, y1}.
 * @param methodConfig - Configuration object specifying the ROI method and options.
 * @param clipDims - Constraints {frameWidth, frameHeight}.
 * @param forceEvenDims - Whether to force even dimensions for the ROI.
 * @returns The computed ROI.
 */
export declare function getROIForMethod(det: ROI, methodConfig: MethodConfig, clipDims: {
    width: number;
    height: number;
}, forceEvenDims?: boolean): ROI;
/**
 * Compute the representative ROI (closest to the mean ROI) with even width and height.
 * @param rois - Array of ROIs.
 * @returns The representative ROI closest to the mean ROI, with even width and height.
 */
export declare function getRepresentativeROI(rois: ROI[]): ROI;
/**
 * Compute the union of an array of ROIs.
 * @param rois - Array of ROIs.
 * @returns The union ROI that encompasses all input ROIs.
 */
export declare function getUnionROI(rois: ROI[]): ROI;
/**
 * Check whether a face is sufficiently inside the ROI.
 * @param face - The face represented as an ROI { x0, y0, x1, y1 }.
 * @param roi - The region of interest (ROI) represented as { x0, y0, x1, y1 }.
 * @param percentageRequiredInsideROI - Percentage of the face's width and height required to remain inside the ROI.
 * @returns True if the face is sufficiently inside the ROI.
 */
export declare function checkFaceInROI(face: ROI, roi: ROI, percentageRequiredInsideROI?: [number, number]): boolean;
/**
 * Check whether an ROI is sufficiently inside a face.
 * @param roi - The region of interest (ROI) represented as { x0, y0, x1, y1 }.
 * @param face - The face represented as an ROI { x0, y0, x1, y1 }.
 * @param percentageRequiredInsideFace - Percentage of the ROI's width and height required to remain inside the face.
 * @returns True if the ROI is sufficiently inside the face.
 */
export declare function checkROIInFace(roi: ROI, face: ROI, percentageRequiredInsideFace?: [number, number]): boolean;
/**
 * Check whether an ROI is valid.
 * @param roi - The region of interest (ROI) represented as { x0, y0, x1, y1 }.
 * @returns True if the ROI is valid, else False
 */
export declare function checkROIValid(roi: ROI): boolean;
export declare function getVitalMetadata(vitalId: string): any;
//# sourceMappingURL=faceOps.d.ts.map