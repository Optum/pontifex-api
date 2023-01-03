import { PontifexApiEndpoint } from "../../api-endpoint-service/models/PontifexApiEndpoint";
import { PontifexEnvironment } from "../../environment-service/models/PontifexEnvironment";

export interface PontifexPassword {
  id: string
  displayName: string
  start: string
  end: string
  password: string
}

export interface PontifexPasswordBundle {
  password: PontifexPassword
  environment: PontifexEnvironment
}

export function PontifexPasswordFromGremlin(vertex: any): PontifexPassword {
  return {
    id: vertex["id"],
    displayName: vertex["properties"]["displayName"][0]["value"],
    start: vertex["properties"]["start"]?.[0]["value"],
    end: vertex["properties"]["end"]?.[0]["value"],
    password: vertex["properties"]["password"]?.[0]["value"],
  }
}