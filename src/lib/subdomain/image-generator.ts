// src/lib/subdomain/image-generator.ts
// Generiert SEO/GEO-optimierte Erklärbilder via Gemini Nano Banana

import { writeFile, mkdir } from "fs/promises";
import path from "path";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

interface ImageResult {
  filename: string;
  alt: string;
  caption: string;
  path: string;
}

export async function generateArticleImage(
  articleSlug: string,
  siteSlug: string,
  title: string,
  keywords: string[],
  contentType: string,
): Promise<ImageResult | null> {
  if (!GEMINI_API_KEY) {
    console.log("[IMAGE-GEN] No GEMINI_API_KEY set, skipping image generation");
    return null;
  }

  const prompt = buildImagePrompt(title, keywords, contentType, siteSlug);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!response.ok) {
      console.error("[IMAGE-GEN] API error:", response.status);
      return null;
    }

    const data = await response.json();
    const candidates = data?.candidates?.[0]?.content?.parts || [];

    for (const part of candidates) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const filename = `${siteSlug}-${articleSlug}.png`;
        const dir = path.join(process.cwd(), "public", "subdomain-images");
        await mkdir(dir, { recursive: true });
        const filePath = path.join(dir, filename);

        const buffer = Buffer.from(part.inlineData.data, "base64");
        await writeFile(filePath, buffer);

        // SEO-optimierte Alt-Text und Caption
        const alt = buildAltText(title, keywords);
        const caption = buildCaption(title, contentType);

        console.log("[IMAGE-GEN] Generated:", filename);
        return {
          filename,
          alt,
          caption,
          path: `/subdomain-images/${filename}`,
        };
      }
    }

    console.log("[IMAGE-GEN] No image in response");
    return null;
  } catch (err) {
    console.error("[IMAGE-GEN] Error:", err instanceof Error ? err.message : err);
    return null;
  }
}

function buildImagePrompt(title: string, keywords: string[], contentType: string, siteSlug: string): string {
  const typeMap: Record<string, string> = {
    news: "a professional financial news infographic with market data, charts, and key indicators",
    strategy: "a step-by-step strategy diagram showing trading methodology with clear flow arrows",
    guide: "an educational infographic explaining key concepts with icons, labels, and visual hierarchy",
    faq: "a visual FAQ overview with question-answer pairs in a clean grid layout",
    comparison: "a side-by-side comparison table/infographic with clear metrics and checkmarks",
  };

  const style = typeMap[contentType] || typeMap.guide;

  return `Create ${style}.
Topic: ${title}
Keywords: ${keywords.slice(0, 5).join(", ")}

DESIGN REQUIREMENTS:
- Dark background (#0a0806 to #131316)
- Gold (#d4a537) accent color for headers, borders, and highlights
- Green (#22c55e) for positive values/advantages
- Red (#ef4444) for negative values/risks
- White (#fafafa) for main text
- Gray (#a1a1aa) for secondary text
- Professional financial/trading aesthetic
- Clean vector/flat design, NO stock photos
- Monospace font style for numbers and metrics
- Include relevant icons or simplified chart elements
- High contrast, easy to read
- 16:9 aspect ratio preferred
- NO watermarks or logos
- Text must be accurate and readable`;
}

function buildAltText(title: string, keywords: string[]): string {
  // SEO-optimierter Alt-Text: beschreibend + Keyword
  const mainKeyword = keywords[0] || "";
  return `Infografik: ${title}${mainKeyword ? ` — ${mainKeyword}` : ""} | Gold Foundry`;
}

function buildCaption(title: string, contentType: string): string {
  const typeLabel: Record<string, string> = {
    news: "Marktanalyse",
    strategy: "Strategie-Übersicht",
    guide: "Erklärung",
    faq: "FAQ-Übersicht",
    comparison: "Vergleich",
  };
  return `${typeLabel[contentType] || "Infografik"}: ${title} — Quelle: Gold Foundry proprietäre Analyse`;
}

export function buildImageHtml(image: ImageResult): string {
  return `
<figure style="margin: 32px 0; text-align: center;" itemscope itemtype="https://schema.org/ImageObject">
  <img
    src="${image.path}"
    alt="${image.alt}"
    title="${image.alt}"
    loading="lazy"
    decoding="async"
    style="width: 100%; max-width: 720px; border-radius: 16px; border: 1px solid rgba(212,165,55,0.12); margin: 0 auto; display: block;"
    itemprop="contentUrl"
  />
  <figcaption
    style="margin-top: 12px; font-size: 12px; color: #52525b; font-style: italic; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.5;"
    itemprop="caption"
  >
    ${image.caption}
  </figcaption>
  <meta itemprop="name" content="${image.alt}" />
</figure>`;
}
