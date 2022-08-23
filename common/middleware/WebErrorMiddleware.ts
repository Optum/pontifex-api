import { AzureFunction, Context } from "@azure/functions";
import { WebError } from "../errors/WebError";

export function WebErrorMiddleware(func: AzureFunction): AzureFunction {
    return async (context: Context, ...args: any[]) => {
        try {
            return await func.apply(null, [context].concat(args))
        } catch (e) {
            if (e instanceof WebError) {
                context.log.error("caught WebError", e)
                context.res = {
                    status: e.getStatusCode(),
                    body: {
                        errorMessage: e.getErrorMessage()
                    }
                }
            } else {
                context.log.error("caught unknown error, returning 500", e)
                context.res = {
                    status: 500,
                    body: {
                        errorMessage: "Internal Server Error"
                    }
                }
            }
        }
    }
}