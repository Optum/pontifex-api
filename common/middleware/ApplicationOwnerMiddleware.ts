import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { AzureFunction } from "@azure/functions";
import { generateService as generateApplicationService } from "../services/ApplicationService";

export async function isApplicationOwner(userId: string, objectId: string, context: AuthenticatedContext): Promise<boolean> {
    const ApplicationService = generateApplicationService(context)
    const {application} = await ApplicationService.get(objectId)

    // todo: also check if the user is in the owningGroup
    return application.creator === userId
}

export function ApplicationOwnerMiddleware(func: AzureFunction, applicationObjectIdLabel: string = "id"): AzureFunction {
    return async (context: AuthenticatedContext, ...args: any[]) => {
        const userId = context.jwtToken.oid as string;
        const applicationObjectId = context.bindingData[applicationObjectIdLabel];
        const isOwner = await isApplicationOwner(userId, applicationObjectId, context);
        if (!isOwner) {
            context.log.error(`user ${userId} is not an owner of ${applicationObjectId}`)
            context.res = {
                status: 403
            }
            return
        } else {
            context.log.info(`user ${userId} is an owner of ${applicationObjectId} - proceeding`)
        }

        return await func.apply(null, [context].concat(args))
    }
}