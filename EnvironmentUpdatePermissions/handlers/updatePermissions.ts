import { AuthenticatedContext } from "@aaavang/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { RequiredResourceAccess } from "@microsoft/microsoft-graph-types";
import { Handler } from "../../common/interfaces/Handler";
import { PontifexAuditEvent } from "../../common/interfaces/services/audit-service/models/AuditService";
import {
    PontifexPermissionRequest
} from "../../common/interfaces/services/permission-request-service/models/PontifexPermissionRequest";
import { generateService as generateApiEndpointService } from "../../common/services/ApiEndpointService";
import { generateService as generateAuditService } from "../../common/services/AuditService";
import EnvironmentService from "../../common/services/EnvironmentService";
import { generateService as generatePermissionRequestService } from "../../common/services/PermissionRequestService";
import UserService from "../../common/services/UserService";
import { SingletonPontifexClient } from "../../common/SingletonPontifexClient";
import { sendRequestEmails } from "../../common/utils/email";
import { ApplicationUpdatePermissionsRequest, Permission } from "../models/ApplicationUpdatePermissionsRequest";

const pontifex = SingletonPontifexClient.Instance

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating updatePermissions handler")

    const PermissionRequestService = generatePermissionRequestService(context)
    const ApiEndpointService = generateApiEndpointService(context)
    const AuditService = generateAuditService(context)

    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        const request: ApplicationUpdatePermissionsRequest = req.body
        context.log(`update permissions to environment with objectId: ${id}`)

        const permissionsByAppId = request.permissions.reduce((dict, permission) => {
            if (permission.roleApplicationObjectId in dict) {
                dict[permission.roleApplicationObjectId].push(permission)
            } else {
                dict[permission.roleApplicationObjectId] = [permission]
            }

            return dict
        }, {} as Record<string, Permission[]>)

        const newRequiredResources: RequiredResourceAccess[] = []
        for (const [objectId, permissions] of Object.entries(permissionsByAppId)) {
            const app = await pontifex.application.get(objectId)
            newRequiredResources.push({
                resourceAppId: app.appId,
                resourceAccess: permissions.map(permission => ({
                    id: permission.roleId,
                    type: "Role"
                }))
            })
        }

        try {
            // remove roles that aren't present anymore
            await pontifex.application.update(id, {
                requiredResourceAccess: newRequiredResources
            })

            context.log(`updated AAD for app ID, ${id}, with required resources, ${JSON.stringify(newRequiredResources)}`)

            const {environment, permissionRequests} = await EnvironmentService.get(id)
            for (const permissionRequest of permissionRequests) {
                const {sourceEnvironment, targetEndpoint} = await PermissionRequestService.get(permissionRequest.id)
                context.log(`is ${targetEndpoint.id} in ${JSON.stringify(request.permissions)}`)
                if (!request.permissions.some(perm => perm.roleId === targetEndpoint.id)) {
                    context.log(`deleting permission request, ${permissionRequest.id}, requesting access from ${sourceEnvironment.name} to ${targetEndpoint.name}`)
                    // delete this permission request
                    await PermissionRequestService.delete(permissionRequest.id)
                }
            }

            // try to create new PontifexPermissionRequests, ignoring any that already exist
            const newPermissions = newRequiredResources.map<PontifexPermissionRequest[]>(requiredResource => (
                requiredResource.resourceAccess.map<PontifexPermissionRequest>(resourceAccess => ({
                    id: `${id}.${resourceAccess.id}`,
                    requestor: context.jwtToken.oid as string,
                    createDate: new Date().toISOString(),
                    status: 'PENDING'
                }))
            ))
                .flat()
                .filter(newPermissionRequest => !permissionRequests.some(pr => pr.id === newPermissionRequest.id))

            for (const permissionRequest of newPermissions) {
                const targetEndpoint = await ApiEndpointService.get(permissionRequest.id.split('.')[1])
                context.log(`Creating permission request for ${environment.name} to ${targetEndpoint.endpoint.name}`)
                await PermissionRequestService.create(permissionRequest, environment, targetEndpoint.endpoint)
                const requestingUser = await UserService.get(context.jwtToken.oid as string)
                const endpointOwners = await ApiEndpointService.getOwners(targetEndpoint.endpoint.id)
                await sendRequestEmails(permissionRequest, requestingUser, endpointOwners, environment, targetEndpoint.endpoint)
            }

            const event: PontifexAuditEvent = {
                action: 'UPDATE_ENVIRONMENT_PERMISSIONS',
                value: JSON.stringify(newRequiredResources),
                associatedUserId: context.jwtToken.oid as string,
                targetResourceId: id
            }
            await AuditService.publishEvent(event)

            context.res = {
                status: 204
            }
            context.done()
        } catch (e) {
            context.log.error(`got error when add permissions to application ${id}`, e)
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