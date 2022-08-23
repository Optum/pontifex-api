import { PontifexEnvironment } from "../environment-service/models/PontifexEnvironment";
import { PontifexUser } from "../user-service/models/PontifexUser";
import { PontifexApiEndpoint, PontifexApiEndpointBundle } from "./models/PontifexApiEndpoint";

export interface ApiEndpointService {
    addApplicationAssociation: (endpoint: PontifexApiEndpoint, appId: string) => Promise<void>
    get: (id: string) => Promise<PontifexApiEndpointBundle | null>
    getAllConsumers: (id: string) => Promise<PontifexEnvironment[]>
    getOwners: (id: string) => Promise<PontifexUser[]>
    update: (endpoint: PontifexApiEndpoint) => Promise<PontifexApiEndpoint>
    delete: (id: string) => Promise<void>
}