import { PontifexUser, PontifexUserFromGremlin } from "../interfaces/services/user-service/models/PontifexUser";
import { UserService } from "../interfaces/services/user-service/UserService";
import { SingletonCosmosClient } from "../SingletonCosmosClient";

import { getVertex, upsertVertex } from "../utils/gremlin";

const cosmos = SingletonCosmosClient.Instance

export default {
    async delete(id: string): Promise<void> {
        if (!id) {
            throw new Error("id cannot be empty or undefined")
        }

        await cosmos.submit('g.V(id).drop()', {
            id
        })
    }, async get(id: string): Promise<PontifexUser> {
        if (!id) {
            throw new Error("id cannot be empty or undefined")
        }

        const vertex = await getVertex(id, id)

        return PontifexUserFromGremlin(vertex);
    }, async update(user: PontifexUser): Promise<PontifexUser> {

        const vertex = await upsertVertex({
            id: user.id,
            pk: user.id,
            defaultProperties: {
                type: "user"
            },
            updatedProperties: {
                name: user.name,
                email: user.email
            }
        })

        return PontifexUserFromGremlin(vertex)
    }
} as UserService
