import { Context, HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import EnvironmentService from "../../common/services/EnvironmentService";
import { SingletonPontifexClient } from "../../common/SingletonPontifexClient";

const pontifex = SingletonPontifexClient.Instance

export function generateHandler(context: Context): Handler {
    context.log("Generating getEnvironment handler")
    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        context.log(`get environment with objectId: ${id}`)

        try {
            const bundle = await EnvironmentService.get(id)

            context.res = {
                status: 200,
                body: bundle
            }
            context.done()
        } catch (e) {
            context.log.error(`got error when getting environment ${id}`, e)
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