import { AppRole } from "@microsoft/microsoft-graph-types";

export interface Role {
    displayName: string
    description: string
    claimValue: string
    sensitive: boolean
}

export interface Sensitive {
    sensitive?: boolean
}

export type SensitiveAppRole = AppRole & Sensitive

export interface ApplicationUpdateRolesRequest {
    roles: Role[]
}