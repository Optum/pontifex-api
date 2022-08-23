import { AuthorizeOptions, requireAuthorization } from "@aaavang/azure-functions-auth";
import { AzureFunction } from "@azure/functions";

export function AuthorizationMiddleware(func: AzureFunction, requiredRole?: string) {
    const options: AuthorizeOptions = {
        jwksEndpoint: process.env.AAD_JWKS_ENDPOINT,
        requiredAud: process.env.AAD_REQUIRED_AUD,
        requiredIssuer: process.env.AAD_REQUIRED_ISSUER,
    }
    if (requiredRole) {
        options.requiredRole = requiredRole
    }
    return requireAuthorization(func, options)
}