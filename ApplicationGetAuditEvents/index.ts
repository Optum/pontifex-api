import { Context, HttpRequest } from "@azure/functions";
import { WebErrorMiddleware } from "../common/middleware/WebErrorMiddleware";
import { generateHandler } from "./handlers/getApplicationAuditEvents"

const handler = async function (context: Context, req: HttpRequest) {
    context.log("Generating and calling handler for ApplicationGetAuditEvents")
    let generatedHandler = generateHandler(context);
    await generatedHandler.handleRequest(req)
}

module.exports = WebErrorMiddleware(handler)