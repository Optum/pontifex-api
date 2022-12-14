import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import { generateService as generateApplicationService } from "../../common/services/ApplicationService";

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating getApplications handler")

    const ApplicationService = generateApplicationService(context)

    const handler = async (req: HttpRequest) => {
        context.log(`get applications for user with id: ${context.jwtToken.oid}`)

        try {
            const apps = await ApplicationService.getAll()
            context.log("getAllByUser", apps)
            context.res = {
                status: 200,
                body: {
                    applications: apps
                }
            }
            context.log("all done")
        } catch (e) {
            context.log.error(`got error when getting applications for user ${context.jwtToken.oid}`, e)
            context.res = {
                status: 400
            }
        }
    }

    return {
        handleRequest: handler
    }
}