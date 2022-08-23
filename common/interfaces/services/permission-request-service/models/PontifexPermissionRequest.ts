import { PontifexApiEndpoint } from "../../api-endpoint-service/models/PontifexApiEndpoint";
import { PontifexEnvironment } from "../../environment-service/models/PontifexEnvironment";

export interface PontifexPermissionRequest {
    id: string // source-env-id.app-role-id
    requestor: string
    createDate: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    roleAssignmentId?: string
}

export interface PontifexPermissionRequestBundle {
    permissionRequest: PontifexPermissionRequest,
    sourceEnvironment: PontifexEnvironment,
    targetEndpoint: PontifexApiEndpoint
}

export function PontifexPermissionRequestFromGremlin(vertex: any): PontifexPermissionRequest {
    return {
        id: vertex["id"],
        requestor: vertex["properties"]["requestor"][0]["value"],
        createDate: vertex["properties"]["createDate"][0]["value"],
        status: vertex["properties"]["status"][0]["value"],
        roleAssignmentId: vertex["properties"]["roleAssignmentId"]?.[0]["value"]
    }
}