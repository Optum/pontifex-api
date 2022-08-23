import { PontifexUser } from "./models/PontifexUser";

export interface UserService {
    get: (id: string) => Promise<PontifexUser>
    update: (user: PontifexUser) => Promise<PontifexUser>
    delete: (id: string) => Promise<void>
}