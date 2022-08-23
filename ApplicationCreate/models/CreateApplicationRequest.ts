export interface CreateApplicationRequest {
    applicationName: string,
    secret: boolean
    environments: string[]
}