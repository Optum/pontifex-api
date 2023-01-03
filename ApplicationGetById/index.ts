import { HttpRequest } from "@azure/functions";
import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { ApplicationOwnerMiddleware } from "../common/middleware/ApplicationOwnerMiddleware";
import { AuthorizationMiddleware } from "../common/middleware/AuthorizationMiddleware";
import { MiddlewareComposer } from "../common/middleware/MiddlewareComposer";
import { WebErrorMiddleware } from "../common/middleware/WebErrorMiddleware";
import { generateHandler } from "./handlers/getApplication"

const handler = async function (context: AuthenticatedContext, req: HttpRequest) {
    context.log("Generating and calling handler for ApplicationGet")
    let generatedHandler = generateHandler(context);
    await generatedHandler.handleRequest(req)
}

const composer = new MiddlewareComposer(handler)
composer.add(ApplicationOwnerMiddleware)
composer.add(AuthorizationMiddleware)
composer.add(WebErrorMiddleware)

module.exports = composer.compose()