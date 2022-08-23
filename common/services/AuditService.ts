import { AuthenticatedContext } from "@aaavang/azure-functions-auth";
import { v4 as uuid } from "uuid"
import { AuditService } from "../interfaces/services/audit-service/AuditService";
import { PontifexAuditEvent } from "../interfaces/services/audit-service/models/AuditService";
import { SingletonCosmosClient } from "../SingletonCosmosClient";
import { upsertEdge, upsertVertex } from "../utils/gremlin";

const cosmos = SingletonCosmosClient.Instance

export function generateService(context: AuthenticatedContext): AuditService {

    const id = uuid()
    return {
        publishEvent: async (event: PontifexAuditEvent): Promise<void> => {
            const updatedProperties = {
                action: event.action,
                value: event.value
            }
            if (event.associatedUserId) {
                updatedProperties['associatedUserId'] = event.associatedUserId
            }

            await upsertVertex({
                id,
                pk: id,
                defaultProperties: {
                    type: "audit-event",
                    createDate: new Date().toISOString()
                },
                updatedProperties
            })

            for (const targetResourceId of Array.isArray(event.targetResourceId) ? event.targetResourceId : [event.targetResourceId]) {
                await upsertEdge({
                    destinationVertexId: id,
                    destinationVertexPk: id,
                    label: "has event",
                    sourceVertexId: targetResourceId,
                    sourceVertexPk: targetResourceId
                })

                await upsertEdge({
                    sourceVertexId: id,
                    sourceVertexPk: id,
                    label: "is event for",
                    destinationVertexId: targetResourceId,
                    destinationVertexPk: targetResourceId
                })
            }
        }
    }
}