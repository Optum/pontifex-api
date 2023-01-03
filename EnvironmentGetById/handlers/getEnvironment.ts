import { HttpRequest } from "@azure/functions";
import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { Handler } from "../../common/interfaces/Handler";
import { generateService as generateEnvironmentService } from "../../common/services/EnvironmentService";

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating getEnvironment handler")

    const EnvironmentService = generateEnvironmentService(context)

    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        context.log(`get environment with objectId: ${id}`)

        try {
            const bundle = await EnvironmentService.get(id)

            context.res = {
                status: 200,
                body: bundle
            }
        } catch (e) {
            context.log.error(`got error when getting environment ${id}`, e)
            context.res = {
                status: 400
            }
        }
    }

    return {
        handleRequest: handler
    }
}