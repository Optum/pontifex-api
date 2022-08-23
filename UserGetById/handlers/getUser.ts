import { AuthenticatedContext } from "@aaavang/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import { generateService } from "../../common/services/PermissionRequestService";
import UserService from "../../common/services/UserService";

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating getPermissionRequest handler")
    const PermissionRequestService = generateService(context)

    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        context.log(`get user with objectId: ${id}`)

        try {
            const user = await UserService.get(id)

            context.res = {
                status: 200,
                body: {
                    user
                }
            }
            context.done()
        } catch (e) {
            context.log.error(`got error when getting permission request ${id}`, e)
            context.res = {
                status: 400
            }
            context.done()
        }
    }

    return {
        handleRequest: handler
    }
}