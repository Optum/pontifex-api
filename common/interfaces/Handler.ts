import { HttpRequest } from "@azure/functions";

export interface Handler {
    handleRequest: (request: HttpRequest) => Promise<void>
}