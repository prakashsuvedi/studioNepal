export interface CharacterDNA {
  id: string;
  name: string;
  role: string;
  avatarEmoji: string;
  visualDescription: string;
  voiceId?: string;
  defaultEmotion?: string;
}

export interface PodcastCameraAngle {
  id: string;
  title: string;
  badge: string;
  framing: string;
  prompt: string;
  subtitle: string;
  recommendedDuration: number;
}

export interface PodcastStudioPack {
  id: string;
  title: string;
  badge: string;
  studioEnvironment: string;
  description: string;
  aspectRatio: '16:9' | '9:16';
  cameraAngles: PodcastCameraAngle[];
}

export interface StoryboardSceneItem {
  id: string;
  sceneNumber: number;
  title: string;
  framing: string;
  prompt: string;
  recommendedDuration: number;
  subtitleEn: string;
  subtitleNe: string;
  characterId?: string;
  videoUrl?: string;
  isProcessing?: boolean;
}

export interface NarrativeStoryboardPack {
  id: string;
  title: string;
  badge: string;
  category: 'documentary' | 'drama' | 'commercial' | 'reel' | 'legend';
  aspectRatio: '16:9' | '9:16';
  characterId: string;
  visualStyle: string;
  description: string;
  scenes: StoryboardSceneItem[];
}

export interface BroadcastFormatPreset {
  id: string;
  title: string;
  badge: string;
  formatCategory: 'podcast' | 'doc' | 'reel' | 'commercial' | 'drama';
  aspectRatio: '16:9' | '9:16';
  resolution: '1280x720' | '720x1280';
  defaultDuration: '4' | '8';
  samplePrompt: string;
  subtitle: string;
  pacingNote: string;
}

export const CHARACTER_DNA_LIST: CharacterDNA[] = [
  {
    id: 'sagar',
    name: 'Sagar',
    role: 'Studio Broadcaster & Tech Host',
    avatarEmoji: '🎙️',
    visualDescription: 'A 32-year-old articulate Nepali tech broadcaster with neat dark hair, wearing a deep navy studio polo shirt with silver professional broadcast headphones resting around his neck.',
    voiceId: 'sagar_pure_ne',
    defaultEmotion: 'neutral',
  },
  {
    id: 'hemkala',
    name: 'Hemkala',
    role: 'Podcast Co-Host & Media Director',
    avatarEmoji: '🎧',
    visualDescription: 'A 29-year-old Nepali digital media host with shoulder-length wavy dark hair, wearing an emerald green linen blazer over a crisp white top with a delicate silver pendant.',
    voiceId: 'hemkala_pure_ne',
    defaultEmotion: 'happy',
  },
  {
    id: 'guru_elder',
    name: 'Guru-ba',
    role: 'Himalayan Elder & Historian',
    avatarEmoji: '📿',
    visualDescription: 'A 68-year-old revered Himalayan elder with wise gentle eyes and silver-grey beard, wearing a traditional maroon and ochre woven wool robe.',
    voiceId: 'guru_elder_ne',
    defaultEmotion: 'neutral',
  },
  {
    id: 'aarav',
    name: 'Aarav',
    role: 'Documentary Explorer & Mountain Guide',
    avatarEmoji: '🏔️',
    visualDescription: 'A 28-year-old energetic Nepali documentary guide with textured dark hair, wearing an ochre-yellow alpine Gore-Tex jacket over a black thermal layer.',
    voiceId: 'aarav_ne',
    defaultEmotion: 'energetic',
  },
  {
    id: 'sita',
    name: 'Sita',
    role: 'Broadcast News Desk Journalist',
    avatarEmoji: '📰',
    visualDescription: 'A 34-year-old professional Kathmandu news desk anchor with elegant dark hair in a sleek bun, wearing a crimson red formal tailored silk blazer.',
    voiceId: 'sita_ne',
    defaultEmotion: 'neutral',
  },
  {
    id: 'david',
    name: 'David',
    role: 'Global Technology Creator',
    avatarEmoji: '🌐',
    visualDescription: 'A 35-year-old international technology creator with short styled brown hair, wearing a charcoal grey studio crewneck and smart watch.',
    voiceId: 'david_en',
    defaultEmotion: 'energetic',
  },
];

export const PODCAST_STUDIO_PACKS: PodcastStudioPack[] = [
  {
    id: 'kathmandu_broadcast',
    title: 'Kathmandu Broadcast Studio (Warm Oak & Neon)',
    badge: '🎙️ Master Studio',
    studioEnvironment: 'A modern Kathmandu broadcast podcast studio with vertical warm oak acoustic slat wood panels, soft amber rim lighting, glowing blue neon accent in background, two professional Shure SM7B microphones mounted on articulated boom arms over a dark walnut podcast desk.',
    description: 'Perfect 2-3 speaker podcast setup with matching environment, lighting, and acoustic panels across all angles.',
    aspectRatio: '16:9',
    cameraAngles: [
      {
        id: 'cam_master_wide',
        title: 'Cam 1: Master Studio Wide (2-Shot)',
        badge: '🎥 Wide 2-Shot',
        framing: 'Wide 2-Shot Master Angle',
        subtitle: 'Both hosts sitting at desk talking and reacting naturally in warm studio light',
        prompt: 'Wide establishing camera shot in a modern broadcast podcast studio with warm oak acoustic slat panels and amber rim lighting. Two Nepali podcast hosts (male and female) sit across from each other at a walnut desk with boom microphones, smiling, gesturing, and having an engaging conversation, 4k 60fps cinematic.',
        recommendedDuration: 8,
      },
      {
        id: 'cam_host_mcu',
        title: 'Cam 2: Host A Close-Up (Sagar)',
        badge: '👤 Host Close-Up',
        framing: 'Medium Close-Up (MCU)',
        subtitle: 'Host speaking passionately into microphone with shallow depth of field',
        prompt: 'Medium close-up camera shot in modern podcast studio with warm oak acoustic panels. An articulate Nepali male host wearing headphones speaks passionately into a Shure SM7B boom microphone, natural eye contact, expressive gestures, soft bokeh studio lighting, 4k cinematic.',
        recommendedDuration: 4,
      },
      {
        id: 'cam_guest_mcu',
        title: 'Cam 3: Guest / Co-Host Close-Up (Hemkala)',
        badge: '👩 Co-Host Close-Up',
        framing: 'Medium Close-Up (MCU)',
        subtitle: 'Co-host listening attentively, smiling and nodding into microphone',
        prompt: 'Medium close-up camera shot in modern podcast studio with warm oak acoustic panels. An articulate Nepali female host wearing an emerald green blazer listens attentively, smiles, and responds warmly into her studio boom microphone, soft warm rim light, 4k.',
        recommendedDuration: 4,
      },
      {
        id: 'cam_ots_perspective',
        title: 'Cam 4: Over-the-Shoulder (OTS Perspective)',
        badge: '🔄 Over-The-Shoulder',
        framing: 'Over-the-Shoulder Dynamic',
        subtitle: 'Looking past host shoulder towards guest speaking across the desk',
        prompt: 'Over-the-shoulder camera shot in modern broadcast podcast studio, looking past the male host’s shoulder towards the female guest speaking across the walnut desk, shallow depth of field, professional studio depth, 4k broadcast television.',
        recommendedDuration: 4,
      },
    ],
  },
  {
    id: 'tech_ai_lab',
    title: 'AI Tech Lab Roundtable (Cyber Studio)',
    badge: '💻 Tech Roundtable',
    studioEnvironment: 'A sleek futuristic tech studio in Kathmandu with matte black hexagonal acoustic tiles, subtle cyan and magenta LED edge lighting, curved ultra-wide monitors displaying AI code visualizers, and minimal studio microphones.',
    description: 'High-tech AI and startup developer podcast discussion studio.',
    aspectRatio: '16:9',
    cameraAngles: [
      {
        id: 'tech_wide',
        title: 'Cam 1: Tech Roundtable Wide',
        badge: '🎥 Wide Studio',
        framing: 'Wide 3-Shot Tech Desk',
        subtitle: 'Three tech creators around glass desk with glowing AI visualizers',
        prompt: 'Wide studio camera shot of three tech innovators sitting around a sleek glass desk in a futuristic studio with cyan and magenta ambient lighting, discussing AI technology, subtle holographic graphs in background, 4k.',
        recommendedDuration: 8,
      },
      {
        id: 'tech_speaker_a',
        title: 'Cam 2: Lead Engineer Close-Up',
        badge: '👤 Lead Engineer',
        framing: 'Tight Close-Up',
        subtitle: 'Explaining AI architecture with focused, confident delivery',
        prompt: 'Tight cinematic close-up of a young Nepali software engineer in dark hoodie explaining AI code with focused enthusiasm, soft cyan rim light on face, bokeh monitors in background, 4k.',
        recommendedDuration: 4,
      },
      {
        id: 'tech_speaker_b',
        title: 'Cam 3: Product Lead Reaction',
        badge: '👩 Product Lead',
        framing: 'Medium Reaction',
        subtitle: 'Nodding thoughtfully and adding strategic commentary',
        prompt: 'Medium close-up of a tech product director nodding thoughtfully and smiling while looking at a tablet on desk, magenta neon studio bokeh, 4k photorealistic.',
        recommendedDuration: 4,
      },
    ],
  },
];

export const NARRATIVE_STORYBOARDS: NarrativeStoryboardPack[] = [
  {
    id: 'himalayan_legend',
    title: 'Legend of the High Sanctuary (3-Scene Short Movie)',
    badge: '🏔️ Himalayan Movie',
    category: 'legend',
    aspectRatio: '16:9',
    characterId: 'aarav',
    visualStyle: 'Cinematic 35mm anamorphic, golden hour mountain rim lighting, rolling morning mist, rich earth tones.',
    description: 'A 3-part cohesive story following an alpine guide reaching an ancient mountain sanctuary at dawn.',
    scenes: [
      {
        id: 'hl_scene_1',
        sceneNumber: 1,
        title: 'Scene 1: Dawn Trail Departure',
        framing: 'Wide Cinematic Sweep',
        prompt: 'Cinematic wide 35mm film shot of Aarav, a 28-year-old Nepali mountain guide in an ochre-yellow alpine jacket, walking along a misty stone mountain pathway at dawn with prayer flags fluttering in the morning breeze, 4k.',
        recommendedDuration: 4,
        subtitleEn: 'As first light touched the ridge, the journey to the ancient high sanctuary began.',
        subtitleNe: 'बिहानीको पहिलो किरणसँगै पुरानो हिमाली तीर्थको यात्रा सुरु भयो।',
        characterId: 'aarav',
      },
      {
        id: 'hl_scene_2',
        sceneNumber: 2,
        title: 'Scene 2: Monastery Prayer Wheels',
        framing: 'Medium Tracking Shot',
        prompt: 'Medium tracking shot inside an ancient cliffside Himalayan monastery courtyard. Aarav in his ochre jacket reverently spins a row of weathered bronze prayer wheels as golden sunlight filters through the mountain mist, 4k cinematic.',
        recommendedDuration: 4,
        subtitleEn: 'Generations of whispers and prayers echo within the bronze wheels.',
        subtitleNe: 'युगौंदेखि चल्दै आएका प्रार्थनाहरू यी पावन मन्दिरमा आज पनि गुञ्जिरहेका छन्।',
        characterId: 'aarav',
      },
      {
        id: 'hl_scene_3',
        sceneNumber: 3,
        title: 'Scene 3: Annapurna Peak Reveal',
        framing: 'Epic Aerial Drone Pan',
        prompt: 'Slow-motion aerial drone sweep soaring past Aarav standing on a dramatic mountain cliff ledge, gazing up as brilliant golden sunrise illuminates the snow-capped summit of Annapurna against a deep sapphire sky, 8k photorealistic.',
        recommendedDuration: 8,
        subtitleEn: 'Standing above the clouds, the majestic Himalayas reveal their timeless serenity.',
        subtitleNe: 'बादलमाथि उभिएर हेर्दा हिमालको अनुपम शान्ति र सौन्दर्य साक्षात् देखिन्छ।',
        characterId: 'aarav',
      },
    ],
  },
  {
    id: 'kathmandu_heritage_doc',
    title: 'Kathmandu Artisan & Heritage (3-Scene Short Documentary)',
    badge: '🏛️ Heritage Doc',
    category: 'documentary',
    aspectRatio: '16:9',
    characterId: 'guru_elder',
    visualStyle: 'Warm natural daylight, authentic terracotta tones, rich Newari architectural woodwork, tactile macro texture.',
    description: 'Documentary sequence exploring master terracotta craftsmanship and ancient heritage preservation.',
    scenes: [
      {
        id: 'kh_scene_1',
        sceneNumber: 1,
        title: 'Scene 1: Pottery Square Establishing',
        framing: 'Wide Establishing Angle',
        prompt: 'Slow-panning wide cinematic shot of Bhaktapur Pottery Square at golden hour. Hundreds of freshly shaped terracotta clay pots drying in rows across sunlit brick courtyards, pigeon flocks taking flight, 4k 60fps.',
        recommendedDuration: 4,
        subtitleEn: 'In the historic courtyards of Bhaktapur, ancient craftsmanship breathes life into earth and fire.',
        subtitleNe: 'भक्तपुरका ऐतिहासिक गल्लीहरूमा पुर्ख्यौली कला आज पनि माटोसँगै बाँचिरहेको छ।',
        characterId: 'guru_elder',
      },
      {
        id: 'kh_scene_2',
        sceneNumber: 2,
        title: 'Scene 2: Master Sculptor Macro',
        framing: 'Tactile Macro Close-Up',
        prompt: 'Macro close-up shot of the weathered, skilled hands of Guru-ba, an elderly Nepali master craftsman, deftly shaping a wet clay pot on a spinning wooden wheel with graceful precision, warm golden dust particles in air, 4k.',
        recommendedDuration: 4,
        subtitleEn: 'Every curve tells a story passed down through countless generations.',
        subtitleNe: 'प्रत्येक आकारमा पुर्खाहरूको अनुभव र लगनशीलता झल्किन्छ।',
        characterId: 'guru_elder',
      },
      {
        id: 'kh_scene_3',
        sceneNumber: 3,
        title: 'Scene 3: Evening Temple Lamp Glow',
        framing: 'Atmospheric Medium Close-Up',
        prompt: 'Cinematic medium shot of an ancient tiered pagoda temple illuminated at twilight by hundreds of brass oil butter lamps, soft smoke swirling around intricately carved wooden deities, 4k masterpiece.',
        recommendedDuration: 4,
        subtitleEn: 'As twilight falls, thousands of oil lamps keep the ancient spirit alive.',
        subtitleNe: 'साँझ ढल्किँदै जाँदा हजारौं दियोहरूको उज्यालोले परम्परालाई जीवन्त राख्छ।',
        characterId: 'guru_elder',
      },
    ],
  },
  {
    id: 'viral_product_commercial',
    title: 'High-Impact Brand Commercial (3-Scene Ad / Reel)',
    badge: '⚡ TV Commercial',
    category: 'commercial',
    aspectRatio: '9:16',
    characterId: 'david',
    visualStyle: 'High-contrast commercial lighting, fast kinetic camera movement, vibrant saturation, punchy rim light.',
    description: 'Vertical 9:16 high-conversion commercial reel designed for TikTok, Instagram, and TV streaming.',
    scenes: [
      {
        id: 'vc_scene_1',
        sceneNumber: 1,
        title: 'Scene 1: Kinetic Hook',
        framing: 'Fast Push-In Close-Up',
        prompt: 'Vertical 9:16 commercial fast push-in camera shot. A stylish creator snaps his fingers as glowing holographic neon particles burst into the air, sharp futuristic lighting, 4k 60fps.',
        recommendedDuration: 4,
        subtitleEn: 'Transform your storytelling into cinema in seconds.',
        subtitleNe: 'आफ्नो सोचलाई सेकेन्डमै चलचित्रको रूप दिनुहोस्।',
        characterId: 'david',
      },
      {
        id: 'vc_scene_2',
        sceneNumber: 2,
        title: 'Scene 2: Studio Creation Flow',
        framing: 'Medium Action Over-Shoulder',
        prompt: 'Vertical 9:16 commercial over-the-shoulder shot of creator seamlessly scrubbing through 4k AI video timeline on a glowing tablet, ultra-smooth motion, premium studio aesthetics, 4k.',
        recommendedDuration: 4,
        subtitleEn: 'Next-generation AI video powered by Sora-2 & Neural Voice.',
        subtitleNe: 'नेपालएआई स्टुडियोको अत्याधुनिक सोरा भिडियो र भ्वाइस प्रविधि।',
        characterId: 'david',
      },
      {
        id: 'vc_scene_3',
        sceneNumber: 3,
        title: 'Scene 3: Hero Call To Action',
        framing: 'Centered Hero Shot',
        prompt: 'Vertical 9:16 hero shot. The creator looks directly into camera with a confident smile against dynamic Kathmandu skyline night lights, glowing 3D logo in foreground, 4k commercial.',
        recommendedDuration: 4,
        subtitleEn: 'Create today with NepalAI Studio. Start now!',
        subtitleNe: 'आजै नेपालएआई स्टुडियोसँग सिर्जना गर्नुहोस्!',
        characterId: 'david',
      },
    ],
  },
];

export const BROADCAST_FORMAT_PRESETS: BroadcastFormatPreset[] = [
  {
    id: 'preset_podcast_wide',
    title: 'Studio Podcast (16:9 Broadcast Desk)',
    badge: '🎙️ Podcast 16:9',
    formatCategory: 'podcast',
    aspectRatio: '16:9',
    resolution: '1280x720',
    defaultDuration: '8',
    samplePrompt: 'Wide establishing camera shot in a modern broadcast podcast studio with warm oak acoustic slat panels and amber rim lighting. Two Nepali podcast hosts sit across from each other at a walnut desk with boom microphones, talking and smiling naturally, 4k.',
    subtitle: 'Standard 16:9 horizontal streaming format for YouTube & TV podcasts.',
    pacingNote: 'Measured natural conversational cadence with Shure SM7B mics and studio tone.',
  },
  {
    id: 'preset_doc_heritage',
    title: '4K Heritage Documentary (16:9 Cinematic)',
    badge: '🎬 4K Doc 16:9',
    formatCategory: 'doc',
    aspectRatio: '16:9',
    resolution: '1280x720',
    defaultDuration: '8',
    samplePrompt: 'Cinematic slow aerial drone sweep skimming over snow-capped Himalayan ridges at golden hour, gentle mountain fog rolling through pine valleys, 8k ultra-high definition.',
    subtitle: 'Epic 16:9 widescreen aerial and cultural b-roll with natural depth.',
    pacingNote: 'Slow, majestic camera movement with room for reflective baritone narration.',
  },
  {
    id: 'preset_viral_reel',
    title: 'Informative Viral Reel (9:16 Vertical)',
    badge: '📱 Reel 9:16',
    formatCategory: 'reel',
    aspectRatio: '9:16',
    resolution: '720x1280',
    defaultDuration: '4',
    samplePrompt: 'Vertical 9:16 dynamic camera shot of an energetic Nepali host talking enthusiastically while walking through modern Kathmandu, clear eye-level framing, vibrant color grading, 4k.',
    subtitle: 'Optimized for TikTok, Instagram Reels, and YouTube Shorts.',
    pacingNote: 'Fast punchy motion with subject centered in vertical safe zones.',
  },
  {
    id: 'preset_tv_ad',
    title: 'High-Conversion TV Commercial (16:9)',
    badge: '⚡ TV Ad 16:9',
    formatCategory: 'commercial',
    aspectRatio: '16:9',
    resolution: '1280x720',
    defaultDuration: '4',
    samplePrompt: 'High-end TV commercial shot of a sleek modern laptop displaying vibrant video editing software, elegant rim lighting, smooth slider track motion, 4k broadcast commercial quality.',
    subtitle: 'Crisp commercial product and brand advertisement framing.',
    pacingNote: 'High visual energy, snappy motion blur, and strong contrast.',
  },
  {
    id: 'preset_cinematic_drama',
    title: 'Cinematic Drama / Short Movie (16:9)',
    badge: '🍿 Drama 16:9',
    formatCategory: 'drama',
    aspectRatio: '16:9',
    resolution: '1280x720',
    defaultDuration: '8',
    samplePrompt: 'Cinematic 35mm anamorphic film shot with Rembrandt lighting. A character stands near a rain-streaked window overlooking twilight hills, deep emotional intensity, 4k.',
    subtitle: 'Narrative storytelling with dramatic lighting and color contrast.',
    pacingNote: 'Atmospheric tension with rich shadows and character focal depth.',
  },
];
