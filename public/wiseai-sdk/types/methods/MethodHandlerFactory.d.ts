import { MethodHandler } from './MethodHandler';
import { VitalLensOptions } from '../types/core';
import { IRestClient } from '../types/IRestClient';
interface MethodHandlerDependencies {
    restClient?: IRestClient;
}
/**
 * Factory class for creating method handlers based on the specified method.
 */
export declare class MethodHandlerFactory {
    /**
     * Creates and returns the appropriate method handler based on the provided options.
     * @param options - Configuration options for the handler.
     * @param dependencies - Optional dependencies required by specific handlers.
     * @returns An instance of the appropriate method handler.
     */
    static createHandler(options: VitalLensOptions, dependencies?: MethodHandlerDependencies): MethodHandler;
}
export {};
//# sourceMappingURL=MethodHandlerFactory.d.ts.map