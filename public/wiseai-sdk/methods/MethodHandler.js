import { METHODS_CONFIG } from '../config/methodsConfig';
/**
 * Abstract base class for all method-specific handlers.
 * Subclasses must implement the `process` method.
 */
export class MethodHandler {
    config;
    constructor(options) {
        // For local methods, the config is immediately available.
        // For API-based methods, this will be a temporary config,
        // and the final one will be fetched and set in the init() method.
        this.config = METHODS_CONFIG[options.method] || {};
    }
    /**
     * Returns the current method configuration.
     * @returns The method configuration.
     */
    getConfig() {
        return this.config;
    }
}
