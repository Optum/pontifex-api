import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { HttpRequest } from "@azure/functions";
import { v4 as uuid } from "uuid"
import { Handler } from "../../common/interfaces/Handler";
import { PontifexApplication } from "../../common/interfaces/services/application-service/models/PontifexApplication";
import { PontifexEnvironment } from "../../common/interfaces/services/environment-service/models/PontifexEnvironment";
import { PontifexUser } from "../../common/interfaces/services/user-service/models/PontifexUser";
import { generateService as generateApplicationService } from "../../common/services/ApplicationService";
import { generateService as generateEnvironmentService } from "../../common/services/EnvironmentService";
import UserService from "../../common/services/UserService";
import { SingletonPontifexClient } from "../../common/SingletonPontifexClient";
import { CreateApplicationRequest } from "../models/CreateApplicationRequest";

const pontifex = SingletonPontifexClient.Instance


export function generateHandler(context: AuthenticatedContext): Handler {
    context.log("Generating handler")

    const EnvironmentService = generateEnvironmentService(context)
    const ApplicationService = generateApplicationService(context)

    const handler = async (req: HttpRequest) => {
        const request: CreateApplicationRequest = req.body
        context.log(`creating application with name: ${request.applicationName}`)

        const {jwtToken} = context

        try {

            const pontifexApp = {
                creator: jwtToken.oid,
                id: uuid(),
                name: request.applicationName,
                secret: request.secret

            } as PontifexApplication

            await ApplicationService.update(pontifexApp)
            const user: PontifexUser = {
                id: jwtToken.oid as string,
                name: jwtToken.name as string,
                email: jwtToken.preferred_username as string
            }
            await UserService.update(user)
            await ApplicationService.addUserOwnerAssociation(pontifexApp.id, jwtToken.oid as string)

            for (const environment of request.environments) {
                const application = await pontifex.application.create({
                    "displayName": `${environment}-${request.applicationName}`,
                    "api": {
                        "requestedAccessTokenVersion": 2 // tell AAD to use v2 OAuth2 tokens
                    }
                })

                context.log(`application created. objectId: ${application.id}, appId: ${application.appId}`)

                context.log(`creating service principal for appId ${application.appId}`)
                await pontifex.servicePrincipal.create(application.appId)
                context.log("service principal created")
                const pontifexEnvironment: PontifexEnvironment = {
                    id: application.id, name: application.displayName, level: environment
                }
                const env = await EnvironmentService.update(pontifexEnvironment)
                await EnvironmentService.addApplicationAssociation(pontifexApp.id, env.id)
            }

            context.res = {
                status: 201,
                body: pontifexApp
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