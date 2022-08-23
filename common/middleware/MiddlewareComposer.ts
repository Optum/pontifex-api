import { AzureFunction } from "@azure/functions";

export class MiddlewareComposer {
    private readonly baseHandler: AzureFunction;
    private middlewares: ((AzureFunction) => AzureFunction)[];

    constructor(baseHandler: AzureFunction) {
        this.baseHandler = baseHandler
        this.middlewares = []
    }

    add(middleware: (AzureFunction) => AzureFunction) {
        this.middlewares.push(middleware)
    }

    compose() {
        return this.middlewares.reduce((acc, middleware) => middleware(acc), this.baseHandler)
    }
}