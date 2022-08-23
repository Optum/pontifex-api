import { Context, HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import { SingletonPontifexClient } from "../../common/SingletonPontifexClient";
import { ApplicationUpdateRolesRequest } from "../models/ApplicationUpdateRolesRequest";
const pontifex = SingletonPontifexClient.Instance

export function generateHandler(context: Context): Handler {
    context.log("Generating grantAccess handler")

    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        const request: ApplicationUpdateRolesRequest = req.body
        context.log(`add grant access to role, ${request.roleId} in application, ${request.roleApplicationObjectId}, from calling application ${id}`)

        try {
            const clientApp = await pontifex.application.get(id)
            const clientServicePrincipal = await pontifex.servicePrincipal.getByAppId(clientApp.appId)
            const resourceApp = await pontifex.application.get(request.roleApplicationObjectId)
            const resourceServicePrincipal = await pontifex.servicePrincipal.getByAppId(resourceApp.appId)

            await pontifex.servicePrincipal.grantPermission(clientServicePrincipal.id, resourceServicePrincipal.id, request.roleId)

            context.res = {
                status: 204
            }
            context.done()
        } catch (e) {
            context.log.error(`got error when add roles to application ${id}`, e)
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