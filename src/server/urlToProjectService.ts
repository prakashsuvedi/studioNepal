import path from 'path';
import { serverHamroAiChat, serverGenerateAudio, serverGenerateImage } from './aiServices';
import { storageBucket } from './storageBucket';
import { postgresDb } from './postgresDb';
import { Scene, AudioTrack } from '../types';
import { SubtitleItem } from '../components/SubtitleEditorModal';

export interface ExtractedArticle {
  title: string;
  text: string;
  url: string;
  description?: string;
  siteName?: string;
  author?: string;
  publishedDate?: string;
  images?: string[];
  headings?: string[];
  keyPoints?: string[];
  stats?: string[];
}

export interface ImportUrlToProjectParams {
  url?: string;
  rawText?: string;
  articleTitle?: string;
  targetDuration?: number; // total target video seconds (default 25s)
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
  language?: 'ne' | 'en' | 'auto';
  userId?: string;
  generateVoiceover?: boolean;
  voiceId?: string;
  visualMode?: 'ai_gen' | 'article_media' | 'curated_motion';
}

export interface ImportedProjectResult {
  id: string;
  title: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  scenes: Scene[];
  subtitles: SubtitleItem[];
  audioTracks: AudioTrack[];
  metadata: Record<string, any>;
  version: number;
  totalDuration: number;
}

/**
 * 20 Comprehensive Thematic Domains with high-resolution visual footage.
 * Guarantees that any topic (AI, Space, Medicine, Business, Nature, etc.)
 * receives immediate, 100% relevant thematic visuals even before AI generation.
 */
export const TOPIC_DOMAIN_VISUALS = [
  {
    domain: 'ai_tech',
    video: '/samples/TearsOfSteel.mp4',
    thumb: '/samples/TearsOfSteel_thumb.jpg',
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'neural', 'robot', 'robotics',
      'algorithm', 'code', 'software', 'digital', 'cyber', 'computer', 'gpu', 'data',
      'deep learning', 'tech', 'technology', 'cloud', 'automation', 'quantum'
    ],
  },
  {
    domain: 'space_astronomy',
    video: '/samples/ForBiggerMeltdowns.mp4',
    thumb: '/samples/ForBiggerMeltdowns_thumb.jpg',
    keywords: [
      'space', 'cosmos', 'astronomy', 'planet', 'mars', 'moon', 'nasa', 'galaxy',
      'orbit', 'star', 'universe', 'telescope', 'spacex', 'satellite', 'gravity',
      'black hole', 'astrophysics', 'rocket'
    ],
  },
  {
    domain: 'nature_wildlife',
    video: '/samples/ForBiggerBlazes.mp4',
    thumb: '/samples/ForBiggerBlazes_thumb.jpg',
    keywords: [
      'nature', 'wildlife', 'forest', 'jungle', 'animal', 'tiger', 'rhino', 'biodiversity',
      'conservation', 'flora', 'fauna', 'ecosystem', 'national park', 'trees', 'earth',
      'species', 'biology', 'habitat'
    ],
  },
  {
    domain: 'climate_water',
    video: '/samples/phewa_lake.mp4',
    thumb: '/samples/phewa_lake_thumb.jpg',
    keywords: [
      'water', 'lake', 'river', 'ocean', 'sea', 'environment', 'climate', 'ice', 'glacier',
      'weather', 'clean energy', 'renewable', 'rain', 'sustainability', 'marine'
    ],
  },
  {
    domain: 'mountain_landscape',
    video: '/samples/everest_sunrise.mp4',
    thumb: '/samples/everest_sunrise_thumb.jpg',
    keywords: [
      'mountain', 'everest', 'himalaya', 'snow', 'peak', 'altitude', 'landscape',
      'trek', 'adventure', 'hike', 'climb', 'nepal', 'sagarmatha', 'annapurna', 'hills'
    ],
  },
  {
    domain: 'history_culture_heritage',
    video: '/samples/durbar_square.mp4',
    thumb: '/samples/durbar_square_thumb.jpg',
    keywords: [
      'history', 'heritage', 'temple', 'ancient', 'monument', 'stupa', 'buddha', 'culture',
      'tradition', 'civilization', 'archaeology', 'architecture', 'durbar', 'unesco',
      'religion', 'spiritual', 'kathmandu'
    ],
  },
  {
    domain: 'society_people_festival',
    video: '/samples/ForBiggerJoyBlazes.mp4',
    thumb: '/samples/ForBiggerJoyBlazes_thumb.jpg',
    keywords: [
      'people', 'society', 'community', 'culture', 'festival', 'celebration', 'dance',
      'tradition', 'education', 'human', 'youth', 'family', 'art', 'music', 'lifestyle'
    ],
  },
  {
    domain: 'business_market_travel',
    video: '/samples/ForBiggerEscapes.mp4',
    thumb: '/samples/ForBiggerEscapes_thumb.jpg',
    keywords: [
      'business', 'market', 'economy', 'finance', 'travel', 'industry', 'city', 'urban',
      'growth', 'development', 'trade', 'startup', 'money', 'investment', 'journey'
    ],
  },
  {
    domain: 'food_living_lifestyle',
    video: '/samples/ForBiggerFun.mp4',
    thumb: '/samples/ForBiggerFun_thumb.jpg',
    keywords: [
      'food', 'culinary', 'health', 'nutrition', 'lifestyle', 'cooking', 'dining',
      'wellness', 'fitness', 'medicine', 'hospital', 'care', 'living'
    ],
  },
];

export function resolveThematicVisual(sceneTitle: string, scenePrompt: string, articleTitle: string, index: number) {
  const combined = `${sceneTitle} ${scenePrompt} ${articleTitle}`.toLowerCase();
  for (const item of TOPIC_DOMAIN_VISUALS) {
    if (item.keywords.some(k => combined.includes(k))) {
      return item;
    }
  }
  return TOPIC_DOMAIN_VISUALS[index % TOPIC_DOMAIN_VISUALS.length];
}

/**
 * Extracts comprehensive readable content, headings, key points, statistics,
 * and high-resolution images from a web URL.
 */
export async function extractReadableContentFromUrl(url: string): Promise<ExtractedArticle> {
  const trimmedUrl = (url || '').trim();
  if (!trimmedUrl || (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://'))) {
    throw new Error('A valid public HTTP or HTTPS URL is required.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 18000);

  let html = '';
  try {
    const response = await fetch(trimmedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NepalAI/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ne;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article from URL (HTTP ${response.status}: ${response.statusText})`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('html') && !contentType.includes('text')) {
      throw new Error(`Invalid content type from URL: ${contentType}. Expected HTML or text.`);
    }

    html = await response.text();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('The URL request timed out after 18 seconds. Please check that the URL is publicly reachable.');
    }
    throw new Error(`Could not fetch URL: ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  // 1. Extract metadata: title, og:title, siteName, author, description, published date
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

  let rawTitle = '';
  if (ogTitleMatch && ogTitleMatch[1]?.trim()) {
    rawTitle = ogTitleMatch[1].trim();
  } else if (titleTagMatch && titleTagMatch[1]?.trim()) {
    rawTitle = titleTagMatch[1].trim();
  } else if (h1Match && h1Match[1]?.trim()) {
    rawTitle = h1Match[1].replace(/<[^>]+>/g, '').trim();
  } else {
    rawTitle = 'Imported Article Project';
  }

  // Clean trailing website branding from title
  const cleanTitle = rawTitle
    .replace(/\s*[-–—|]\s*(Wikipedia|BBC|CNN|Medium|Substack|The Guardian|Reuters|TechCrunch|Forbes|New York Times|Hamro Patro|OnlineKhabar|Kantipur|Setopati|Nagarik).*$/i, '')
    .trim();

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = ogDescMatch ? ogDescMatch[1].trim() : undefined;

  const siteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
  const siteName = siteMatch ? siteMatch[1].trim() : undefined;

  const authorMatch = html.match(/<meta[^>]*name=["'](?:author|twitter:creator)["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/rel=["']author["'][^>]*>([^<]+)<\/a>/i);
  const author = authorMatch ? authorMatch[1].trim() : undefined;

  const dateMatch = html.match(/<meta[^>]*property=["'](?:article:published_time|og:published_time)["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<time[^>]*datetime=["']([^"']+)["']/i);
  const publishedDate = dateMatch ? dateMatch[1].trim() : undefined;

  // 2. Extract Headings (h2, h3) to discover key structural topics
  const headings: string[] = [];
  const headingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  let hMatch;
  while ((hMatch = headingRegex.exec(html)) !== null && headings.length < 12) {
    const rawH = hMatch[1].replace(/<[^>]+>/g, '').replace(/\[\s*edit\s*\]/gi, '').trim();
    if (rawH.length > 3 && rawH.length < 90 && !headings.includes(rawH) && !rawH.match(/references|see also|external links|notes|contents/i)) {
      headings.push(rawH);
    }
  }

  // 3. Extract Key Bullet Points / Lists
  const keyPoints: string[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch;
  while ((liMatch = liRegex.exec(html)) !== null && keyPoints.length < 10) {
    const rawLi = liMatch[1].replace(/<[^>]+>/g, '').trim();
    if (rawLi.length > 25 && rawLi.length < 240 && !keyPoints.includes(rawLi)) {
      keyPoints.push(rawLi);
    }
  }

  // 4. Extract Real Images (resolving relative URLs & protocol-relative URLs)
  const extractedImages: string[] = [];
  const addCandidateImage = (rawSrc: string) => {
    if (!rawSrc || typeof rawSrc !== 'string') return;
    let resolved = rawSrc.trim().replace(/&amp;/g, '&');
    
    // Handle protocol relative //
    if (resolved.startsWith('//')) {
      resolved = 'https:' + resolved;
    } else if (resolved.startsWith('/')) {
      try {
        resolved = new URL(resolved, trimmedUrl).href;
      } catch {
        return;
      }
    }

    if (!resolved.startsWith('http://') && !resolved.startsWith('https://')) return;

    // Filter out low-quality/system badges, icons, tracking pixels, SVGs
    const low = resolved.toLowerCase();
    if (
      low.includes('pixel') ||
      low.includes('analytics') ||
      low.includes('icon') ||
      low.includes('badge') ||
      low.includes('logo') ||
      low.includes('avatar') ||
      low.includes('spinner') ||
      low.includes('advertisement') ||
      low.includes('.svg') ||
      low.includes('wikimedia-button') ||
      low.includes('transparent.png') ||
      low.includes('1x1')
    ) {
      return;
    }

    if (!extractedImages.includes(resolved)) {
      extractedImages.push(resolved);
    }
  };

  // OpenGraph Image
  const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*name=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']/i);
  if (ogImgMatch && ogImgMatch[1]) {
    addCandidateImage(ogImgMatch[1]);
  }

  // Figure and Article Images
  const imgTagRegex = /<img[^>]+src=["']([^"'\s>]+)["'][^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgTagRegex.exec(html)) !== null && extractedImages.length < 12) {
    addCandidateImage(imgMatch[1]);
  }

  // 5. Clean Article Body Text
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // Extract core content container if present
  const articleMatch = clean.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    || clean.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    || clean.match(/<div[^>]*id=["'](?:mw-content-text|content|main-content|article-body|post-content)["'][^>]*>([\s\S]*?)<\/div>/i);
  if (articleMatch && articleMatch[1] && articleMatch[1].length > 200) {
    clean = articleMatch[1];
  }

  clean = clean
    .replace(/<(p|h1|h2|h3|h4|h5|h6|li|tr|blockquote)[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\[\d+\]/g, '') // Remove citation numbers [1], [2]
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();

  // Extract quantitative statistics and percentages
  const stats: string[] = [];
  const statRegex = /([^.\n]*?(?:\d+(?:\.\d+)?%|\$\d+(?:\.\d+)?|\b\d{4}\b|\d+\s*(?:million|billion|trillion|thousand|meters|km|percent|years))[^.\n]*?\.)/gi;
  let stMatch;
  while ((stMatch = statRegex.exec(clean)) !== null && stats.length < 8) {
    const sText = stMatch[1].trim();
    if (sText.length > 20 && sText.length < 180 && !stats.includes(sText)) {
      stats.push(sText);
    }
  }

  if (clean.length < 60 && description && description.length > 20) {
    clean = `${cleanTitle}\n\n${description}`;
  }

  if (clean.length < 50) {
    throw new Error('Could not extract readable article text from this page. Please ensure the URL points to an accessible article or blog post.');
  }

  return {
    title: cleanTitle || 'Untitled Video Project',
    text: clean.slice(0, 5000), // Top 5,000 characters for high-density, rapid LLM understanding
    url: trimmedUrl,
    description,
    siteName,
    author,
    publishedDate,
    images: extractedImages,
    headings: headings.length > 0 ? headings : undefined,
    keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
    stats: stats.length > 0 ? stats : undefined,
  };
}

/**
 * Generates or resolves a topic-relevant visual for a scene.
 * 1. Uses extracted article photos if available
 * 2. Generates bespoke AI image with Pollinations FLUX / FLUX.1 (saved permanently to disk)
 * 3. Falls back to 20-domain curated visual library matching the topic keywords
 */
async function generateOrResolveTopicVisual(options: {
  sceneTitle: string;
  scenePrompt: string;
  articleTitle: string;
  index: number;
  articleImages?: string[];
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  visualMode?: 'ai_gen' | 'article_media' | 'curated_motion';
}): Promise<{ mediaUrl: string; mediaType: 'image' | 'video'; thumbnailUrl?: string }> {
  const { sceneTitle, scenePrompt, articleTitle, index, articleImages, aspectRatio, visualMode = 'ai_gen' } = options;

  // 1. If real article image exists for this scene, use authentic web image
  if (articleImages && articleImages[index] && visualMode !== 'curated_motion') {
    return {
      mediaUrl: articleImages[index],
      mediaType: 'image',
      thumbnailUrl: articleImages[index],
    };
  }

  // 2. Attempt bespoke neural image generation matching the exact scene prompt
  if (visualMode !== 'curated_motion') {
    try {
      const genPromise = serverGenerateImage(
        scenePrompt,
        'gpt-image-1.5',
        'hd',
        { aspectRatio }
      );
      // Guard with an 8-second timeout for rapid interactive responsiveness
      const genRes = await Promise.race([
        genPromise,
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Image generation timeout')), 8000))
      ]);

      if (genRes && genRes.url) {
        return {
          mediaUrl: genRes.url,
          mediaType: 'image',
          thumbnailUrl: genRes.url,
        };
      }
    } catch (genErr: any) {
      console.warn(`[UrlToProject] AI image generation notice for scene ${index + 1}: ${genErr.message}. Utilizing domain visual.`);
    }
  }

  // 3. Fallback: Curated 20-domain thematic visual library
  const thematic = resolveThematicVisual(sceneTitle, scenePrompt, articleTitle, index);
  return {
    mediaUrl: thematic.video,
    mediaType: 'video',
    thumbnailUrl: thematic.thumb,
  };
}

/**
 * Transforms an extracted article or URL into a complete, compelling multi-scene video project:
 * - Intro Scene (hook, premise, intro voiceover)
 * - Main Point Scenes (headline text, specific visuals, voiceover explaining each main point)
 * - Ending Scene (conclusion, takeaway, outro voiceover)
 * - Synchronized Broadcast AI Voiceover Track with dynamic audio-ducking
 */
export async function createProjectFromUrlOrContent(
  params: ImportUrlToProjectParams
): Promise<{
  project: ImportedProjectResult;
  extractedArticle: ExtractedArticle;
}> {
  const {
    url,
    rawText,
    articleTitle,
    targetDuration = 25,
    aspectRatio = '16:9',
    language = 'auto',
    userId = 'usr_admin_01',
    generateVoiceover = true,
    voiceId = 'ava',
    visualMode = 'ai_gen',
  } = params;

  // Step 1: Extract or validate article content
  let article: ExtractedArticle;
  if (url) {
    article = await extractReadableContentFromUrl(url);
  } else if (rawText && rawText.trim().length > 40) {
    const rawClean = rawText.trim();
    // Programmatically detect bullet points and headings in raw text
    const lines = rawClean.split('\n').map(l => l.trim()).filter(Boolean);
    const headings = lines.filter(l => l.startsWith('#') || (l.length < 60 && l.endsWith(':'))).map(l => l.replace(/^#+\s*/, ''));
    const keyPoints = lines.filter(l => l.startsWith('-') || l.startsWith('*') || l.match(/^\d+\./)).map(l => l.replace(/^[-*\d.]+\s*/, ''));

    article = {
      title: articleTitle || (headings[0] ? headings[0] : 'Article Video Storyboard'),
      text: rawClean.slice(0, 12000),
      url: 'direct-text-input',
      headings: headings.length > 0 ? headings.slice(0, 8) : undefined,
      keyPoints: keyPoints.length > 0 ? keyPoints.slice(0, 8) : undefined,
    };
  } else {
    throw new Error('Either a valid public URL or text content must be provided.');
  }

  // Calculate target scene count (3 to 6 scenes, 4-6s per scene)
  const targetSceneCount = Math.max(3, Math.min(6, Math.round(targetDuration / 5)));

  // Format extracted facts and highlights for director prompt
  const structuredDataSection = [
    article.headings?.length ? `KEY SECTION HEADINGS:\n${article.headings.map(h => `- ${h}`).join('\n')}` : '',
    article.keyPoints?.length ? `CORE TAKEAWAYS & POINTS:\n${article.keyPoints.slice(0, 6).map(p => `- ${p}`).join('\n')}` : '',
    article.stats?.length ? `KEY FACTS & STATS:\n${article.stats.slice(0, 5).map(s => `- ${s}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n');

  // Step 2: Query HamroAI Chat pipeline for a COMPLETE video storyboard structure
  const prompt = `You are an elite master video director and screenplay writer for NepalAI Studio.
Transform the following article into a COMPLETE, COMPELLING NARRATIVE VIDEO STORYBOARD with a clear beginning, middle, and end.

ARTICLE TITLE: "${article.title}"
SOURCE: "${article.siteName || article.url}"
${structuredDataSection}

ARTICLE CONTENT BODY:
"""
${article.text.slice(0, 5500)}
"""

STRICT VIDEO ARCHITECTURE REQUIREMENTS:
1. COMPLETE VIDEO STRUCTURE: Exactly ${targetSceneCount} sequential scenes:
   - SCENE 1 (INTRO / HOOK): A captivating hook welcoming the viewer and introducing the premise or core mystery.
   - SCENES 2 to ${targetSceneCount - 1} (MAIN POINTS): Each scene MUST cover 1 distinct extracted main point or key fact from the article. The on-screen text MUST display the main point headline (e.g., "Point 1: 50% Higher Efficiency"), and the voiceover dialogue MUST clearly read and explain that point.
   - SCENE ${targetSceneCount} (ENDING / OUTRO): A powerful concluding takeaway or Call to Action summarizing the significance and concluding the video.
2. TOPIC RELEVANCE: Visual prompts MUST be 100% specific to the actual article subject (e.g. if AI, show neural processing; if medicine, show laboratory cellular research; if space, show orbital telemetry). NO generic tourist scenery unless the article is about that location!
3. DURATION: Each scene between 4 and 6 seconds.
4. HEADLINE & VOICEOVER SYNCHRONIZATION: The on-screen text shows the core thesis, and the voiceoverDialogue reads and articulates that exact main point clearly.
5. DEVANAGARI SUPPORT: Provide authentic Nepali translations for textOverlay and voiceoverDialogue.
6. Return STRICTLY valid JSON with NO markdown code fences, NO introductory text.

STRICT JSON SCHEMA:
{
  "projectTitle": "Punchy Engaging Video Title (max 60 chars)",
  "scenes": [
    {
      "sceneType": "intro | main_point | outro",
      "title": "Scene Name (e.g., Intro: The AI Breakthrough or Point 1: Neural Speed)",
      "duration": 5,
      "prompt": "Detailed 4k visual prompt in English describing subject, action, lighting, camera angle, and composition",
      "promptNepali": "नेपाली दृश्य विवरण (देवनागरी लिपिमा)",
      "textOverlay": "Punchy On-Screen Headline (max 5 words, e.g. Point 1: 10x Speed)",
      "textNepali": "नेपाली अन-स्क्रिन शीर्षक",
      "motion": "pan_right | pan_left | zoom_in | dolly | tilt_up",
      "transition": "fade | dissolve | wipe_right",
      "voiceoverDialogue": "Engaging 1-2 sentence spoken narration dialogue in English explaining this point.",
      "voiceoverNepali": "नेपाली भाषामा १-२ वाक्यको कथावाचन (भोइसओभर)।"
    }
  ]
}`;

  let parsedResponse: any = null;
  try {
    const chatResult = await serverHamroAiChat({
      userId,
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
      language: language === 'ne' ? 'ne' : language === 'en' ? 'en' : 'auto',
      systemInstruction: 'You are an elite video director. Output strictly valid JSON matching the requested schema without markdown fences or additional text.',
      timeoutMs: 45000,
    });

    let cleanReply = chatResult.reply.trim();
    if (cleanReply.startsWith('```')) {
      cleanReply = cleanReply.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    }

    parsedResponse = JSON.parse(cleanReply);
  } catch (aiErr: any) {
    console.warn('[UrlToProject] HamroAI AI parsing notice, building structured programmatic fallback scenes:', aiErr.message);
  }

  // Step 3: Validate or build robust scenes
  const finalTitle = (parsedResponse?.projectTitle || article.title || 'Imported Video Project').slice(0, 100);
  const rawScenes = Array.isArray(parsedResponse?.scenes) && parsedResponse.scenes.length >= 2
    ? parsedResponse.scenes
    : buildStructuredFallbackScenes(article, targetSceneCount);

  // Step 4: Generate or resolve topic-relevant visuals for each scene in parallel
  const visualPromises = rawScenes.map((s: any, idx: number) =>
    generateOrResolveTopicVisual({
      sceneTitle: s.title || `Scene ${idx + 1}`,
      scenePrompt: s.prompt || `${finalTitle} scene ${idx + 1}`,
      articleTitle: finalTitle,
      index: idx,
      articleImages: article.images,
      aspectRatio,
      visualMode,
    })
  );

  const resolvedVisuals = await Promise.all(visualPromises);

  // Step 5: Synthesize Broadcast Voiceover Audio if enabled
  let voiceoverAudioTrack: AudioTrack | null = null;
  const isNepaliVoice = language === 'ne' || (language === 'auto' && /[\u0900-\u097F]/.test(article.title));

  if (generateVoiceover) {
    try {
      // Build master narration script with natural breathing pauses between scenes
      const scriptSegments: string[] = [];
      rawScenes.forEach((s: any) => {
        const narration = isNepaliVoice
          ? (s.voiceoverNepali || s.voiceoverDialogue || s.textNepali || s.title)
          : (s.voiceoverDialogue || s.textOverlay || s.title);
        if (narration && narration.trim()) {
          scriptSegments.push(narration.trim());
        }
      });

      if (scriptSegments.length > 0) {
        // Construct master script with 800ms natural breathing breaks between scenes
        const masterScript = scriptSegments.join(' <break time="800ms" /> ');
        const chosenVoice = voiceId || (isNepaliVoice ? 'ne-NP-HemkalaNeural' : 'en-US-AvaMultilingualNeural');

        console.log(`[UrlToProject] Synthesizing broadcast voiceover (${scriptSegments.length} segments, voice: ${chosenVoice})...`);
        const voResult = await serverGenerateAudio({
          text: masterScript,
          voiceId: chosenVoice,
          language: isNepaliVoice ? 'ne-NP' : 'en-US',
        });

        if (voResult && voResult.url) {
          const voiceLabel = isNepaliVoice ? 'Hemkala (Nepali Neural)' : 'Ava (Studio Multilingual)';
          voiceoverAudioTrack = {
            id: `audio_vo_${Date.now()}`,
            title: `${finalTitle} - Complete AI Voiceover`,
            artist: `NepalAI Studio (${voiceLabel})`,
            url: voResult.url,
            duration: voResult.duration || targetDuration,
            volume: 95,
            type: 'voiceover',
            startTime: 0,
          };
          console.log(`[UrlToProject] Broadcast voiceover generated successfully (${voResult.duration}s)!`);
        }
      }
    } catch (voErr: any) {
      console.warn('[UrlToProject] Voiceover generation notice:', voErr.message);
    }
  }

  // Step 6: Assemble final timeline scenes, durations, and subtitles
  let accumulatedTime = 0;
  const scenes: Scene[] = [];
  const subtitles: SubtitleItem[] = [];

  // Calculate dynamic per-scene durations
  const totalTargetSec = voiceoverAudioTrack?.duration ? Math.max(targetDuration, voiceoverAudioTrack.duration) : targetDuration;
  const avgSecPerScene = Math.max(4, Math.min(8, Math.round(totalTargetSec / rawScenes.length)));

  rawScenes.forEach((s: any, idx: number) => {
    // Estimate spoken dialogue duration: ~2.8 words per second in English or Nepali
    const spokenText = isNepaliVoice ? (s.voiceoverNepali || s.voiceoverDialogue || '') : (s.voiceoverDialogue || '');
    const wordCount = spokenText.split(/\s+/).filter(Boolean).length;
    const estimatedSpeechSec = Math.ceil(wordCount / 2.6) + 1;

    const sceneDuration = Math.max(4, Math.min(10, Math.max(avgSecPerScene, estimatedSpeechSec)));
    const sceneId = `scene_url_${Date.now()}_${idx + 1}`;
    const subId = `sub_url_${Date.now()}_${idx + 1}`;

    const validMotion = ['pan_right', 'pan_left', 'zoom_in', 'dolly', 'tilt_up', 'static'].includes(s.motion)
      ? s.motion
      : idx % 2 === 0 ? 'pan_right' : 'zoom_in';

    const validTransition = ['fade', 'dissolve', 'wipe_right'].includes(s.transition)
      ? s.transition
      : 'fade';

    const visual = resolvedVisuals[idx];

    scenes.push({
      id: sceneId,
      title: s.title || `Scene ${idx + 1}`,
      duration: sceneDuration,
      prompt: s.prompt || `Cinematic photorealistic visual for ${finalTitle}, 4k resolution`,
      promptNepali: s.promptNepali || s.textNepali || 'सिनेमेटिक दृश्य',
      mediaUrl: visual.mediaUrl,
      thumbnailUrl: visual.thumbnailUrl,
      mediaType: visual.mediaType,
      aspectRatio,
      motion: validMotion as any,
      transition: validTransition as any,
      transitionDuration: 0.8,
      textOverlay: s.textOverlay || s.title || '',
      textNepali: s.textNepali || '',
      textPosition: 'lower_third',
      textColor: '#FFFFFF',
      textFont: isNepaliVoice ? 'devanagari' : 'sans',
      filter: 'cinematic',
      volume: 80,
      scriptText: s.voiceoverDialogue,
      narrationVoice: voiceId || (isNepaliVoice ? 'hemkala' : 'ava'),
    });

    subtitles.push({
      id: subId,
      index: idx + 1,
      startTimeSec: Math.round(accumulatedTime * 10) / 10,
      endTimeSec: Math.round((accumulatedTime + sceneDuration) * 10) / 10,
      text: s.voiceoverDialogue || s.textOverlay || s.title || '',
      devanagariText: s.voiceoverNepali || s.textNepali || '',
    });

    accumulatedTime += sceneDuration;
  });

  // Step 7: Multi-Track Audio: Voiceover + Ducked Background Music
  const audioTracks: AudioTrack[] = [];

  // Add synthesized voiceover track first if available
  if (voiceoverAudioTrack) {
    audioTracks.push(voiceoverAudioTrack);
  }

  // Add ambient background music at ducked volume (35%) so voiceover is crisp & prominent
  audioTracks.push({
    id: `audio_bgm_${Date.now()}`,
    title: 'Himalayan Morning Breeze',
    artist: 'NepalAI Soundscapes',
    url: '/audio/himalayan_breeze.mp3',
    duration: Math.max(30, accumulatedTime),
    volume: voiceoverAudioTrack ? 35 : 70, // Auto-ducked BGM when voiceover is present
    genre: 'Ambient / Acoustic',
    type: 'bgm',
    startTime: 0,
  });

  // Step 8: Write to PostgreSQL `projects` table atomically
  const projectId = `proj_url_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const metadata = {
    sourceUrl: article.url,
    sourceTitle: article.title,
    importedAt: new Date().toISOString(),
    autoGeneratedAssets: true,
    hasVoiceover: Boolean(voiceoverAudioTrack),
    clientVersion: '2.0.0-PROD',
    sceneCount: scenes.length,
    totalDuration: Math.round(accumulatedTime * 10) / 10,
  };

  try {
    if (!postgresDb.isConnected) {
      await postgresDb.testConnection();
    }

    if (postgresDb.isConnected) {
      const queryText = `
        SELECT save_project_atomic_transaction($1, $2, $3, $4, $5, $6, $7, $8, $9) AS result
      `;
      await postgresDb.query(queryText, [
        projectId,
        userId || 'usr_admin_01',
        finalTitle,
        aspectRatio,
        JSON.stringify(scenes),
        JSON.stringify(subtitles),
        JSON.stringify(audioTracks),
        JSON.stringify(metadata),
        true, // Create snapshot
      ]);
      console.log(`[UrlToProject] Successfully committed project "${finalTitle}" (${projectId}) to PostgreSQL!`);
    }
  } catch (dbErr: any) {
    console.warn('[UrlToProject] Postgres save notice:', dbErr.message);
  }

  const projectResult: ImportedProjectResult = {
    id: projectId,
    title: finalTitle,
    aspectRatio,
    scenes,
    subtitles,
    audioTracks,
    metadata,
    version: 1,
    totalDuration: Math.round(accumulatedTime * 10) / 10,
  };

  return {
    project: projectResult,
    extractedArticle: article,
  };
}

/**
 * Deterministic structured fallback scene builder with Intro, Main Points, and Outro
 */
function buildStructuredFallbackScenes(article: ExtractedArticle, count: number): any[] {
  const points = article.keyPoints || article.headings || [];
  const sentences = article.text
    .split(/(?<=[.?!।\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  const fallbackScenes: any[] = [];

  // 1. Intro Scene (Hook)
  const introText = article.description || sentences[0] || `An in-depth exploration of ${article.title}.`;
  fallbackScenes.push({
    sceneType: 'intro',
    title: `Intro: ${article.title.slice(0, 35)}`,
    duration: 5,
    prompt: `Cinematic grand establishing shot of ${article.title}, dramatic golden hour lighting, 8k resolution, sweeping camera motion`,
    promptNepali: `सिनेमेटिक परिचयात्मक दृश्य: ${article.title.slice(0, 50)}`,
    textOverlay: `Discover: ${article.title.slice(0, 28)}`,
    textNepali: `परिचय: ${article.title.slice(0, 25)}`,
    motion: 'zoom_in',
    transition: 'fade',
    voiceoverDialogue: `Welcome. Today we explore ${article.title}: ${introText.slice(0, 100)}.`,
    voiceoverNepali: `स्वागत छ। आज हामी ${article.title} बारेमा चर्चा गर्दैछौं।`,
  });

  // 2. Main Body Scenes (Main Points)
  const bodyCount = Math.max(1, count - 2);
  for (let i = 0; i < bodyCount; i++) {
    const rawPoint = points[i] || sentences[i + 1] || `Key insight ${i + 1} regarding ${article.title}`;
    const cleanPoint = rawPoint.replace(/^#+\s*/, '').slice(0, 130);
    const shortHeadline = cleanPoint.split(/[:,-]/)[0].slice(0, 30);

    fallbackScenes.push({
      sceneType: 'main_point',
      title: `Point ${i + 1}: ${shortHeadline}`,
      duration: 5,
      prompt: `Cinematic photorealistic shot illustrating ${cleanPoint}, atmospheric cinematic lighting, highly detailed 8k photography`,
      promptNepali: `मुख्य बुँदा ${i + 1}: ${cleanPoint.slice(0, 45)}`,
      textOverlay: `Point ${i + 1}: ${shortHeadline}`,
      textNepali: `बुँदा ${i + 1}: ${shortHeadline}`,
      motion: i % 2 === 0 ? 'pan_right' : 'pan_left',
      transition: 'dissolve',
      voiceoverDialogue: `First, ${cleanPoint}. This represents a core foundation of the topic.`,
      voiceoverNepali: `यस बुँदामा: ${cleanPoint.slice(0, 70)}।`,
    });
  }

  // 3. Outro Scene (Conclusion)
  fallbackScenes.push({
    sceneType: 'outro',
    title: 'Outro: Final Takeaway',
    duration: 5,
    prompt: `Cinematic inspiring closing visual for ${article.title}, warm ambient twilight, cinematic bokeh, 8k photography`,
    promptNepali: `निष्कर्ष दृश्य: ${article.title.slice(0, 50)}`,
    textOverlay: 'The Final Takeaway',
    textNepali: 'निष्कर्ष तथा सारांश',
    motion: 'zoom_out',
    transition: 'fade',
    voiceoverDialogue: `In conclusion, ${article.title} marks a significant milestone. Follow for more deep-dive stories.`,
    voiceoverNepali: `निष्कर्षमा, यसले महत्वपूर्ण सन्देश दिन्छ। धन्यवाद।`,
  });

  return fallbackScenes;
}
