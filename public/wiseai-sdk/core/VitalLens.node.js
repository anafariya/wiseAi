import { VitalLensBase } from './VitalLens.base';
import { VitalLensController } from './VitalLensController.node';
export class VitalLens extends VitalLensBase {
    createController(options) {
        return new VitalLensController(options);
    }
}
