export interface PontifexUser {
    id: string
    name: string
    email: string
}

export function PontifexUserFromGremlin(vertex: any): PontifexUser {
    return {
        id: vertex["id"],
        name: vertex["properties"]["name"][0]["value"],
        email: vertex["properties"]["email"][0]["value"]
    }
}