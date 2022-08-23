import { PontifexApiEndpoint } from "../api-endpoint-service/models/PontifexApiEndpoint";
import { PontifexEnvironment } from "../environment-service/models/PontifexEnvironment";
import { PontifexPermissionRequest, PontifexPermissionRequestBundle } from "./models/PontifexPermissionRequest";

export interface PermissionRequestService {
    get: (id: string) => Promise<PontifexPermissionRequestBundle | null>
    create: (request: PontifexPermissionRequest, sourceEnvironment: PontifexEnvironment, targetEndpoint: PontifexApiEndpoint) => Promise<PontifexPermissionRequest>
    upsert: (request: PontifexPermissionRequest) => Promise<PontifexPermissionRequest>
    updateStatus: (id: string, status: string) => Promise<PontifexPermissionRequest>
    getPendingForUser: (ownerId: string) => Promise<PontifexPermissionRequest[]>
    delete: (id: string) => Promise<void>
}