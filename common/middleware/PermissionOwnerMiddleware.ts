import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { AzureFunction } from "@azure/functions";
import { generateService as generatePrService } from "../services/PermissionRequestService";
import { generateService as generateApiEndpointService } from "../services/ApiEndpointService";
import { isEnvironmentOwner } from "./EnvironmentOwnerMiddleware";

export function PermissionRequestOwnerMiddleware(func: AzureFunction, prObjectIdLabel: string = "id"): AzureFunction {
    return async (context: AuthenticatedContext, ...args: any[]) => {
        const userId = context.jwtToken.oid as string;
        const prObjectId = context.bindingData[prObjectIdLabel];

        const PermissionRequestService = generatePrService(context)
        const ApiEndpointService = generateApiEndpointService(context)

        const pr = await PermissionRequestService.get(prObjectId)
        const targetEndpoint = await ApiEndpointService.get(pr.targetEndpoint.id)

        const isOwner = await isEnvironmentOwner(userId, pr.sourceEnvironment.id, context) || await isEnvironmentOwner(userId, targetEndpoint.environment.id, context);
        if (!isOwner) {
            context.log.error(`user ${userId} is not an owner of ${prObjectIdLabel}`)
            context.res = {
                status: 403
            }
            return
        } else {
            context.log.info(`user ${userId} is an owner of ${prObjectIdLabel} - proceeding`)
        }

        return await func.apply(null, [context].concat(args))
    }
}