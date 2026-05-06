import { SimpleMethodHandler } from './SimpleMethodHandler';
import tf from 'tfjs-provider';
/**
 * Handler for processing frames using the G algorithm.
 */
export class GHandler extends SimpleMethodHandler {
    /**
     * Get the method name. Subclasses must implement this.
     * @returns The method name.
     */
    getMethodName() {
        return 'G';
    }
    /**
     * Implementation of the G algorithm.
     * @param rgb - Tensor2D with rgb signals to process.
     * @returns The estimated signal as number[].
     */
    algorithm(rgb) {
        // Select the G channel
        const result = tf.tidy(() => {
            const data = tf.reshape(tf.slice(rgb.getTensor(), [0, 1], [-1, 1]), [-1]);
            // Convert the tensor to a 1D array of numbers
            return data.arraySync();
        });
        return result;
    }
}
