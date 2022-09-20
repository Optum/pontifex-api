import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import { generateService } from "../../common/services/PermissionRequestService";

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating getPermissionRequest handler")
    const PermissionRequestService = generateService(context)

    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        context.log(`get permission request with objectId: ${id}`)

        try {
            const bundle = await PermissionRequestService.get(id)

            context.res = {
                status: 200,
                body: bundle
            }
        } catch (e) {
            context.log.error(`got error when getting permission request ${id}`, e)
            context.res = {
                status: 400
            }
        }
    }

    return {
        handleRequest: handler
    }
}