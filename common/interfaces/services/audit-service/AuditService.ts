import { PontifexAuditEvent } from "./models/AuditService";

export interface AuditService {
    publishEvent: (event: PontifexAuditEvent) => Promise<void>
}