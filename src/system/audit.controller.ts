import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('system/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getLogs(@Query('limit') limit?: number) {
    return this.auditService.findAll(limit ? Number(limit) : 50);
  }
}
