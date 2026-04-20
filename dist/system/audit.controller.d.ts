import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getLogs(limit?: number): Promise<import("../entities/AuditLog.entity").AuditLog[]>;
}
