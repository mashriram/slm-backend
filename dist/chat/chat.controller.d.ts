import { AuditService } from '../system/audit.service';
export declare class ChatController {
    private readonly auditService;
    constructor(auditService: AuditService);
    runInference(payload: {
        prompt: string;
        systemPrompt?: string;
        provider?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
        apiKey?: string;
    }): Promise<{
        content: string;
        metrics: {
            tokens: number;
            timeMs: number;
            tps: number;
        };
    }>;
}
