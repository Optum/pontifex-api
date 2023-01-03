import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { AzureFunction } from "@azure/functions";
import { generateService as generateEnvironmentService } from "../../common/services/EnvironmentService";

export async function isEnvironmentOwner(userId: string, objectId: string, context: AuthenticatedContext): Promise<boolean> {
    const EnvironmentService = generateEnvironmentService(context)
    const {application} = await EnvironmentService.get(objectId)

    // todo: also check if the user is in the owningGroup
    return application.creator === userId
}

export function EnvironmentOwnerMiddleware(func: AzureFunction, environmentObjectIdLabel: string = "id"): AzureFunction {
    return async (context: AuthenticatedContext, ...args: any[]) => {
        const userId = context.jwtToken.oid as string;
        const environmentObjectId = context.bindingData[environmentObjectIdLabel];
        const isOwner = await isEnvironmentOwner(userId, environmentObjectId, context);
        if (!isOwner) {
            context.log.error(`user ${userId} is not an owner of ${environmentObjectIdLabel}`)
            context.res = {
                status: 403
            }
            return
        } else {
            context.log.info(`user ${userId} is an owner of ${environmentObjectIdLabel} - proceeding`)
        }

        return await func.apply(null, [context].concat(args))
    }
}