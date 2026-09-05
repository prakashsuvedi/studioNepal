import { StarterTemplate, RouteAuditStatus, Scene, AudioTrack } from './types';

export const INITIAL_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'track-1',
    title: 'Himalayan Morning Breeze',
    artist: 'NepalAI Soundscapes',
    url: 'https://cdn.freesound.org/previews/518/518290_7037-lq.mp3',
    duration: 30,
    volume: 75,
    genre: 'Ambient / Flute'
  },
  {
    id: 'track-2',
    title: 'Modern Kathmandu Beat',
    artist: 'Prakash AI Studio',
    url: 'https://cdn.freesound.org/previews/612/612887_11861866-lq.mp3',
    duration: 25,
    volume: 80,
    genre: 'Lo-Fi / Beats'
  },
  {
    id: 'track-3',
    title: 'Temple Bells & Serenity',
    artist: 'Heritage Audio',
    url: 'https://cdn.freesound.org/previews/568/568779_6142149-lq.mp3',
    duration: 20,
    volume: 60,
    genre: 'Traditional'
  }
];

export const INITIAL_SCENES: Scene[] = [
  {
    id: 'scene-1',
    title: 'Everest Sunrise Glow',
    duration: 4,
    prompt: 'Ultra-cinematic golden sunrise illuminating Mount Everest peak with wispy snow plumes, 8k resolution, photorealistic aerial drone sweep.',
    promptNepali: 'माउन्ट एभरेष्टको शिखरमा बिहानीको सुनौलो घामको किरण, आकर्षक ड्रोन दृश्य।',
    mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1280&q=80',
    mediaType: 'image',
    aspectRatio: '16:9',
    motion: 'pan_right',
    transition: 'fade',
    textOverlay: 'The Rooftop of the World',
    textNepali: 'संसारको शिखर - नेपाल',
    textPosition: 'lower_third',
    textColor: '#ffffff',
    textFont: 'devanagari',
    filter: 'cinematic',
    volume: 90
  },
  {
    id: 'scene-2',
    title: 'Kathmandu Heritage Alleys',
    duration: 5,
    prompt: 'Ancient carved wooden temple windows of Patan Durbar Square, warm evening oil lamps glowing, cinematic shallow depth of field.',
    promptNepali: 'पाटन दरबार क्षेत्रको परम्परागत काष्ठकला र साँझको बत्तीको रमणीय दृश्य।',
    mediaUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1280&q=80',
    mediaType: 'image',
    aspectRatio: '16:9',
    motion: 'zoom_in',
    transition: 'dissolve',
    textOverlay: 'Centuries of Timeless Art',
    textNepali: 'कालजयी नेपाली कला र संस्कृति',
    textPosition: 'bottom',
    textColor: '#fef08a',
    textFont: 'sans',
    filter: 'warm',
    volume: 85
  },
  {
    id: 'scene-3',
    title: 'Pokhara Lakeside Peace',
    duration: 4,
    prompt: 'Colorful wooden boats resting calmly on Phewa Lake with Machhapuchhre reflection in the tranquil waters, misty morning light.',
    promptNepali: 'फेवातालमा रंगीचंगी डुङ्गा र पृष्ठभूमिमा माछापुच्छ्रे हिमालको सुन्दर छाया।',
    mediaUrl: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1280&q=80',
    mediaType: 'image',
    aspectRatio: '16:9',
    motion: 'dolly',
    transition: 'wipe_right',
    textOverlay: 'Serenity Found in Pokhara',
    textNepali: 'पोखराको शान्त वातावरण',
    textPosition: 'center',
    textColor: '#ffffff',
    textFont: 'devanagari',
    filter: 'cool',
    volume: 80
  }
];

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'tpl-story',
    title: 'Himalayan Story Sequence',
    category: 'Cinematic Travel',
    description: 'A 3-part breathtaking narrative sequence exploring Everest, Kathmandu culture, and Pokhara lakes with emotional pacing and music.',
    scenesCount: 3,
    totalDuration: 13,
    scenes: [
      {
        title: 'Dawn Over the Himalayas',
        duration: 4,
        prompt: 'First light breaking over snow-capped Annapurna ranges, deep alpine blues transitioning to gold, cinematic 4k.',
        promptNepali: 'अन्नपूर्ण हिमशृङ्खलामा बिहानको सुनौलो किरण, उच्च गुणस्तरको दृश्य।',
        mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1280&q=80',
        mediaType: 'image',
        aspectRatio: '16:9',
        motion: 'pan_left',
        transition: 'fade',
        textOverlay: 'Chapter 1: The Ascent',
        textNepali: 'पहिलो अध्याय: आरोहण',
        textPosition: 'lower_third',
        textColor: '#ffffff',
        textFont: 'sans',
        filter: 'cinematic',
        volume: 90
      },
      {
        title: 'Prayer Flags in the Wind',
        duration: 5,
        prompt: 'Vibrant Tibetan prayer flags fluttering wildly at high mountain pass against dramatic Himalayan sky, slow motion 60fps.',
        promptNepali: 'हिमालको स्वच्छ हावामा फरफराइरहेका शान्ति र प्रार्थनाका ध्वजापताकाहरू।',
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1280&q=80',
        mediaType: 'image',
        aspectRatio: '16:9',
        motion: 'zoom_out',
        transition: 'dissolve',
        textOverlay: 'Peace Whispers in the Wind',
        textNepali: 'शान्तिको सन्देश हावामा',
        textPosition: 'bottom',
        textColor: '#fef08a',
        textFont: 'devanagari',
        filter: 'vibrant',
        volume: 85
      },
      {
        title: 'Campfire Under the Milky Way',
        duration: 4,
        prompt: 'Trekkers around warm glowing camp tent under breathtaking clear Milky Way galaxy star field in Namche Bazaar.',
        promptNepali: 'सफा हिमाली आकाशमुनि ताराहरूको चमक र क्याम्पिङको स्वर्गीय आनन्द।',
        mediaUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1280&q=80',
        mediaType: 'image',
        aspectRatio: '16:9',
        motion: 'orbit',
        transition: 'cut',
        textOverlay: 'Nepal: Once is Not Enough',
        textNepali: 'नेपाल: एकपटक कहिल्यै पुग्दैन',
        textPosition: 'center',
        textColor: '#ffffff',
        textFont: 'devanagari',
        filter: 'warm',
        volume: 80
      }
    ]
  },
  {
    id: 'tpl-business',
    title: 'High-Conversion Business Ad',
    category: 'Commercial',
    description: 'High-energy, conversion-oriented video ad framework crafted for Nepali cafes, e-commerce brands, and agency promotions.',
    scenesCount: 3,
    totalDuration: 12,
    scenes: [
      {
        title: 'Product Hero Hook',
        duration: 3,
        prompt: 'Artisanal organic Himalayan coffee beans pouring into grinder, rich espresso crema forming in transparent cup, studio macro lighting.',
        promptNepali: 'अर्ग्यानिक नेपाली कफी, ताजा र उत्कृष्ट स्वाद, व्यावसायिक स्टुडियो दृश्य।',
        mediaUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1280&q=80',
        mediaType: 'image',
        aspectRatio: '16:9',
        motion: 'zoom_in',
        transition: 'wipe_left',
        textOverlay: 'Crafted with Passion in Nepal',
        textNepali: 'नेपालमै उत्पादित शुद्ध स्वाद',
        textPosition: 'lower_third',
        textColor: '#ffffff',
        textFont: 'sans',
        filter: 'warm',
        volume: 100
      },
      {
        title: 'Customer Delight',
        duration: 5,
        prompt: 'Happy young professional sipping hot drink in cozy Kathmandu rooftop cafe overlooking sunlit city, genuine smile, bokeh.',
        promptNepali: 'काठमाडौँको रमणीय क्याफेमा ग्राहकको सन्तुष्ट मुस्कान र गुणस्तरीय सेवा।',
        mediaUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1280&q=80',
        mediaType: 'image',
        aspectRatio: '16:9',
        motion: 'pan_right',
        transition: 'fade',
        textOverlay: 'Special 20% Launch Offer',
        textNepali: 'विशेष २०% छुट - सीमित अवधिको लागि',
        textPosition: 'top',
        textColor: '#38bdf8',
        textFont: 'devanagari',
        filter: 'vibrant',
        volume: 95
      },
      {
        title: 'Call to Action & Brand',
        duration: 4,
        prompt: 'Minimalist luxury brand packaging box opening with golden ribbon, crisp typography, clean high-end aesthetic.',
        promptNepali: 'अर्डर गर्न आजै वेबसाइटमा जानुहोस् वा सिधै सम्पर्क गर्नुहोस्।',
        mediaUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1280&q=80',
        mediaType: 'image',
        aspectRatio: '16:9',
        motion: 'static',
        transition: 'dissolve',
        textOverlay: 'Order Today • Fast Delivery Across Nepal',
        textNepali: 'नेपालभर डेलिभरी उपलब्ध छ',
        textPosition: 'center',
        textColor: '#ffffff',
        textFont: 'devanagari',
        filter: 'cinematic',
        volume: 90
      }
    ]
  },
  {
    id: 'tpl-reel',
    title: '9:16 Social Reel (TikTok / Shorts)',
    category: 'Social Media',
    description: 'Vertical 9:16 format engineered with fast hooks, bold dynamic subtitles, and high-retention cuts.',
    scenesCount: 2,
    totalDuration: 8,
    scenes: [
      {
        title: 'Vertical Hook',
        duration: 4,
        prompt: 'Dramatic vertical shot of white water rafting in Trishuli River Nepal, giant water splash, extreme action shot.',
        promptNepali: 'त्रिशूली नदीमा र्याफ्टिङको रोमाञ्चक दृश्य, साहसिक खेल।',
        mediaUrl: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=720&q=80',
        mediaType: 'image',
        aspectRatio: '9:16',
        motion: 'zoom_in',
        transition: 'cut',
        textOverlay: 'Are You Ready for Adventure?',
        textNepali: 'के तपाईं साहसिक यात्राको लागि तयार हुनुहुन्छ?',
        textPosition: 'center',
        textColor: '#fbbf24',
        textFont: 'devanagari',
        filter: 'vibrant',
        volume: 95
      },
      {
        title: 'Vertical Climax',
        duration: 4,
        prompt: 'Paraglider floating over Phewa lake with snow mountains in background, vertical 9:16, bright sunny skies.',
        promptNepali: 'पोखराको आकाशमा प्याराग्लाइडिङको रोमाञ्चक अनुभव।',
        mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=720&q=80',
        mediaType: 'image',
        aspectRatio: '9:16',
        motion: 'pan_left',
        transition: 'fade',
        textOverlay: 'Follow for More Nepal Hidden Gems',
        textNepali: 'थप नयाँ भिडियोहरूको लागि फलो गर्नुहोस्',
        textPosition: 'bottom',
        textColor: '#ffffff',
        textFont: 'devanagari',
        filter: 'cinematic',
        volume: 90
      }
    ]
  }
];

export const AUDIT_ROUTE_MATRIX: RouteAuditStatus[] = [
  {
    route: 'POST /api/video/azure',
    method: 'POST',
    status: 'broken_upstream',
    reportedErrorCode: '404 Route Not Found',
    rootCause: 'The live Hugging Face container was running stale backend v1.7.0. The new Sora-2 router (`azureMediaRoutes.js`) was never registered in the active container.',
    solution: 'Expose `/api/video/azure` in `server.js` with parameter validation (`prompt`, `model="sora-2"`, `size="720x1280"`, `seconds="4"`), handle async video job queue, and return immediate mock/live preview URL.'
  },
  {
    route: 'POST /api/images/azure',
    method: 'POST',
    status: 'broken_upstream',
    reportedErrorCode: '402 Payment Required & 400 Bad Request',
    rootCause: 'A legacy credit check middleware intercepted requests before the Azure adapter ran. Additionally, old schema expected legacy MAI-Image-2.5-Pro payload rather than standard OpenAI `gpt-image-1.5` format.',
    solution: 'Allow Admin Workspace token to bypass credit deductions entirely. Normalize input payload for `gpt-image-1.5` (base64 JSON decode or direct binary stream) and provide fallback to Pollinations for free tier.'
  },
  {
    route: 'Node Module Import',
    method: 'GET',
    status: 'broken_upstream',
    reportedErrorCode: 'MODULE_NOT_FOUND (Cannot find module ./mediaJobRoutes)',
    rootCause: 'Incomplete file upload to Hugging Face Space git repository. `server.js` was committed while `mediaJobRoutes.js` and `azureClient.js` were missing from the git commit.',
    solution: 'Commit the complete bundle containing `server.js`, `mediaJobRoutes.js`, `mediaJobStore.js`, `azureClient.js`, and `azureMediaRoutes.js` simultaneously.'
  },
  {
    route: 'Admin Workspace Access',
    method: 'POST',
    status: 'broken_upstream',
    reportedErrorCode: 'Locked in "Controlled Mode"',
    rootCause: 'Hardcoded guard flag `IS_CONTROLLED_MODE = true` prevented admin testing of real Azure AI Foundry credentials.',
    solution: 'Provide an Admin Passkey login that unlocks real provider testing with custom endpoint URL, API key, and model overrides.'
  }
];
