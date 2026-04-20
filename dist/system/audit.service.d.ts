import { Repository } from 'typeorm';
import { AuditLog } from '../entities/AuditLog.entity';
export declare class AuditService {
    private auditRepository;
    constructor(auditRepository: Repository<AuditLog>);
    log(entry: {
        type: string;
        message: string;
        action?: string;
        metadata?: any;
    }): Promise<AuditLog>;
    findAll(limit?: number): Promise<AuditLog[]>;
}
