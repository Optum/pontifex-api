export abstract class WebError extends Error {
    abstract getStatusCode(): number

    abstract getErrorCode(): number

    abstract getErrorMessage(): string

    abstract getMetricName(): string
}
