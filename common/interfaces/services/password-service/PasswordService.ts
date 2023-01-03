import { PontifexPassword, PontifexPasswordBundle } from "./models/Password";

export interface PasswordService {
  get: (id: string) => Promise<PontifexPasswordBundle>
  delete: (id: string) => Promise<void>
  create: (password: PontifexPassword) => Promise<void>
}