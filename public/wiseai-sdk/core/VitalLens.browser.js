import { VitalLensBase } from './VitalLens.base';
import { VitalLensController } from './VitalLensController.browser';
export class VitalLens extends VitalLensBase {
    createController(options) {
        return new VitalLensController(options);
    }
}
