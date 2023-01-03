import { HttpRequest } from "@azure/functions";
import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { Handler } from "../../common/interfaces/Handler";
import { generateService as generateApplicationService } from "../../common/services/ApplicationService";

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating getApplication handler")

    const ApplicationService = generateApplicationService(context)

    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        context.log(`get application with objectId: ${id}`)

        try {
            const bundle = await ApplicationService.get(id)
            context.res = {
                status: 200,
                body: bundle
            }
        } catch (e) {
            context.log.error(`got error when getting application ${id}`, e)
            context.res = {
                status: 400
            }
        }
    }

    return {
        handleRequest: handler
    }
}