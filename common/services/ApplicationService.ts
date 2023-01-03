import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { ApplicationService } from "../interfaces/services/application-service/ApplicationService";
import {
    PontifexApplication,
    PontifexApplicationBundle,
    PontifexApplicationFromGremlin
} from "../interfaces/services/application-service/models/PontifexApplication";
import {
    PontifexAuditEvent,
    PontifexAuditEventFromGremlin
} from "../interfaces/services/audit-service/models/AuditService";
import { PontifexEnvironmentFromGremlin } from "../interfaces/services/environment-service/models/PontifexEnvironment";
import { SingletonCosmosClient } from "../SingletonCosmosClient";

import { getAllVerticesOfType, getVertexAndChildren, GremlinEdge, upsertEdge, upsertVertex } from "../utils/gremlin";

const cosmos = SingletonCosmosClient.Instance

export function generateService(context: AuthenticatedContext): ApplicationService {

    return {
        async delete(id: string): Promise<void> {
            if (!id) {
                throw new Error("id cannot be empty or undefined")
            }

            await cosmos.submit('g.V(id).drop()', {
                id
            })
        }, async get(id: string): Promise<PontifexApplicationBundle> {
            if (!id) {
                throw new Error("id cannot be empty or undefined")
            }

            const {vertex, connections} = await getVertexAndChildren(id, id, "application")

            const bundle: PontifexApplicationBundle = {
                application: PontifexApplicationFromGremlin(vertex),
                environments: connections?.contains?.environment?.map(PontifexEnvironmentFromGremlin) ?? []
            }

            return bundle;
        }, async getAllByUser(userId: string): Promise<PontifexApplication[]> {
            if (!userId) {
                throw new Error("userId cannot be empty or undefined")
            }

            const {connections} = await getVertexAndChildren(userId, userId, "user")

            let apps = connections.owns?.application ?? [];

            return apps.map(PontifexApplicationFromGremlin);
        }, async getAll(): Promise<PontifexApplication[]> {
            const apps = await getAllVerticesOfType("application")

            return apps.map(PontifexApplicationFromGremlin);
        }, async setOwningGroup(id: string, groupId: string): Promise<void> {
            if (!groupId) {
                throw new Error("id cannot be empty or undefined")
            }

            await upsertVertex({
                id: id,
                pk: id,
                updatedProperties: {
                    owningGroup: groupId
                }
            })

            return;
        }, async update(application: PontifexApplication): Promise<void> {

            return await upsertVertex({
                id: application.id,
                pk: application.id,
                defaultProperties: {
                    type: "application",
                    creator: application.creator,
                },
                updatedProperties: {
                    secret: application.secret,
                    name: application.name
                }
            })
        }, async addUserOwnerAssociation(appId: string, userId: string): Promise<void> {
            const userToAppEdge: GremlinEdge = {
                destinationVertexId: appId,
                destinationVertexPk: appId,
                label: "owns",
                sourceVertexId: userId,
                sourceVertexPk: userId
            }
            const appToUserEdge: GremlinEdge = {
                destinationVertexId: userId,
                destinationVertexPk: userId,
                label: "owned by",
                sourceVertexId: appId,
                sourceVertexPk: appId
            }

            await upsertEdge(userToAppEdge)
            await upsertEdge(appToUserEdge)
        }, async getAuditEvents(appId: string): Promise<PontifexAuditEvent[]> {
            const query = `g.V(id).repeat(out('contains', 'requests permission', 'has event')).until(has('type', 'audit-event')).dedup()`
            const bindings = {
                id: appId
            }

            const result = await cosmos.submit(query, bindings)
            return result._items.map(PontifexAuditEventFromGremlin)
        }
    }
}
