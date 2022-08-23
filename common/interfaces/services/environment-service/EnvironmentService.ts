import { PontifexEnvironment, PontifexEnvironmentBundle } from "./models/PontifexEnvironment";

export interface EnvironmentService {
    addApplicationAssociation: (appId: string, environmentId: string) => Promise<void>
    addApiEndpointAssociation: (environmentId: string, apiEndpointId: string, edgeStatus: string) => Promise<void>
    get: (id: string) => Promise<PontifexEnvironmentBundle>
    getAllForApplication: (appId: string) => Promise<PontifexEnvironment[]>
    update: (environment: PontifexEnvironment) => Promise<PontifexEnvironment>
    delete: (id: string) => Promise<void>
}