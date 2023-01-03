import { PontifexAuditEvent } from "../audit-service/models/AuditService";
import {
    PontifexApplication,
    PontifexApplicationBundle,
} from "./models/PontifexApplication";

export interface ApplicationService {
    get: (id: string) => Promise<PontifexApplicationBundle>
    getAllByUser: (userId: string) => Promise<PontifexApplication[]>
    getAll: () => Promise<PontifexApplication[]>
    update: (application: PontifexApplication) => Promise<void>
    delete: (id: string) => Promise<void>
    setOwningGroup: (id: string, groupId: string) => Promise<void>
    addUserOwnerAssociation: (appId: string, userId: string) => Promise<void>
    getAuditEvents: (id: string) => Promise<PontifexAuditEvent[]>
}