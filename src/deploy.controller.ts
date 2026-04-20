import { Controller, Post, Body } from '@nestjs/common';
import { EC2Client, RunInstancesCommand } from '@aws-sdk/client-ec2';

@Controller('deploy')
export class DeployController {
  
  @Post('aws')
  async deployToAws(@Body() payload: { accessKey: string, secretKey: string, modelHubId: string, instanceType: string }) {
    // 1. Initialize EC2 Client with dynamic credentials passed from secure Setting Vault
    const client = new EC2Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: payload.accessKey,
        secretAccessKey: payload.secretKey,
      }
    });

    // 2. Generate vLLM Startup Script dynamically
    const userData = `#!/bin/bash
      docker run -d --gpus all \
      -v ~/.cache/huggingface:/root/.cache/huggingface \
      -p 8000:8000 \
      --ipc=host \
      vllm/vllm-openai:latest \
      --model ${payload.modelHubId} --max-model-len 4096
    `;

    // 3. Dispatch AWS EC2 Spinup
    const command = new RunInstancesCommand({
      ImageId: 'ami-0c55b159cbfafe1f0', // standard DLAMI or custom DL AMI
      InstanceType: (payload.instanceType || 'g4dn.xlarge') as any,
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
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }
}
