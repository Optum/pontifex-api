export interface Permission {
    roleId: string
    roleApplicationObjectId: string
}

export interface ApplicationUpdatePermissionsRequest {
    permissions: Permission[]
}