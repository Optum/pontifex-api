import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import { generateService } from "../../common/services/PermissionRequestService";

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating getPermissionRequest handler")
    const PermissionRequestService = generateService(context)

    const handler = async (req: HttpRequest) => {
        context.log(`get permission request with objectId: ${context.jwtToken.oid}`)

        try {
            const pendingPermissionRequests = await PermissionRequestService.getPendingForUser(context.jwtToken.oid as string)

            context.res = {
                status: 200,
                body: {
                    pendingPermissionRequests
                }
            }
        } catch (e) {
            context.log.error(`got error when getting pending permission requests for user, ${context.jwtToken.oid}`, e)
            context.res = {
                status: 400
            }
        }
    }

    return {
        handleRequest: handler
    }
}