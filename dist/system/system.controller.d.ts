import { Repository } from 'typeorm';
import { Run } from '../entities/Run.entity';
import { AuditService } from './audit.service';
export declare class SystemController {
    private runRepository;
    private auditService;
    constructor(runRepository: Repository<Run>, auditService: AuditService);
    serveLatest(): Promise<{
        status: string;
        jobId: string;
        model: string;
    }>;
    getHardware(): Promise<{
        computeEngine: string;
        architecture: string;
        vramCacheGigabytes: string;
    }>;
}
