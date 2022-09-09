import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { Handler } from "../../common/interfaces/Handler";
import { PontifexAuditEvent } from "../../common/interfaces/services/audit-service/models/AuditService";
import { generateService as generateApiEndpointService } from "../../common/services/ApiEndpointService";
import { generateService as generateAuditService } from "../../common/services/AuditService";
import { generateService as generatePermissionRequestService } from "../../common/services/PermissionRequestService";
import UserService from "../../common/services/UserService";
import { sendRequestStatusUpdateEmails } from "../../common/utils/email";

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating getPermissionRequest handler")
    const PermissionRequestService = generatePermissionRequestService(context)
    const ApiEndpointService = generateApiEndpointService(context)
    const AuditService = generateAuditService(context)

    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        const {status} = req.body
        context.log(`patch permission request with objectId, ${id}.  Set status to ${status}`)

        try {
            const currentPr = await PermissionRequestService.get(id)
            const owners = await ApiEndpointService.getOwners(currentPr.targetEndpoint.id)

            // TODO: create a generic "isOwner" utility that recursively finds all owners for any resource
            if (!owners.some(owner => owner.id === context.jwtToken.oid as string)) {
                console.error(`user ${context.jwtToken.oid} is not authorized to update permission request, ${id}`)
                context.res = {
                    status: 403
                }
                return
            }

            const permissionRequest = await PermissionRequestService.updateStatus(id, status)

            const requestingUser = await UserService.get(permissionRequest.requestor)

            await sendRequestStatusUpdateEmails(permissionRequest, requestingUser, owners, currentPr.sourceEnvironment, currentPr.targetEndpoint)

            const event: PontifexAuditEvent = {
                action: 'UPDATE_PERMISSION_REQUEST_STATUS',
                value: status,
                associatedUserId: context.jwtToken.oid as string,
                targetResourceId: [id, currentPr.sourceEnvironment.id, currentPr.targetEndpoint.id]
            }
            await AuditService.publishEvent(event)

            context.res = {
                status: 200,
                body: {
                    permissionRequest
                }
            }
            context.done()
        } catch (e) {
            context.log.error(`got error when getting permission request ${id}`, e)
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