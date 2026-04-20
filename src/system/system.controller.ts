import { Controller, Get, Post, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as si from 'systeminformation';
import { Run } from '../entities/Run.entity';
import { AuditService } from './audit.service';

@Controller('system')
export class SystemController {
  constructor(
    @InjectRepository(Run)
    private runRepository: Repository<Run>,
    private auditService: AuditService,
  ) {}

  @Post('serve-latest')
  async serveLatest() {
    const latestRun = await this.runRepository.findOne({
      where: { status: 'completed' },
      order: { createdAt: 'DESC' },
    });

    if (!latestRun) {
      throw new HttpException('No completed runs found to serve.', HttpStatus.NOT_FOUND);
    }

    try {
      const res = await fetch('http://lightning-tune:8000/serve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: latestRun.jobId,
          port: 8005,
        }),
      });

      if (!res.ok) throw new Error('Provisioning failed at worker level.');

      await this.auditService.log({
        type: 'SUCCESS',
        message: `Instant Serve initiated for ${latestRun.modelRepoId} (Job: ${latestRun.jobId})`,
        action: 'instant_serve_triggered',
      });

      return { status: 'provisioning', jobId: latestRun.jobId, model: latestRun.modelRepoId };
    } catch (e) {
       await this.auditService.log({
          type: 'ERROR',
          message: `Failed to trigger Instant Serve for ${latestRun.modelRepoId}: ${e.message}`,
          action: 'instant_serve_failed',
       });
       throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('hardware')
  async getHardware() {
    const graphics = await si.graphics();
    const cpu = await si.cpu();
    const mem = await si.mem();
    
    let gpuName = 'CPU Processing Only';
    if (graphics.controllers && graphics.controllers.length > 0) {
       const nvidiaGpu = graphics.controllers.find((g: any) => g.vendor.toLowerCase().includes('nvidia'));
       if (nvidiaGpu) gpuName = nvidiaGpu.model;
       else gpuName = graphics.controllers[0].model;
    }
    
    return {
      computeEngine: gpuName,
      architecture: `${cpu.manufacturer} ${cpu.brand} (${cpu.cores} Cores)`,
      vramCacheGigabytes: (mem.total / (1024 ** 3)).toFixed(1) + ' GB',
    };
  }
}
