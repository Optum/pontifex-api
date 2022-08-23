import { PontifexEnvironment } from "../../environment-service/models/PontifexEnvironment";

export interface PontifexApplication {
    id: string
    name: string // human-friendly
    creator: string
    secret: boolean // should the application be discoverable/searchable
}

export interface PontifexApplicationBundle {
    application: PontifexApplication
    environments?: PontifexEnvironment[]
}

export function PontifexApplicationFromGremlin(vertex: any): PontifexApplication {
    return {
        creator: vertex["properties"]["creator"][0]["value"],
        secret: vertex["properties"]["secret"][0]["value"],
        id: vertex["id"],
        name: vertex["properties"]["name"][0]["value"]
    }
}