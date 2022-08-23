import { AuthenticatedContext } from "@aaavang/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import { PontifexApiEndpoint } from "../../common/interfaces/services/api-endpoint-service/models/PontifexApiEndpoint";
import { generateService } from "../../common/services/ApiEndpointService";
import { SingletonPontifexClient } from "../../common/SingletonPontifexClient";
import { CreateApiEndpointRequest } from "../models/CreateApiEndpointRequest";

const pontifex = SingletonPontifexClient.Instance


export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating handler")
    const apiEndpointService = generateService(context)
    const handler = async (req: HttpRequest) => {
        const request: CreateApiEndpointRequest = req.body
        const applicationId = context.bindingData.id
        context.log(`creating api endpoint with name: ${request.name} in application ${applicationId}`)

        const app = await pontifex.application.get(applicationId)
        const existingAppRoles = app.appRoles ?? []

        if (existingAppRoles.some(role => role.displayName === request.name)) {
            context.log.error(`role, ${request.name}, already exists in ${applicationId}`)
            context.res = {
                status: 400
            }
            return
        }

        existingAppRoles.push({
            displayName: request.name,
            isEnabled: true
        })

        // todo: should this be in the PermissionRequestService?
        await pontifex.application.update(applicationId, app)

        const updatedApp = await pontifex.application.get(applicationId)
        const role = updatedApp.appRoles.find(role => role.displayName === request.name)
        try {
            const pontifexApiEndpoint = {
                id: role.id,
                name: request.name,
                sensitive: request.sensitive
            } as PontifexApiEndpoint

            await apiEndpointService.update(pontifexApiEndpoint)
            await apiEndpointService.addApplicationAssociation(pontifexApiEndpoint, applicationId)

            context.res = {
                status: 201,
                body: pontifexApiEndpoint
            }
        } catch (e) {
            context.log.error("got error when creating application", e)
            context.res = {
                status: 400
            }
        }
    }

    return {
        handleRequest: handler
    }
}