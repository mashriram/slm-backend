import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/AuditLog.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(entry: { type: string; message: string; action?: string; metadata?: any }) {
    const log = new AuditLog();
    log.timestamp = new Date().toISOString();
    log.type = entry.type;
    log.message = entry.message;
    log.action = entry.action as any;
    log.metadata = (entry.metadata ? JSON.stringify(entry.metadata) : null) as any;
    return this.auditRepository.save(log);
  }

  async findAll(limit = 50) {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
