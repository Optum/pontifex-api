import { AuthenticatedContext } from "@aaavang/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { ApplicationOwnerMiddleware } from "../common/middleware/ApplicationOwnerMiddleware";
import { AuthorizationMiddleware } from "../common/middleware/AuthorizationMiddleware";
import { MiddlewareComposer } from "../common/middleware/MiddlewareComposer";
import { WebErrorMiddleware } from "../common/middleware/WebErrorMiddleware";
import { generateHandler } from "./handlers/createApiEndpoint"

const handler = async function (context: AuthenticatedContext, req: HttpRequest) {
    context.log("Generating and calling handler for ApiEndpointDelete")
    let generatedHandler = generateHandler(context);
    await generatedHandler.handleRequest(req)
}

const composer = new MiddlewareComposer(handler)
composer.add(AuthorizationMiddleware)
composer.add(WebErrorMiddleware)
composer.add(ApplicationOwnerMiddleware)

module.exports = composer.compose()