import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../entities/AuditLog.entity';
import { Run } from '../entities/Run.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, Run])],
  controllers: [SystemController, AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class SystemModule {}
