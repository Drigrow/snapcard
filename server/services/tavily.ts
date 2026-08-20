import dotenv from 'dotenv';
dotenv.config();

export interface TavilyImage {
  url: string;
  description?: string;
}

export interface TavilySearchResult {
  query: string;
  facts: string[];
  images: TavilyImage[];
  sources: Array<{ title: string; url: string; content: string }>;
  success: boolean;
  error?: string;
}

export class TavilyService {
  public static getApiKey(customKey?: string): string {
    return (customKey || process.env.TAVILY_API_KEY || '').trim();
  }

  /**
   * Search Tavily with facts and images
   */
  public static async search(
    query: string,
    options?: {
      apiKey?: string;
      maxResults?: number;
      includeImages?: boolean;
      timeoutMs?: number;
    }
  ): Promise<TavilySearchResult> {
    const apiKey = this.getApiKey(options?.apiKey);
    const maxResults = options?.maxResults ?? 5;
    const includeImages = options?.includeImages ?? true;
    const timeoutMs = options?.timeoutMs ?? 6000;

    if (!apiKey) {
      console.warn('[Tavily] No Tavily API key provided. Skipping live web search.');
      return {
        query,
        facts: [],
        images: [],
        sources: [],
        success: false,
        error: 'No Tavily API key configured',
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'basic',
          include_images: includeImages,
          include_answer: true,
          max_results: maxResults,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Tavily Search API Error ${response.status}]:`, errorText);
        return {
          query,
          facts: [],
          images: [],
          sources: [],
          success: false,
          error: `Tavily returned status ${response.status}`,
        };
      }

      const data = (await response.json()) as any;

      const facts: string[] = [];
      if (data.answer) {
        facts.push(data.answer);
      }

      const sources = (data.results || []).map((r: any) => {
        if (r.content) facts.push(r.content);
        return {
          title: r.title || '',
          url: r.url || '',
          content: r.content || '',
        };
      });

      // Process Tavily images
      const images: TavilyImage[] = [];
      if (Array.isArray(data.images)) {
        for (const img of data.images) {
          if (typeof img === 'string' && img.startsWith('http')) {
            images.push({ url: img });
          } else if (img && typeof img === 'object' && img.url) {
            images.push({ url: img.url, description: img.description });
          }
        }
      }

      return {
        query,
        facts: facts.slice(0, 8),
        images: images.slice(0, 4),
        sources,
        success: true,
      };
    } catch (err: any) {
      clearTimeout(timer);
      console.warn('[Tavily Search Error or Timeout]:', err.name === 'AbortError' ? 'Search timed out' : err.message);
      return {
        query,
        facts: [],
        images: [],
        sources: [],
        success: false,
        error: err.message,
      };
    }
  }
}
