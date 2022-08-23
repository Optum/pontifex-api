import { PontifexApiEndpoint } from "../../api-endpoint-service/models/PontifexApiEndpoint";
import { PontifexApplication } from "../../application-service/models/PontifexApplication";
import { PontifexPermissionRequest } from "../../permission-request-service/models/PontifexPermissionRequest";

export interface PontifexEnvironment {
    name: string // app registration name + dev/stage/prod
    id: string // app registration object id
    level: string // dev-stage-prod
}

export interface PontifexEnvironmentBundle {
    environment: PontifexEnvironment
    endpoints: PontifexApiEndpoint[]
    permissionRequests: PontifexPermissionRequest[]
    application: PontifexApplication
}

export function PontifexEnvironmentFromGremlin(vertex: any): PontifexEnvironment {
    return {
        id: vertex["id"],
        name: vertex["properties"]["name"][0]["value"],
        level: vertex["properties"]["level"][0]["value"]
    }
}