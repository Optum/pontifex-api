import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import { generateService } from "../../common/services/ApiEndpointService";

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating getApiEndpoint handler")
    const ApiEndpontService = generateService(context)

    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        context.log(`get api endpoint with objectId: ${id}`)

        try {
            const owners = await ApiEndpontService.getOwners(id)

            context.res = {
                status: 200,
                body: {
                    owners
                }
            }
            context.done()
        } catch (e) {
            context.log.error(`got error when getting api endpoint request ${id}`, e)
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