import { Context, HttpRequest } from "@azure/functions";
import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { Handler } from "../../common/interfaces/Handler";
import { generateService as generateEnvironmentService } from "../../common/services/EnvironmentService";
import { SingletonPontifexClient } from "../../common/SingletonPontifexClient";
import { EnvironmentRemovePasswordRequest } from "../models/EnvironmentRemovePasswordRequest";

const pontifex = SingletonPontifexClient.Instance

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating removePassword handler")
    const EnvironmentService = generateEnvironmentService(context)

    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        const request: EnvironmentRemovePasswordRequest = req.body
        context.log(`remove password for environment, ${id}, with id, ${request.id}`)

        try {
            await pontifex.application.removePassword(id, {
                keyId: request.id
            })
            context.log(`removed password with id, ${request.id}, from AAD`)
            await EnvironmentService.removePassword(request.id)
            context.log("successfully removed password from environment")
            context.res = {
                status: 204
            }
        } catch (e) {
            context.log.error(`got error when removing password, ${request.id} from environment, ${id}`, e)
            context.res = {
                status: 400
            }
        }
    }

    return {
        handleRequest: handler
    }
}