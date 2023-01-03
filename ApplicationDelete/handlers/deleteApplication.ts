import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import { generateService as generateApplicationService } from "../../common/services/ApplicationService";

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating deleteApplication handler")

    const ApplicationService = generateApplicationService(context)

    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData

        context.log(`checking that ${context.jwtToken.oid} is an owned of application with objectId: ${id}`)
        // TODO: actually check

        context.log(`deleting application with objectId: ${id}`)

        try {
            const resp = await ApplicationService.delete(id)
            context.res = {
                status: 204,
                body: resp
            }
        } catch (e) {
            context.log.error(`got error when deleting application ${id}`, e)
            context.res = {
                status: 400
            }
        }
    }

    return {
        handleRequest: handler
    }
}