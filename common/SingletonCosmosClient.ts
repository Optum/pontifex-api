import * as Gremlin from 'gremlin'

export class SingletonCosmosClient {
    private static _instance: Gremlin.driver.Client

    private constructor() {
        throw new Error("Use SingletonCosmosClient.getInstance()")
    }

    static get Instance() {
        if (!SingletonCosmosClient._instance) {
            const authenticator = new Gremlin.driver.auth.PlainTextSaslAuthenticator(`/dbs/${process.env.PONTIFEX_DATABASE_NAME}/colls/${process.env.PONTIFEX_COLLECTION_NAME}`, process.env.PONTIFEX_DATABASE_PRIMARY_KEY)

            SingletonCosmosClient._instance = new Gremlin.driver.Client(
                process.env.PONTIFEX_DATABASE_ENDPOINT,
                {
                    authenticator,
                    traversalsource: "g",
                    rejectUnauthorized: true,
                    mimeType: "application/vnd.gremlin-v2.0+json"
                }
            );
        }
        return SingletonCosmosClient._instance
    }

}