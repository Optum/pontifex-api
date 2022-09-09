import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import { generateService } from "../../common/services/ApiEndpointService";

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating handler")
    const apiEndpointService = generateService(context)
    const handler = async (req: HttpRequest) => {
        const {id: applicationId, endpointId} = context.bindingData.id
        context.log(`delete api endpoint with id: ${endpointId} in application ${applicationId}`)

        try {
            await apiEndpointService.delete(endpointId)

            context.res = {
                status: 204
            }
            context.done()
        } catch (e) {
            context.log.error("got error when creating application", e)
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