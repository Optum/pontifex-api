import { PontifexApiEndpointFromGremlin } from "../interfaces/services/api-endpoint-service/models/PontifexApiEndpoint";
import { PontifexApplicationFromGremlin } from "../interfaces/services/application-service/models/PontifexApplication";
import { EnvironmentService } from "../interfaces/services/environment-service/EnvironmentService";
import {
    PontifexEnvironment,
    PontifexEnvironmentBundle,
    PontifexEnvironmentFromGremlin
} from "../interfaces/services/environment-service/models/PontifexEnvironment";
import {
    PontifexPermissionRequestFromGremlin
} from "../interfaces/services/permission-request-service/models/PontifexPermissionRequest";
import { SingletonCosmosClient } from "../SingletonCosmosClient";

import { getVertexAndChildren, GremlinEdge, upsertEdge, upsertVertex } from "../utils/gremlin";

const cosmos = SingletonCosmosClient.Instance

export default {
    async delete(id: string): Promise<void> {
        if (!id) {
            throw new Error("id cannot be empty or undefined")
        }

        await cosmos.submit('g.V(id).drop()', {
            id
        })
    },
    async get(id: string): Promise<PontifexEnvironmentBundle> {
        if (!id) {
            throw new Error("id cannot be empty or undefined")
        }

        const {vertex, connections} = await getVertexAndChildren(id, id, "environment")

        return {
            environment: PontifexEnvironmentFromGremlin(vertex),
            endpoints: connections?.contains?.endpoint?.map(PontifexApiEndpointFromGremlin) ?? [],
            permissionRequests: connections?.["requests permission"]?.permissionRequest.map(PontifexPermissionRequestFromGremlin) ?? [],
            application: connections?.["contained by"]?.application?.map(PontifexApplicationFromGremlin)[0]
        };
    },
    async getAllForApplication(appId: string): Promise<PontifexEnvironment[]> {
        if (!appId) {
            throw new Error("appId cannot be empty or undefined")
        }

        const {connections} = await getVertexAndChildren(appId, appId, 'application')
        const envs = connections?.contains?.environment ?? []
        return envs.map(PontifexEnvironmentFromGremlin);
    },
    async update(environment: PontifexEnvironment): Promise<PontifexEnvironment> {

        const vertex = await upsertVertex({
            id: environment.id,
            pk: environment.id,
            defaultProperties: {
                type: "environment",
                name: environment.name
            }
        })

        return PontifexEnvironmentFromGremlin(vertex)
    },
    async addApplicationAssociation(appId: string, environmentId: string): Promise<void> {
        console.log(`associating app, ${appId} with env, ${environmentId}`)
        const envToAppEdge: GremlinEdge = {
            id: `${environmentId}.${appId}`,
            destinationVertexId: appId,
            destinationVertexPk: appId,
            label: "contained by",
            sourceVertexId: environmentId,
            sourceVertexPk: environmentId

        }
        const appToEnvEdge: GremlinEdge = {
            id: `${appId}.${environmentId}`,
            destinationVertexId: environmentId,
            destinationVertexPk: environmentId,
            label: "contains",
            sourceVertexId: appId,
            sourceVertexPk: appId

        }
        await upsertEdge(appToEnvEdge)
        await upsertEdge(envToAppEdge)
    },
    async addApiEndpointAssociation(environmentId: string, apiEndpointId: string, edgeStatus: string): Promise<void> {

        const envToApiEndpointEdge: GremlinEdge = {
            id: `${environmentId}.${apiEndpointId}`,
            destinationVertexId: apiEndpointId,
            destinationVertexPk: apiEndpointId,
            label: "consumes",
            sourceVertexId: environmentId,
            sourceVertexPk: environmentId,
            properties: {
                status: edgeStatus
            }
        }
        const apiEndpointToEnvEdge: GremlinEdge = {
            id: `${apiEndpointId}.${environmentId}`,
            destinationVertexId: environmentId,
            destinationVertexPk: environmentId,
            label: "consumed by",
            sourceVertexId: apiEndpointId,
            sourceVertexPk: apiEndpointId,
            properties: {
                status: edgeStatus
            }
        }
        await upsertEdge(envToApiEndpointEdge)
        await upsertEdge(apiEndpointToEnvEdge)
    }
} as EnvironmentService
