import dotenv from 'dotenv';
dotenv.config();

export interface OpenRouterConfig {
  apiKey?: string;
  model?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

export class OpenRouterService {
  private static defaultModel = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

  public static getApiKey(customKey?: string): string {
    return (customKey || process.env.OPENROUTER_API_KEY || '').trim();
  }

  public static getModel(customModel?: string): string {
    return customModel || process.env.OPENROUTER_MODEL || this.defaultModel;
  }

  /**
   * Complete chat with OpenRouter API
   */
  public static async chatCompletion(
    messages: ChatMessage[],
    options?: {
      apiKey?: string;
      model?: string;
      temperature?: number;
      responseFormatJson?: boolean;
    }
  ): Promise<string> {
    const apiKey = this.getApiKey(options?.apiKey);
    const model = this.getModel(options?.model);

    if (!apiKey) {
      console.warn('[OpenRouter] No API key provided. Using fallback mock generation.');
      return this.generateMockResponse(messages);
    }

    try {
      const payload: any = {
        model,
        messages,
        temperature: options?.temperature ?? 0.4,
      };

      if (options?.responseFormatJson) {
        payload.response_format = { type: 'json_object' };
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://snapcard.local',
          'X-Title': 'SnapCard Knowledge Assistant',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[OpenRouter API Error ${response.status}]:`, errorText);
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content || '';
      return content;
    } catch (err: any) {
      console.error('[OpenRouter Request Failed]:', err.message);
      // If live request fails, fallback gracefully if desired or bubble up
      if (!apiKey || err.message.includes('401') || err.message.includes('402')) {
        console.warn('[OpenRouter] Falling back to high-fidelity mock generator');
        return this.generateMockResponse(messages);
      }
      throw err;
    }
  }

  /**
   * Parse JSON safely from LLM output (handles ```json fences and unescaped chars)
   */
  public static parseJsonFromLLM<T = any>(rawText: string): T {
    let clean = rawText.trim();
    // Remove markdown code fences if present
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      return JSON.parse(clean);
    } catch (e) {
      // Try to find the first '{' and last '}'
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const jsonCandidate = clean.substring(start, end + 1);
        try {
          return JSON.parse(jsonCandidate);
        } catch (inner) {
          console.error('[JSON Parse Error] Raw text:', rawText);
          throw new Error('Failed to parse model JSON output');
        }
      }
      throw new Error('No valid JSON object found in model output');
    }
  }

  /**
   * Realistic fallback mock response for demoing when API keys are not provided
   */
  public static generateMockResponse(messages: ChatMessage[]): string {
    const userMsg = messages.find((m) => m.role === 'user')?.content;
    const query = typeof userMsg === 'string' ? userMsg : JSON.stringify(userMsg);
    
    // Check if looking for router intent
    if (query.includes('intent_decision') || messages.some((m) => typeof m.content === 'string' && m.content.includes('INTENT_ROUTER'))) {
      const isSearchNeeded = /最新|新闻|价格|实体|哪里|人物|公司|今天|202|谁|谁是|参数|评测|历史/i.test(query);
      return JSON.stringify({
        needsSearch: isSearchNeeded,
        searchQuery: query.replace(/[^\u4e00-\u9fa5a-zA-Z0-9 ]/g, '').trim() || '知识科普',
        reason: isSearchNeeded ? 'Query involves factual or entity lookup' : 'General conceptual reasoning'
      });
    }

    // Default mock knowledge card response
    return JSON.stringify({
      title: query.slice(0, 8) || '知识速览',
      oneLiner: '透过表象看本质：核心逻辑在于系统协同与能量守恒。',
      content: `### 核心原理与通俗拆解\n\n关于 **${query.slice(0, 15)}**，我们可以将其拆解为三个关键维度：\n\n1. **底层机制**：系统的初始输入通过特定规则转换，形成可预测的确定性状态。\n2. **关键应用**：在现代工业与日常生活中无处不在，大幅提升信息与物质流动效率。\n3. **直观类比**：就像水流顺着管道流淌，水压与阀门决定了最终喷涌的势能。\n\n> 💡 **关键要点**：掌握其核心约束条件，便能在实际场景中灵活迁移与应用。`,
      diagram: `graph TD\n  A[输入端 / Input] --> B[核心转化逻辑 / Core Logic]\n  B --> C[预期输出 / Output]\n  B --> D[环境反馈 / Feedback]\n  D -.-> A`,
      imagePrompts: [`A modern aesthetic 3D isometric minimalist concept visualization of ${query.slice(0, 20)}, high tech, soft studio lighting, glassmorphism`],
      tags: ['核心原理', '深度认知', '知识卡片'],
      language: /[\u4e00-\u9fa5]/.test(query) ? 'zh-CN' : 'en'
    });
  }
}
