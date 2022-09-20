import { Context, HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import ApplicationService from "../../common/services/ApplicationService"

export function generateHandler(context: Context): Handler {
    context.log("Generating getApplicationAuditEvents handler")
    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        context.log(`get application with objectId: ${id}`)

        try {
            const events = await ApplicationService.getAuditEvents(id)
            context.res = {
                status: 200,
                body: {
                    events
                }
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