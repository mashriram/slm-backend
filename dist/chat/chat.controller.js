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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../system/audit.service");
let ChatController = class ChatController {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    async runInference(payload) {
        const { prompt, systemPrompt, provider = 'huggingface', model = 'meta-llama/Meta-Llama-3-8B-Instruct', temperature = 0.7, maxTokens = 2048, apiKey } = payload;
        const hfToken = (provider === 'huggingface' ? apiKey : null) || process.env.HF_TOKEN;
        const openRouterToken = (provider === 'openrouter' || provider === 'groq' ? apiKey : null) || process.env.OPENROUTER_API_KEY;
        let generatedText = '';
        let tokensGenerated = 0;
        const startTime = Date.now();
        try {
            if (provider === 'openrouter' || provider === 'groq') {
                if (!openRouterToken)
                    throw new Error('OPENROUTER_API_KEY not configured.');
                const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${openRouterToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
                            { role: 'user', content: prompt }
                        ],
                        temperature,
                        max_tokens: maxTokens,
                    })
                });
                const data = await res.json();
                if (data.error)
                    throw new Error(data.error.message || 'OpenRouter API Error');
                generatedText = data.choices[0].message.content;
                tokensGenerated = data.usage?.completion_tokens || generatedText.split(' ').length * 1.3;
            }
            else if (provider === 'litserve') {
                const internalApiUrl = 'http://lightning-tune:8000';
                const fullPrompt = `${systemPrompt ? systemPrompt + '\n\n' : ''}${prompt}`;
                await this.auditService.log({
                    type: 'INFO',
                    message: `Starting local inference with model: ${model}`,
                    action: 'litserve_predict',
                    metadata: { model }
                });
                const res = await fetch(`${internalApiUrl}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: fullPrompt,
                        model_id: model,
                        max_new_tokens: maxTokens,
                        temperature,
                    }),
                });
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody.detail || `Local inference service returned ${res.status}`);
                }
                const data = await res.json();
                if (!data.completion)
                    throw new Error(data.error || 'Local /predict returned no completion');
                generatedText = data.completion;
                tokensGenerated = generatedText.split(' ').length * 1.3;
            }
            else {
                if (!hfToken)
                    throw new Error('HF_TOKEN not configured.');
                const res = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
                            { role: 'user', content: prompt }
                        ],
                        temperature,
                        max_tokens: maxTokens,
                    })
                });
                const data = await res.json();
                if (data.error) {
                    const errorMsg = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : data.error;
                    throw new Error(errorMsg);
                }
                if (data.choices && data.choices.length > 0) {
                    generatedText = data.choices[0].message.content;
                }
                else if (Array.isArray(data) && data[0]?.generated_text) {
                    generatedText = data[0].generated_text;
                }
                else {
                    console.error("Unknown HF response format:", data);
                    throw new Error('HuggingFace returned an unknown format.');
                }
                tokensGenerated = data.usage?.completion_tokens || generatedText.split(' ').length * 1.3;
            }
            const timeMs = Date.now() - startTime;
            const tps = (tokensGenerated / (timeMs / 1000)).toFixed(1);
            return {
                content: generatedText,
                metrics: {
                    tokens: Math.round(tokensGenerated),
                    timeMs,
                    tps: parseFloat(tps)
                }
            };
        }
        catch (error) {
            console.error("Inference proxy error:", error.message);
            throw new common_1.HttpException(`Inference failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('inference'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "runInference", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map