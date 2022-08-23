import { Context, HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import ApplicationService from "../../common/services/ApplicationService"

export function generateHandler(context: Context): Handler {
    context.log("Generating getApplication handler")
    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        context.log(`get application with objectId: ${id}`)

        try {
            const bundle = await ApplicationService.get(id)
            context.res = {
                status: 200,
                body: bundle
            }
            context.done()
        } catch (e) {
            context.log.error(`got error when getting application ${id}`, e)
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