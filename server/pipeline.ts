import { OpenRouterService, ChatMessage } from './services/openrouter.js';
import { TavilyService, TavilySearchResult } from './services/tavily.js';
import { ImageGenService } from './services/imageGen.js';
import { CardDB, CardRecord, CardImage } from './db.js';

export interface GenerateCardParams {
  query: string;
  audience?: 'student' | 'general' | 'expert';
  needImage?: boolean;
  photoUrl?: string;
  openRouterKey?: string;
  tavilyKey?: string;
  model?: string;
  imageModel?: string;
  onEvent?: (event: string, data: any) => void;
}

export class CardPipeline {
  /**
   * Run full streaming knowledge card generation pipeline
   */
  public static async execute(params: GenerateCardParams): Promise<CardRecord> {
    const {
      query,
      audience = 'general',
      needImage = true,
      photoUrl,
      openRouterKey,
      tavilyKey,
      model,
      imageModel,
      onEvent = () => {},
    } = params;

    const emit = (event: string, data: any) => {
      try {
        onEvent(event, data);
      } catch (err) {
        console.error('[Pipeline emit error]', err);
      }
    };

    console.log(`\n[Pipeline] Starting card generation for query: "${query}", audience: ${audience}, needImage: ${needImage}`);

    // --- STEP 1: Intent Routing & Search Decision ---
    emit('status', {
      step: 'intent',
      message: '正在进行意图分流与搜索决策 (Gemini 3.7 Flash)...',
      stepNumber: 1,
      totalSteps: 4,
    });

    let needsSearch = false;
    let searchQuery = query;

    try {
      const routerMessages: ChatMessage[] = [
        {
          role: 'system',
          content: `You are an intelligent query router for a knowledge card system.
Determine if the user query requires real-world live facts, entities, news, prices, specifications, or real-time web search (Branch A), or is a general concept, math/logic principle, common sense, or philosophical reasoning (Branch B).

Respond strictly in JSON format:
{
  "needsSearch": boolean,
  "searchQuery": "optimized keyword for web search in the same language as query",
  "reason": "short rationale"
}`,
        },
        {
          role: 'user',
          content: `Query: "${query}"`,
        },
      ];

      const routerResponse = await OpenRouterService.chatCompletion(routerMessages, {
        apiKey: openRouterKey,
        model,
        temperature: 0.1,
        responseFormatJson: true,
      });

      const decision = OpenRouterService.parseJsonFromLLM<{ needsSearch: boolean; searchQuery: string }>(routerResponse);
      needsSearch = !!decision.needsSearch;
      if (decision.searchQuery) {
        searchQuery = decision.searchQuery;
      }
      console.log(`[Pipeline] Router Decision: needsSearch=${needsSearch}, searchQuery="${searchQuery}"`);
    } catch (err: any) {
      console.warn('[Pipeline] Router fallback:', err.message);
      needsSearch = query.length > 3 && !/什么是|定义|原理|如何理解/i.test(query);
    }

    // --- STEP 2: Web Search or Direct Reasoning ---
    let searchResults: TavilySearchResult | null = null;
    const finalImages: CardImage[] = [];

    // If user uploaded a photo, add it as the primary image
    if (photoUrl) {
      finalImages.push({
        url: photoUrl,
        alt: 'User uploaded photo',
        source: 'uploaded',
      });
    }

    if (needsSearch) {
      emit('status', {
        step: 'search',
        message: `正在使用 Tavily 检索全网事实与真实图文: "${searchQuery}"...`,
        stepNumber: 2,
        totalSteps: 4,
      });

      searchResults = await TavilyService.search(searchQuery, {
        apiKey: tavilyKey,
        includeImages: needImage,
        maxResults: 5,
      });

      if (searchResults.success) {
        console.log(`[Pipeline] Tavily search returned ${searchResults.facts.length} facts and ${searchResults.images.length} images`);
      } else {
        console.warn(`[Pipeline] Tavily search degraded: ${searchResults.error}`);
      }
    } else {
      emit('status', {
        step: 'reasoning',
        message: '命中通用原理与概念模型，直接进行深度知识提炼...',
        stepNumber: 2,
        totalSteps: 4,
      });
    }

    // --- STEP 3: Image Strategy (Web Images vs. AI Concept Gen) ---
    if (needImage && finalImages.length === 0) {
      // Case 1: Matching web images from Tavily
      if (searchResults && searchResults.images.length > 0) {
        for (const img of searchResults.images.slice(0, 2)) {
          finalImages.push({
            url: img.url,
            alt: img.description || query,
            source: 'web',
          });
        }
      }

      // Case 2: No web images, generate AI illustration with Gemini 3.1 Flash Lite Image
      if (finalImages.length === 0) {
        emit('status', {
          step: 'image_gen',
          message: '正在使用 Gemini 3.1 Flash Lite 生成核心概念插图并转 WebP...',
          stepNumber: 3,
          totalSteps: 4,
        });

        try {
          const promptMsg: ChatMessage[] = [
            {
              role: 'system',
              content: 'You extract 1 concise, vivid English visual prompt for generating a clean, minimalist 3D isometric or vector knowledge card illustration. No text in image. Return JSON: {"prompt": "..."}',
            },
            {
              role: 'user',
              content: `Topic: ${query}`,
            },
          ];

          const promptResp = await OpenRouterService.chatCompletion(promptMsg, {
            apiKey: openRouterKey,
            model,
            temperature: 0.5,
            responseFormatJson: true,
          });

          const { prompt } = OpenRouterService.parseJsonFromLLM<{ prompt: string }>(promptResp);
          const genImgUrl = await ImageGenService.generateAndSaveWebP(prompt || `Visual representation of ${query}`, {
            apiKey: openRouterKey,
            model: imageModel || 'google/gemini-3.1-flash-lite-image',
          });

          if (genImgUrl) {
            finalImages.push({
              url: genImgUrl,
              alt: query,
              source: 'generated',
            });
          }
        } catch (err: any) {
          console.warn('[Pipeline] Image generation skipped:', err.message);
        }
      }
    }

    // --- STEP 4: Card Synthesis (Audience Tiering & Mermaid) ---
    emit('status', {
      step: 'synthesis',
      message: '正在根据受众档位精炼 Markdown 与结构图 (Gemini 3.7 Flash)...',
      stepNumber: 4,
      totalSteps: 4,
    });

    const audiencePromptMap = {
      student: 'Target Audience: 讲给小孩 🧸 (Tone: 像讲睡前故事或哄小孩一样，极度生动好玩、充满趣味日常比喻、大白话拆解，绝对零门槛，激发好奇心)。',
      general: 'Target Audience: 说点人话 ☕ (Tone: 坚决拒绝任何装腔作势与行业黑话，讲大白话、深入浅出、逻辑严密、直击本质与核心用处，提炼金句)。',
      expert: 'Target Audience: 导师开课 🎓 (Tone: 严肃严谨的大师课/教授授课风格，专业术语、底层原理与数学/工程架构推导、深度技术边界解析)。',
    };

    const audienceInstruction = audiencePromptMap[audience] || audiencePromptMap.general;

    let factsContext = '';
    if (searchResults && searchResults.facts.length > 0) {
      factsContext = `\n[Real-time Web Search Facts]:\n${searchResults.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n`;
    }

    const synthesisMessages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are the world-class Knowledge Card Creator.
Generate an ultra-high-quality, beautifully structured knowledge card.

${audienceInstruction}
${factsContext}

LANGUAGE RULE: Output language MUST strictly match the language of user's query (e.g. if Chinese, output Simplified Chinese; if English, output English).
MARKDOWN FORMATTING RULES:
- When writing bold text, NEVER put spaces or linebreaks immediately inside the asterisks (write \`**bold text**\`, NOT \`** bold **\` or \`**bold **\`).
- When writing bullet lists, every item MUST be on its own line starting with \`- \`.

JSON Output Schema:
{
  "title": "Concise title, strictly <= 10 chars",
  "oneLiner": "A single punchy golden sentence capturing the absolute essence",
  "content": "Rich markdown formatted content with headers, bullet points, and key takeaways.",
  "diagram": "Valid Mermaid.js graph string (e.g. graph TD, sequenceDiagram, flowchart LR, mindmap). Return null if no diagram is needed. MUST be clean valid mermaid syntax without backticks.",
  "tags": ["2 to 3 tags"],
  "language": "zh-CN or en or appropriate code"
}`,
      },
      {
        role: 'user',
        content: photoUrl
          ? `User provided this query along with an image: "${query}". Analyze and create the knowledge card.`
          : `Create a knowledge card for: "${query}".`,
      },
    ];

    const synthesisResponse = await OpenRouterService.chatCompletion(synthesisMessages, {
      apiKey: openRouterKey,
      model,
      temperature: 0.3,
      responseFormatJson: true,
    });

    let cardData: any;
    try {
      cardData = OpenRouterService.parseJsonFromLLM(synthesisResponse);
    } catch (e) {
      console.warn('[Pipeline] Synthesis JSON parse fallback');
      cardData = {
        title: query.slice(0, 10),
        oneLiner: '核心本质与精炼速览',
        content: synthesisResponse,
        diagram: null,
        tags: ['知识卡片', '随手查'],
        language: 'zh-CN',
      };
    }

    // Clean diagram string if enclosed in ```mermaid ... ```
    if (cardData.diagram && typeof cardData.diagram === 'string') {
      cardData.diagram = cardData.diagram
        .replace(/^```(?:mermaid)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      if (!cardData.diagram.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|gitGraph|quadrantChart|C4Context)/i)) {
        cardData.diagram = null;
      }
    }

    // Preprocess markdown content (normalize fullwidth, bracket bolding, and whitespace)
    let rawContent = cardData.content || '';
    rawContent = rawContent
      .replace(/＊＊/g, '**')
      .replace(/～～/g, '~~')
      .replace(/｀｀｀/g, '```')
      .replace(/｀/g, '`');

    const codeParts = rawContent.split(/(```[\s\S]*?```)/g);
    rawContent = codeParts
      .map((codePart, codeIdx) => {
        if (codeIdx % 2 === 1) return codePart;

        const lines = codePart.split('\n');
        const processedLines = lines.map((line) => {
          if (!line.includes('**')) return line;

          const parts = line.split('**');
          if (parts.length % 2 === 1 && parts.length > 2) {
            for (let i = 1; i < parts.length; i += 2) {
              let inner = parts[i];

              const bracketMatch = inner.match(/^([「“《（【(‘'"])([\s\S]+?)([」”》）】)’'"])$/);
              if (bracketMatch) {
                parts[i - 1] += bracketMatch[1];
                parts[i + 1] = bracketMatch[3] + parts[i + 1];
                inner = bracketMatch[2];
              }

              inner = inner.trim();

              if (parts[i - 1] && /[^\s|>`#*_\-\d[(]/.test(parts[i - 1].slice(-1))) {
                parts[i - 1] += ' ';
              }
              if (parts[i + 1] && /[^\s|>`#*_\-\d)\]]/.test(parts[i + 1].slice(0, 1))) {
                parts[i + 1] = ' ' + parts[i + 1];
              }

              parts[i] = inner;
            }

            return parts.join('**');
          }

          return line;
        });

        return processedLines.join('\n');
      })
      .join('');

    const cardId = `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newCard = CardDB.create({
      id: cardId,
      title: (cardData.title || query).slice(0, 20),
      oneLiner: cardData.oneLiner || '',
      audience,
      content: rawContent,
      diagram: cardData.diagram || null,
      images: finalImages,
      tags: Array.isArray(cardData.tags) ? cardData.tags : ['知识卡片'],
      language: cardData.language || 'zh-CN',
      query,
    });

    emit('card', newCard);
    emit('complete', { cardId, success: true });

    return newCard;
  }

  /**
   * Follow-up Q&A scoped to a single card context
   */
  public static async answerFollowUp(params: {
    card: CardRecord;
    question: string;
    openRouterKey?: string;
    model?: string;
  }): Promise<string> {
    const { card, question, openRouterKey, model } = params;

    const previousMessages = CardDB.getMessages(card.id);

    const systemPrompt = `You are a helpful knowledge expert. The user is asking a follow-up question regarding a specific knowledge card they generated.
Card Context:
- Title: ${card.title}
- Audience Tier: ${card.audience}
- Essence: ${card.oneLiner}
- Card Content: ${card.content}

Answer concisely, directly, and maintain the same audience tone (${card.audience}). Use markdown.`;

    const chatHistory: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...previousMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: question },
    ];

    const answer = await OpenRouterService.chatCompletion(chatHistory, {
      apiKey: openRouterKey,
      model,
      temperature: 0.4,
    });

    // Save to DB
    CardDB.addMessage(card.id, 'user', question);
    CardDB.addMessage(card.id, 'assistant', answer);

    return answer;
  }
}
