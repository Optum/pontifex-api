import { AuthenticatedContext } from "@optum/azure-functions-auth";
import {
    PontifexApiEndpoint,
    PontifexApiEndpointFromGremlin
} from "../interfaces/services/api-endpoint-service/models/PontifexApiEndpoint";
import {
    PontifexEnvironment,
    PontifexEnvironmentFromGremlin
} from "../interfaces/services/environment-service/models/PontifexEnvironment";
import {
    PontifexPermissionRequest,
    PontifexPermissionRequestBundle,
    PontifexPermissionRequestFromGremlin
} from "../interfaces/services/permission-request-service/models/PontifexPermissionRequest";
import { PermissionRequestService } from "../interfaces/services/permission-request-service/PermissionRequestService";
import { SingletonCosmosClient } from "../SingletonCosmosClient";
import { SingletonPontifexClient } from "../SingletonPontifexClient";
import { dropVertex, getVertexAndChildren, upsertEdge, upsertVertex } from "../utils/gremlin";
import { generateService as generateApiEndpointService } from "./ApiEndpointService"

const cosmos = SingletonCosmosClient.Instance
const pontifex = SingletonPontifexClient.Instance

export function generateService(context: AuthenticatedContext): PermissionRequestService {

    const ApiEndpointService = generateApiEndpointService(context)

    return {
        async delete(id: string): Promise<void> {
            const bundle: PontifexPermissionRequestBundle = await this.get(id)
            if (bundle.permissionRequest.status === 'APPROVED') {
                context.log("revoking previously approved permission request")
                const endpointBundle = await ApiEndpointService.get(bundle.targetEndpoint.id)

                context.log(`looking up resourceAppId for ${endpointBundle.environment.id}`)
                const resourceApp = await pontifex.application.get(endpointBundle.environment.id)
                context.log(`looking up resourceServicePrincipal for ${resourceApp.appId}`)
                const resourceServicePrincipal = await pontifex.servicePrincipal.getByAppId(resourceApp.appId)
                context.log(`revoking permission for environment ${resourceServicePrincipal.id} and roleAssignment ${bundle.permissionRequest.roleAssignmentId}`)

                await pontifex.servicePrincipal.revokePermission(resourceServicePrincipal.id, bundle.permissionRequest.roleAssignmentId)
                bundle.permissionRequest.roleAssignmentId = null
            }

            await dropVertex(id)
        },
        async get(id: string): Promise<PontifexPermissionRequestBundle> {
            if (!id) {
                throw new Error("id cannot be empty or undefined")
            }

            const {
                vertex,
                connections
            } = await getVertexAndChildren<PontifexPermissionRequest>(id, id, "permissionRequest")

            const bundle: PontifexPermissionRequestBundle = {
                permissionRequest: PontifexPermissionRequestFromGremlin(vertex),
                sourceEnvironment: connections?.["request source"]?.environment?.map(PontifexEnvironmentFromGremlin)[0],
                targetEndpoint: connections?.["request target"].endpoint?.map(PontifexApiEndpointFromGremlin)[0]
            }

            return bundle;
        },
        async upsert(request: PontifexPermissionRequest): Promise<PontifexPermissionRequest> {
            const res = await upsertVertex({
                id: request.id, pk: request.id,
                defaultProperties: {
                    requestor: request.requestor,
                    createDate: request.createDate,
                },
                updatedProperties: {
                    status: request.status,
                    roleAssignmentId: request.roleAssignmentId
                }
            })

            return PontifexPermissionRequestFromGremlin(res);
        },
        async create(request: PontifexPermissionRequest, sourceEnvironment: PontifexEnvironment, targetEndpoint: PontifexApiEndpoint): Promise<PontifexPermissionRequest> {
            const res = await upsertVertex({
                id: request.id, pk: request.id,
                defaultProperties: {
                    type: 'permissionRequest',
                    requestor: request.requestor,
                    createDate: request.createDate,
                    status: request.status,
                    roleAssignmentId: ""
                }
            })

            // env->request
            await upsertEdge({
                destinationVertexId: request.id,
                destinationVertexPk: request.id,
                label: "requests permission",
                sourceVertexId: sourceEnvironment.id,
                sourceVertexPk: sourceEnvironment.id
            })

            // request->env
            await upsertEdge({
                destinationVertexId: sourceEnvironment.id,
                destinationVertexPk: sourceEnvironment.id,
                label: "request source",
                sourceVertexId: request.id,
                sourceVertexPk: request.id
            })

            // endpoint->request
            await upsertEdge({
                destinationVertexId: request.id,
                destinationVertexPk: request.id,
                label: "requests permission",
                sourceVertexId: targetEndpoint.id,
                sourceVertexPk: targetEndpoint.id
            })

            // request->endpoint
            await upsertEdge({
                destinationVertexId: targetEndpoint.id,
                destinationVertexPk: targetEndpoint.id,
                label: "request target",
                sourceVertexId: request.id,
                sourceVertexPk: request.id
            })

            return PontifexPermissionRequestFromGremlin(res);
        },
        async getPendingForUser(userId: string): Promise<PontifexPermissionRequest[]> {
            const query = `g.V(id)
            .out('owns')
            .out('contains')
            .out('contains')
            .out('requests permission')
            .has('status', 'PENDING')`
            const bindings = {id: userId}

            const result = await cosmos.submit(query, bindings)

            return result._items.map(PontifexPermissionRequestFromGremlin)
        }, async updateStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
            const bundle: PontifexPermissionRequestBundle = await this.get(id)
            const endpointBundle = await ApiEndpointService.get(bundle.targetEndpoint.id)
            const clientApp = await pontifex.application.get(bundle.sourceEnvironment.id)
            const clientServicePrincipal = await pontifex.servicePrincipal.getByAppId(clientApp.appId)
            const resourceApp = await pontifex.application.get(endpointBundle.environment.id)
            const resourceServicePrincipal = await pontifex.servicePrincipal.getByAppId(resourceApp.appId)

            bundle.permissionRequest.status = status

            switch (status) {
                case 'PENDING':
                    break
                case 'APPROVED':
                    const roleAssignmentId = await pontifex.servicePrincipal.grantPermission(clientServicePrincipal.id, resourceServicePrincipal.id, bundle.targetEndpoint.id)

                    context.log(`granted permission and received roleAssignmentId, ${roleAssignmentId}`)

                    bundle.permissionRequest.roleAssignmentId = roleAssignmentId
                    break
                case 'REJECTED':
                    context.log(`revoking permission ${resourceServicePrincipal.id} ${bundle.permissionRequest.roleAssignmentId}`)
                    if (bundle.permissionRequest.roleAssignmentId && bundle.permissionRequest.roleAssignmentId !== "") {
                        context.log("calling AAD to revoke")
                        await pontifex.servicePrincipal.revokePermission(resourceServicePrincipal.id, bundle.permissionRequest.roleAssignmentId)
                        bundle.permissionRequest.roleAssignmentId = ""
                    }
                    break
            }

            await this.upsert(bundle.permissionRequest)

            return bundle.permissionRequest
        }
    }
}