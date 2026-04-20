"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeployController = void 0;
const common_1 = require("@nestjs/common");
const client_ec2_1 = require("@aws-sdk/client-ec2");
let DeployController = class DeployController {
    async deployToAws(payload) {
        const client = new client_ec2_1.EC2Client({
            region: 'us-east-1',
            credentials: {
                accessKeyId: payload.accessKey,
                secretAccessKey: payload.secretKey,
            }
        });
        const userData = `#!/bin/bash
      docker run -d --gpus all \
      -v ~/.cache/huggingface:/root/.cache/huggingface \
      -p 8000:8000 \
      --ipc=host \
      vllm/vllm-openai:latest \
      --model ${payload.modelHubId} --max-model-len 4096
    `;
        const command = new client_ec2_1.RunInstancesCommand({
            ImageId: 'ami-0c55b159cbfafe1f0',
            InstanceType: (payload.instanceType || 'g4dn.xlarge'),
            MinCount: 1,
            MaxCount: 1,
            UserData: Buffer.from(userData).toString('base64'),
        });
        try {
            const response = await client.send(command);
            const instanceId = response.Instances?.[0]?.InstanceId;
            return {
                status: 'provisioning',
                instanceId,
                message: 'AWS g4dn instance initializing. vLLM will auto-serve your HF artifact on port 8000 shortly.'
            };
        }
        catch (error) {
            return { status: 'failed', error: error.message };
        }
    }
};
exports.DeployController = DeployController;
__decorate([
    (0, common_1.Post)('aws'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeployController.prototype, "deployToAws", null);
exports.DeployController = DeployController = __decorate([
    (0, common_1.Controller)('deploy')
], DeployController);
//# sourceMappingURL=deploy.controller.js.map