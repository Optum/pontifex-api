import { PontifexEnvironment } from "../../environment-service/models/PontifexEnvironment";
import { PontifexPermissionRequest } from "../../permission-request-service/models/PontifexPermissionRequest";

export interface PontifexApiEndpoint {
    id: string
    name: string // app registration name + dev/stage/prod
    sensitive: boolean
}

export interface PontifexApiEndpointBundle {
    endpoint: PontifexApiEndpoint
    environment: PontifexEnvironment
    requests?: PontifexPermissionRequest[]
}

export function PontifexApiEndpointFromGremlin(vertex: any): PontifexApiEndpoint {
    return {
        id: vertex["id"],
        name: vertex["properties"]["name"][0]["value"],
        sensitive: vertex["properties"]["sensitive"]?.[0]["value"]
    }
}