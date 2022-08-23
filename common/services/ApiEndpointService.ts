import { AuthenticatedContext } from "@aaavang/azure-functions-auth";
import { ApiEndpointService } from "../interfaces/services/api-endpoint-service/ApiEndpointService";
import {
    PontifexApiEndpoint,
    PontifexApiEndpointBundle,
    PontifexApiEndpointFromGremlin
} from "../interfaces/services/api-endpoint-service/models/PontifexApiEndpoint";
import {
    PontifexEnvironment,
    PontifexEnvironmentFromGremlin
} from "../interfaces/services/environment-service/models/PontifexEnvironment";
import {
    PontifexPermissionRequestFromGremlin
} from "../interfaces/services/permission-request-service/models/PontifexPermissionRequest";
import { PontifexUser, PontifexUserFromGremlin } from "../interfaces/services/user-service/models/PontifexUser";
import { SingletonCosmosClient } from "../SingletonCosmosClient";

import { getVertexAndChildren, GremlinEdge, upsertEdge, upsertVertex } from "../utils/gremlin";

const cosmos = SingletonCosmosClient.Instance

export function generateService(context: AuthenticatedContext): ApiEndpointService {
    return {
        async delete(id: string): Promise<void> {
            if (!id) {
                throw new Error("id cannot be empty or undefined")
            }

            // todo: verify that nobody is using/has access to this endpoint before deleting it

            await cosmos.submit('g.V(id).drop()', {
                id
            })
        }, async get(id: string): Promise<PontifexApiEndpointBundle> {
            if (!id) {
                throw new Error("id cannot be empty or undefined")
            }

            const {vertex, connections} = await getVertexAndChildren(id, id, "endpoint")

            return {
                endpoint: PontifexApiEndpointFromGremlin(vertex),
                environment: PontifexEnvironmentFromGremlin(connections["contained by"].environment[0]),
                requests: connections["requests permission"]?.permissionRequest?.map(PontifexPermissionRequestFromGremlin) ?? []
            }
        }, async update(endpoint: PontifexApiEndpoint): Promise<PontifexApiEndpoint> {

            const vertex = await upsertVertex({
                id: endpoint.id,
                pk: endpoint.id,
                defaultProperties: {
                    type: "endpoint",
                    name: endpoint.name
                },
                updatedProperties: {
                    sensitive: endpoint.sensitive
                }
            })

            context.log("upserted endpoint vertex", vertex)

            return PontifexApiEndpointFromGremlin(vertex)
        }, async addApplicationAssociation(endpoint: PontifexApiEndpoint, appId: string): Promise<void> {
            const appToEndpointEdge: GremlinEdge = {
                id: `${appId}.${endpoint.id}`,
                destinationVertexId: endpoint.id,
                destinationVertexPk: endpoint.id,
                label: "contains",
                sourceVertexId: appId,
                sourceVertexPk: appId
            }

            const endpointToAppEdge: GremlinEdge = {
                id: `${endpoint.id}.${appId}`,
                destinationVertexId: appId,
                destinationVertexPk: appId,
                label: "contained by",
                sourceVertexId: endpoint.id,
                sourceVertexPk: endpoint.id
            }

            await upsertEdge(appToEndpointEdge)
            await upsertEdge(endpointToAppEdge)
        }, async getAllConsumers(id: string): Promise<PontifexEnvironment[]> {
            const {connections} = await getVertexAndChildren(id, id, "endpoint")
            return connections["consumed by"]?.map(PontifexEnvironmentFromGremlin) ?? []
        }, async getOwners(id: string): Promise<PontifexUser[]> {
            const query = `
                g.V(id)
                .out('contained by')
                .out('contained by')
                .out('owned by')
            `
            const bindings = {
                id,
                pk: id
            }

            const res = await cosmos.submit(query, bindings)

            return res._items.map(PontifexUserFromGremlin)
        }
    } as ApiEndpointService
}
