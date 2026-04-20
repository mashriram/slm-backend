import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';

import { ChatModule } from './chat.module';
import { AuditService } from '../system/audit.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly auditService: AuditService) {}
  @Post('inference')
  async runInference(@Body() payload: { prompt: string; systemPrompt?: string; provider?: string; model?: string; temperature?: number; maxTokens?: number; apiKey?: string }) {
    const { prompt, systemPrompt, provider = 'huggingface', model = 'meta-llama/Meta-Llama-3-8B-Instruct', temperature = 0.7, maxTokens = 2048, apiKey } = payload;
    
    // API key from request body takes priority over env vars
    const hfToken = (provider === 'huggingface' ? apiKey : null) || process.env.HF_TOKEN;
    const openRouterToken = (provider === 'openrouter' || provider === 'groq' ? apiKey : null) || process.env.OPENROUTER_API_KEY;
    
    let generatedText = '';
    let tokensGenerated = 0;
    const startTime = Date.now();

    try {
      if (provider === 'openrouter' || provider === 'groq') {
         if (!openRouterToken) throw new Error('OPENROUTER_API_KEY not configured.');
         
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
         if (data.error) throw new Error(data.error.message || 'OpenRouter API Error');
         generatedText = data.choices[0].message.content;
         tokensGenerated = data.usage?.completion_tokens || generatedText.split(' ').length * 1.3;
         
      } else if (provider === 'litserve') {
         // The lightning-tune FastAPI (port 8000) exposes /predict which lazy-loads
         // the model in-process via transformers.pipeline — no separate LitServe
         // subprocess on port 8005 is required for local inference.
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
            // No hard timeout — first call may take a while to download & load the model
         });

         if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.detail || `Local inference service returned ${res.status}`);
         }

         const data = await res.json();
         if (!data.completion) throw new Error(data.error || 'Local /predict returned no completion');
         generatedText = data.completion;
         tokensGenerated = generatedText.split(' ').length * 1.3;
         
      } else {
         // Default to HuggingFace Inference API Serverless
         if (!hfToken) throw new Error('HF_TOKEN not configured.');
         
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
         } else if (Array.isArray(data) && data[0]?.generated_text) {
            generatedText = data[0].generated_text;
         } else {
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

    } catch (error) {
       console.error("Inference proxy error:", error.message);
       throw new HttpException(`Inference failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
