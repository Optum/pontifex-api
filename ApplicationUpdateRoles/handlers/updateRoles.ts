import { AuthenticatedContext } from "@aaavang/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { AppRole } from "@microsoft/microsoft-graph-types";
import { v4 as uuid } from "uuid"
import { Handler } from "../../common/interfaces/Handler";
import { PontifexApiEndpoint } from "../../common/interfaces/services/api-endpoint-service/models/PontifexApiEndpoint";
import { PontifexAuditEvent } from "../../common/interfaces/services/audit-service/models/AuditService";
import { generateService } from "../../common/services/ApiEndpointService";
import ApplicationService from "../../common/services/ApplicationService";
import { generateService as generateAuditService } from "../../common/services/AuditService";
import { SingletonPontifexClient } from "../../common/SingletonPontifexClient";
import { omit } from "../../common/utils/obj";
import { ApplicationUpdateRolesRequest, SensitiveAppRole } from "../models/ApplicationUpdateRolesRequest";

const pontifex = SingletonPontifexClient.Instance

export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating updateRoles handler")

    const ApiEndpointService = generateService(context)
    const AuditService = generateAuditService(context)

    async function removeRoles(id: string, existingAppRoles: SensitiveAppRole[], rolesToRemove: AppRole[]) {
        const appRoles: AppRole[] = []

        existingAppRoles.forEach(role => {
            if (rolesToRemove.some(r => r.value === role.value)) {
                appRoles.push({
                    ...omit(role, "sensitive"),
                    isEnabled: false
                })
            } else {
                appRoles.push(role)
            }
        })

        // first disable the roles to remove
        context.log("disabling roles: ", appRoles)
        await pontifex.application.update(id, {
            appRoles
        })

        // then remove them from AAD
        const filteredRoles = appRoles.filter(role => !rolesToRemove.some(r => r.value === role.value));
        context.log("updating roles: ", filteredRoles)
        await pontifex.application.update(id, {
            appRoles: filteredRoles
        })

        // then remove them from cosmosdb
        rolesToRemove.forEach(role => ApiEndpointService.delete(role.id))
    }

    async function syncRoles(id: any, roles: SensitiveAppRole[]) {
        const endpoints = roles.map<PontifexApiEndpoint>(role => {
            return {
                id: role.id,
                name: role.displayName,
                sensitive: role.sensitive
            } as PontifexApiEndpoint
        })
        for (const endpoint of endpoints) {
            await ApiEndpointService.update(endpoint)
            await ApiEndpointService.addApplicationAssociation(endpoint, id)
        }
    }

    async function updateEnvironment(id: string, request: ApplicationUpdateRolesRequest) {
        const environmentAppRegistration = await pontifex.application.get(id)

        const newAppRoles: SensitiveAppRole[] = request.roles.map(role => ({
            allowedMemberTypes: ["Application"],
            description: role.description,
            displayName: role.displayName,
            id: uuid(),
            value: role.claimValue,
            sensitive: role.sensitive ?? false
        }))
        context.log("newAppRoles: ", request.roles)

        const existingAppRoles = environmentAppRegistration.appRoles as SensitiveAppRole[] ?? []

        context.log("existingAppRoles: ", existingAppRoles)

        for (const role of existingAppRoles) {
            const {endpoint} = await ApiEndpointService.get(role.id)
            role.sensitive = endpoint?.sensitive ?? false
        }

        const rolesToAdd = newAppRoles.filter(role => !existingAppRoles.some(r => r.value === role.value))
        const rolesToRemove = existingAppRoles.filter(role => !newAppRoles.some(r => r.value === role.value))

        context.log("rolesToAdd: ", rolesToAdd)
        context.log("rolesToRemove: ", rolesToRemove)

        try {
            // remove roles that aren't present anymore
            if (rolesToRemove.length > 0) {
                await removeRoles(id, existingAppRoles, rolesToRemove)
            }

            if (rolesToAdd.length > 0) {
                const resp = await pontifex.application.update(id, {
                    appRoles: existingAppRoles.concat(newAppRoles).map(role => ({
                        ...omit(role, "sensitive")
                    }))
                })
                await syncRoles(id, rolesToAdd)

                // TODO: create permission requests objects and edges from env->request and request->endpoint
            }

            const event: PontifexAuditEvent = {
                action: 'UPDATE_APPLICATION_ROLES',
                value: JSON.stringify(request.roles),
                associatedUserId: context.jwtToken.oid as string,
                targetResourceId: id
            }
            await AuditService.publishEvent(event)

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

    const handler = async (req: HttpRequest) => {
        const {id} = context.bindingData
        const request: ApplicationUpdateRolesRequest = req.body
        context.log(`add roles to application with objectId: ${id}`)

        const pontifexApp = await ApplicationService.get(id)
        for (const env of pontifexApp.environments) {
            context.log(`updating environment, ${env.id}`)
            await updateEnvironment(env.id, request);
        }
    }

    return {
        handleRequest: handler
    }
}