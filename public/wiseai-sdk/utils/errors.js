export class VitalLensAPIError extends Error {
    constructor(message = 'Bad request or an error occurred in the WiseAI API.', options) {
        super(message, options);
        this.name = 'WiseAIAPIError';
    }
}
export class VitalLensAPIKeyError extends Error {
    constructor(message = 'A valid API key or proxy URL is required to use the WiseAI SDK. Please check your configuration or contact your WiseAI administrator.', options) {
        super(message, options);
        this.name = 'WiseAIAPIKeyError';
    }
}
export class VitalLensAPIQuotaExceededError extends Error {
    constructor(message = 'The quota or rate limit associated with your API key may have been exceeded. Please contact your WiseAI administrator.', options) {
        super(message, options);
        this.name = 'WiseAIAPIQuotaExceededError';
    }
}
