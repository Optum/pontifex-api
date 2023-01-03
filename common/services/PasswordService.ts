import { AuthenticatedContext } from "@optum/azure-functions-auth";
import { ApiEndpointService } from "../interfaces/services/api-endpoint-service/ApiEndpointService";
import { PontifexApiEndpointFromGremlin } from "../interfaces/services/api-endpoint-service/models/PontifexApiEndpoint";
import { PontifexEnvironmentFromGremlin } from "../interfaces/services/environment-service/models/PontifexEnvironment";
import {
  PontifexPassword,
  PontifexPasswordBundle,
  PontifexPasswordFromGremlin
} from "../interfaces/services/password-service/models/Password";
import { PasswordService } from "../interfaces/services/password-service/PasswordService";
import {
  PontifexPermissionRequestFromGremlin
} from "../interfaces/services/permission-request-service/models/PontifexPermissionRequest";
import { SingletonCosmosClient } from "../SingletonCosmosClient";
import { getVertexAndChildren, upsertVertex } from "../utils/gremlin";

const cosmos = SingletonCosmosClient.Instance

export function generateService(context: AuthenticatedContext): PasswordService {
  return {
    async get(id: string): Promise<PontifexPasswordBundle> {
      if (!id) {
        throw new Error("id cannot be empty or undefined")
      }

      const {vertex, connections} = await getVertexAndChildren(id, id, "password")

      return {
        password: PontifexPasswordFromGremlin(vertex),
        environment: PontifexEnvironmentFromGremlin(connections["is password for"].environment[0]),
      }
    },
    async create(password: PontifexPassword): Promise<void> {
      await upsertVertex({
        id: password.id,
        pk: password.id,
        defaultProperties: {
          type: "password"
        },
        updatedProperties: {
          start: password.start,
          end: password.end,
          password: password.password,
          displayName: password.displayName
        }
      })
    },
    async delete(id: string): Promise<void> {
      await cosmos.submit('g.V(id).drop()', {
        id
      })
    }
  }
}