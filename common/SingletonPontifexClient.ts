import { PontifexAAD } from "@optum/pontifex-aad";

export class SingletonPontifexClient {
    private static _instance: PontifexAAD

    private constructor(props) {}

    public static get Instance() {
        return this._instance || (this._instance = new PontifexAAD())
    }

}