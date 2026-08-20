import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import dotenv from 'dotenv';
dotenv.config();

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const GEN_DIR = path.join(UPLOAD_DIR, 'generated');

if (!fs.existsSync(GEN_DIR)) {
  fs.mkdirSync(GEN_DIR, { recursive: true });
}

export class ImageGenService {
  private static defaultImageModel = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-3.1-flash-lite-image';

  /**
   * Generate an image from prompt and save as optimized WebP
   * Uses Gemini 3.1 Flash Lite Image with strict timeout and no placeholder degradation
   */
  public static async generateAndSaveWebP(
    prompt: string,
    options?: {
      apiKey?: string;
      model?: string;
      timeoutMs?: number;
    }
  ): Promise<string | null> {
    const apiKey = (options?.apiKey || process.env.OPENROUTER_API_KEY || '').trim();
    const model = options?.model || process.env.OPENROUTER_IMAGE_MODEL || this.defaultImageModel;
    const timeoutMs = options?.timeoutMs || 20000; // 20s hard timeout to prevent hanging

    if (!apiKey) {
      console.warn('[ImageGen] No OpenRouter API key provided. Skipping image generation.');
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[ImageGen] Generating image using model "${model}" with prompt: "${prompt.slice(0, 80)}..."`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://snapcard.local',
          'X-Title': 'SnapCard Knowledge Assistant',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: `Generate a clean, high quality minimalist concept illustration: ${prompt}. Professional 3D isometric or flat vector art style, vivid colors, no text inside image.`,
            },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[ImageGen OpenRouter Error ${response.status}]:`, errText);
        return null;
      }

      const data = (await response.json()) as any;
      let imageBuffer: Buffer | null = null;
      const message = data.choices?.[0]?.message;

      // Extract base64 image from OpenRouter choices[0].message.images array
      if (Array.isArray(message?.images) && message.images.length > 0) {
        const imgObj = message.images[0];
        const urlStr = imgObj?.image_url?.url || imgObj?.url;
        if (typeof urlStr === 'string') {
          if (urlStr.startsWith('data:image/')) {
            const base64Data = urlStr.split(';base64,').pop();
            if (base64Data) {
              imageBuffer = Buffer.from(base64Data, 'base64');
            }
          } else if (urlStr.startsWith('http')) {
            const imgRes = await fetch(urlStr);
            const arrayBuffer = await imgRes.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
          }
        }
      }

      // Check inline content
      if (!imageBuffer && typeof message?.content === 'string') {
        const match = message.content.match(/data:image\/[a-zA-Z]+;base64,([^\s"'\)]+)/);
        if (match && match[1]) {
          imageBuffer = Buffer.from(match[1], 'base64');
        }
      }

      if (!imageBuffer) {
        console.warn('[ImageGen] No image payload returned in model output.');
        return null;
      }

      // Convert buffer to WebP via Sharp
      const filename = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;
      const filePath = path.join(GEN_DIR, filename);

      await sharp(imageBuffer)
        .resize(512, 512, { fit: 'cover', position: 'center' })
        .webp({ quality: 85, effort: 4 })
        .toFile(filePath);

      console.log(`[ImageGen] Successfully saved WebP: ${filePath}`);
      return `/uploads/generated/${filename}`;
    } catch (err: any) {
      clearTimeout(timer);
      console.warn('[ImageGen Failed]:', err.name === 'AbortError' ? 'Image generation timed out' : err.message);
      return null;
    }
  }
}
