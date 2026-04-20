"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const si = __importStar(require("systeminformation"));
const Run_entity_1 = require("../entities/Run.entity");
const audit_service_1 = require("./audit.service");
let SystemController = class SystemController {
    runRepository;
    auditService;
    constructor(runRepository, auditService) {
        this.runRepository = runRepository;
        this.auditService = auditService;
    }
    async serveLatest() {
        const latestRun = await this.runRepository.findOne({
            where: { status: 'completed' },
            order: { createdAt: 'DESC' },
        });
        if (!latestRun) {
            throw new common_1.HttpException('No completed runs found to serve.', common_1.HttpStatus.NOT_FOUND);
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
            if (!res.ok)
                throw new Error('Provisioning failed at worker level.');
            await this.auditService.log({
                type: 'SUCCESS',
                message: `Instant Serve initiated for ${latestRun.modelRepoId} (Job: ${latestRun.jobId})`,
                action: 'instant_serve_triggered',
            });
            return { status: 'provisioning', jobId: latestRun.jobId, model: latestRun.modelRepoId };
        }
        catch (e) {
            await this.auditService.log({
                type: 'ERROR',
                message: `Failed to trigger Instant Serve for ${latestRun.modelRepoId}: ${e.message}`,
                action: 'instant_serve_failed',
            });
            throw new common_1.HttpException(e.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getHardware() {
        const graphics = await si.graphics();
        const cpu = await si.cpu();
        const mem = await si.mem();
        let gpuName = 'CPU Processing Only';
        if (graphics.controllers && graphics.controllers.length > 0) {
            const nvidiaGpu = graphics.controllers.find((g) => g.vendor.toLowerCase().includes('nvidia'));
            if (nvidiaGpu)
                gpuName = nvidiaGpu.model;
            else
                gpuName = graphics.controllers[0].model;
        }
        return {
            computeEngine: gpuName,
            architecture: `${cpu.manufacturer} ${cpu.brand} (${cpu.cores} Cores)`,
            vramCacheGigabytes: (mem.total / (1024 ** 3)).toFixed(1) + ' GB',
        };
    }
};
exports.SystemController = SystemController;
__decorate([
    (0, common_1.Post)('serve-latest'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "serveLatest", null);
__decorate([
    (0, common_1.Get)('hardware'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "getHardware", null);
exports.SystemController = SystemController = __decorate([
    (0, common_1.Controller)('system'),
    __param(0, (0, typeorm_1.InjectRepository)(Run_entity_1.Run)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_1.AuditService])
], SystemController);
//# sourceMappingURL=system.controller.js.map