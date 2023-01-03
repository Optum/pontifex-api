import { Context, HttpRequest } from "@azure/functions";
import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { Handler } from "../../common/interfaces/Handler";
import { generateService as generateEnvironmentService } from "../../common/services/EnvironmentService";
import { SingletonPontifexClient } from "../../common/SingletonPontifexClient";
import { EnvironmentAddPasswordRequest } from "../models/EnvironmentAddPasswordRequest";

const pontifex = SingletonPontifexClient.Instance

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating addPassword handler")

    const EnvironmentService = generateEnvironmentService(context)

    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        const request: EnvironmentAddPasswordRequest = req.body
        context.log(`add password to environment, ${id}, with displayName, ${request.displayName}`)

        try {
            const password = await pontifex.application.addPassword(id, request)
            context.log(`generated password with id, ${password.keyId}`)
            await EnvironmentService.addPassword(id, {
                displayName: password.displayName, end: password.endDateTime, id: password.keyId, password: password.secretText, start: password.startDateTime
            })
            context.log("successfully associated password with environment")
            context.res = {
                status: 204
            }
        } catch (e) {
            context.log.error(`got error when adding password to environment ${id}`, e)
            context.res = {
                status: 400
            }
        }
    }

    return {
        handleRequest: handler
    }
}