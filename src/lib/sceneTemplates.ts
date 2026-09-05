import { CameraMotion, TransitionType, ColorFilter, Scene } from '../types';

export interface SceneTemplate {
  id: string;
  name: string;
  nameNe: string;
  category: 'Intro' | 'Outro' | 'Lower-Thirds' | 'Content' | 'Breaking-News' | 'Showcase';
  description: string;
  descriptionNe: string;
  duration: number;
  motion: CameraMotion;
  transition: TransitionType;
  filter: ColorFilter;
  textPosition: 'bottom' | 'center' | 'top' | 'lower_third';
  textFont: 'sans' | 'devanagari' | 'mono';
  textColor: string;
  defaultTitle: string;
  samplePrompt: string;
  samplePromptNe?: string;
  sampleText: string;
  sampleTextNe?: string;
  previewThumbnail: string;
  badge: string;
  badgeColor: string;
}

export const SCENE_TEMPLATES: SceneTemplate[] = [
  {
    id: 'tmpl_intro_himalaya',
    name: 'Cinematic Himalayan Intro',
    nameNe: 'हिमाली सिनेमाटिक इन्ट्रो',
    category: 'Intro',
    description: 'Breathtaking mountain sunrise with majestic pan-right camera motion and epic title typography.',
    descriptionNe: 'सूर्योदयको हिमाली दृश्य, भव्य पान-राइट क्यामेरा र आकर्षक शीर्षक फन्ट।',
    duration: 5,
    motion: 'pan_right',
    transition: 'fade',
    filter: 'cinematic',
    textPosition: 'center',
    textFont: 'devanagari',
    textColor: '#FFFFFF',
    defaultTitle: 'Cinematic Intro',
    samplePrompt: 'Majestic cinematic aerial view of Mt Everest and Annapurna range at golden hour, 8k resolution, photorealistic',
    samplePromptNe: 'सगरमाथा र अन्नपूर्ण हिमशृङ्खलाको सुनौलो बिहानीको मनमोहक दृश्य',
    sampleText: 'NEPAL: ROOF OF THE WORLD',
    sampleTextNe: 'नेपाल: प्रकृतिको अनुपम उपहार',
    previewThumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
    badge: 'Intro Hook',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    id: 'tmpl_lower_third_speaker',
    name: 'Speaker / Interview Lower-Third',
    nameNe: 'अन्तर्वार्ता / वक्ता लोअर-थर्ड',
    category: 'Lower-Thirds',
    description: 'Professional lower-third speaker badge with dolly zoom, subtle contrast filter, and dual-line name/title.',
    descriptionNe: 'व्यावसायिक वक्ता परिचय ब्यानर, डली जुम र प्रस्ट नेपाली-अंग्रेजी फन्ट।',
    duration: 7,
    motion: 'dolly',
    transition: 'dissolve',
    filter: 'none',
    textPosition: 'lower_third',
    textFont: 'sans',
    textColor: '#F8FAFC',
    defaultTitle: 'Interview Speaker',
    samplePrompt: 'Modern bright minimalist broadcast podcast studio in Kathmandu, warm lighting, cinematic depth of field',
    samplePromptNe: 'काठमाडौँको आधुनिक स्टुडियोमा अन्तर्वार्ताको दृश्य',
    sampleText: 'Prof. Ramesh Sharma // AI Ethics & Culture',
    sampleTextNe: 'प्रा. रमेश शर्मा • एआई अनुसन्धानकर्ता',
    previewThumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    badge: 'Lower-Third',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    id: 'tmpl_news_breaking',
    name: 'Breaking News Alert Banner',
    nameNe: 'ताजा समाचार / ब्रेकिङ न्युज',
    category: 'Breaking-News',
    description: 'High-impact red breaking news ticker with high contrast banner, anchor framing, and slide-left transition.',
    descriptionNe: 'रातो ब्रेकिङ न्युज टिकर, प्रत्यक्ष समाचार प्रसारण ढाँचा।',
    duration: 6,
    motion: 'static',
    transition: 'wipe_left',
    filter: 'vibrant',
    textPosition: 'bottom',
    textFont: 'devanagari',
    textColor: '#FEF08A',
    defaultTitle: 'Breaking News Ticker',
    samplePrompt: 'Modern high-tech television newsroom broadcast set, digital holographic charts, professional studio lighting',
    samplePromptNe: 'आधुनिक समाचार कक्ष र डिजिटल स्टुडियो',
    sampleText: 'BREAKING NEWS // LIVE BROADCAST KATHMANDU',
    sampleTextNe: 'विशेष समाचार // नेपालको नयाँ प्रविधि क्रान्ति',
    previewThumbnail: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    badge: 'Breaking News',
    badgeColor: 'bg-red-100 text-red-800 border-red-300'
  },
  {
    id: 'tmpl_showcase_product',
    name: 'Product Hero Showcase',
    nameNe: 'उत्पादन प्रदर्शन (Product Showcase)',
    category: 'Showcase',
    description: 'Slow zoom-in spotlight on product center stage with floating feature highlights and vibrant color grade.',
    descriptionNe: 'उत्पादन केन्द्रित जुम, आकर्षक रङ संयोजन र अफर हाइलाइट।',
    duration: 5,
    motion: 'zoom_in',
    transition: 'wipe_right',
    filter: 'vibrant',
    textPosition: 'center',
    textFont: 'sans',
    textColor: '#FFFFFF',
    defaultTitle: 'Product Spotlight',
    samplePrompt: 'Sleek luxury premium smart device floating on dark reflective obsidian glass, neon rim lighting, 8k commercial',
    samplePromptNe: 'अत्याधुनिक प्रविधिको स्मार्ट उत्पादनको आकर्षक विज्ञापन',
    sampleText: 'THE FUTURE OF CREATIVITY • 50% OFF TODAY',
    sampleTextNe: 'नेपालमा निर्मित अत्याधुनिक प्रविधि',
    previewThumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    badge: 'Product Hero',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 'tmpl_cultural_spotlight',
    name: 'Cultural Heritage Spotlight',
    nameNe: 'सांस्कृतिक सम्पदा विशेष',
    category: 'Content',
    description: 'Gentle pan-left across historic architecture with warm sepia grading and authentic Devanagari calligraphy.',
    descriptionNe: 'नेपाली सम्पदा, मन्दिर र संस्कृतिको न्यानो सिनेम्याटिक दृश्य।',
    duration: 6,
    motion: 'pan_left',
    transition: 'fade',
    filter: 'warm',
    textPosition: 'bottom',
    textFont: 'devanagari',
    textColor: '#FFFFFF',
    defaultTitle: 'Heritage Focus',
    samplePrompt: 'Ancient Kathmandu Durbar Square temple at twilight with butter lamps glowing, cinematic atmospheric mist',
    samplePromptNe: 'काठमाडौँ दरबार क्षेत्रको साँझको मनमोहक दीप प्रज्वलन',
    sampleText: 'Preserving Centuries of Art & Culture',
    sampleTextNe: 'हाम्रो गौरव, हाम्रो अमूल्य सम्पदा',
    previewThumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
    badge: 'Heritage',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    id: 'tmpl_reel_hook',
    name: '3-Second Viral Hook (Reels/TikTok)',
    nameNe: '३-सेकेन्ड भाइरल हुक (Reels / TikTok)',
    category: 'Intro',
    description: 'Fast energetic zoom-in designed for vertical retention, high saturation, and bold punchy headline.',
    descriptionNe: 'छोटो भिडियोका लागि तत्काल दर्शक तान्ने भाइरल हुक।',
    duration: 3,
    motion: 'zoom_in',
    transition: 'fade',
    filter: 'vibrant',
    textPosition: 'center',
    textFont: 'sans',
    textColor: '#FEF08A',
    defaultTitle: 'Viral Hook 3s',
    samplePrompt: 'Energetic vibrant futuristic explosion of neon colors in Kathmandu street, hyper-dynamic angle, vertical',
    samplePromptNe: 'ऊर्जावान र आकर्षक दृश्य',
    sampleText: 'DON’T SCROLL! WATCH TILL END 🔥',
    sampleTextNe: 'यो नहेरी नजानुहोस्! हेर्नुहोस् अन्त्यसम्म 🔥',
    previewThumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    badge: '9:16 Reel Hook',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  {
    id: 'tmpl_outro_cta',
    name: 'Call-to-Action & Subscribe Outro',
    nameNe: 'क्रेडिट तथा सब्स्क्राइब आउट्रो',
    category: 'Outro',
    description: 'Smooth zoom-out to black with clean channel branding, social links, and closing audio fade.',
    descriptionNe: 'भिडियो समापन, च्यानल सब्स्क्राइब र वेबसाइट लिङ्क।',
    duration: 5,
    motion: 'zoom_out',
    transition: 'fade',
    filter: 'cinematic',
    textPosition: 'center',
    textFont: 'sans',
    textColor: '#FFFFFF',
    defaultTitle: 'Outro & Social CTA',
    samplePrompt: 'Deep cinematic ambient twilight sky with subtle glowing particles, clean corporate gradient backdrop',
    samplePromptNe: 'शान्त साँझको सिनेम्याटिक पृष्ठभूमि',
    sampleText: 'LIKE • SHARE • SUBSCRIBE\nwww.nepalai.tech',
    sampleTextNe: 'नेपालएआई स्टुडियो • धन्यवाद',
    previewThumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    badge: 'Outro CTA',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  {
    id: 'tmpl_interview_lower_quote',
    name: 'Customer Testimonial & Quote',
    nameNe: 'ग्राहक अनुभव तथा उद्धरण',
    category: 'Lower-Thirds',
    description: 'Clean quote bubble lower-third with natural light grading and speaker attribution.',
    descriptionNe: 'समीक्षा तथा ग्राहकको भनाइ प्रदर्शन गर्ने लोअर-थर्ड।',
    duration: 6,
    motion: 'static',
    transition: 'dissolve',
    filter: 'none',
    textPosition: 'bottom',
    textFont: 'sans',
    textColor: '#FFFFFF',
    defaultTitle: 'Client Testimonial',
    samplePrompt: 'Smiling professional young Nepali entrepreneur in a cozy tech startup office, soft natural daylight',
    samplePromptNe: 'नेपाली स्टार्टअप उद्यमीको स्टुडियो दृश्य',
    sampleText: '"NepalAI Studio transformed our entire video production workflow!"',
    sampleTextNe: '"नेपालएआई स्टुडियोले हाम्रो काम १० गुणा छिटो बनाइदियो!"',
    previewThumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    badge: 'Testimonial',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300'
  }
];

export function createSceneFromTemplate(template: SceneTemplate, aspectRatio: '16:9' | '9:16' | '1:1'): Scene {
  return {
    id: `scn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: template.defaultTitle,
    duration: template.duration,
    prompt: template.samplePrompt,
    promptNepali: template.samplePromptNe,
    mediaUrl: template.previewThumbnail,
    mediaType: 'image',
    aspectRatio,
    motion: template.motion,
    transition: template.transition,
    textOverlay: template.sampleText,
    textNepali: template.sampleTextNe,
    textPosition: template.textPosition,
    textColor: template.textColor,
    textFont: template.textFont,
    filter: template.filter,
    volume: 100
  };
}
