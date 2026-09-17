export type SubjectCategory = 'person' | 'vehicle' | 'environment' | 'animal' | 'object';

export interface SubjectLockItem {
  id: string;
  name: string;
  category: SubjectCategory;
  roleOrType: string;
  avatarEmoji: string;
  visualDescription: string;
  frameOneAnchorSeed: string;
  anchorToken: string;
  referenceImage?: string;
  tags?: string[];
  voiceId?: string;
  defaultEmotion?: string;
}

export type CharacterDNA = SubjectLockItem;

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
  subjectLockId?: string;
  continuationNote?: string;
  videoUrl?: string;
  isProcessing?: boolean;
}

export interface NarrativeStoryboardPack {
  id: string;
  title: string;
  badge: string;
  category: 'documentary' | 'drama' | 'commercial' | 'reel' | 'legend' | 'movie';
  aspectRatio: '16:9' | '9:16';
  characterId: string;
  subjectLockId?: string;
  visualStyle: string;
  description: string;
  clipCount: number;
  totalEstimatedDuration: number; // in seconds
  scenes: StoryboardSceneItem[];
}

export interface BroadcastFormatPreset {
  id: string;
  title: string;
  badge: string;
  formatCategory: 'podcast' | 'doc' | 'reel' | 'commercial' | 'drama' | 'movie';
  aspectRatio: '16:9' | '9:16';
  resolution: '1280x720' | '720x1280';
  defaultDuration: '4' | '8' | '12';
  samplePrompt: string;
  subtitle: string;
  pacingNote: string;
}

export const SUBJECT_LOCK_REGISTRY: SubjectLockItem[] = [
  // --- PERSONS (Girl, Boy, Elder, Host) ---
  {
    id: 'maya_girl',
    name: 'Maya (Tech Creator / Young Woman)',
    category: 'person',
    roleOrType: 'Girl / Female Protagonist',
    avatarEmoji: '👩‍💻',
    visualDescription: '25-year-old Nepali woman with high cheekbones, almond hazel-brown eyes, defined straight nose bridge, defined jawline angle 112 deg, shoulder-length glossy wavy black hair, warm golden undertone skin, wearing a modern indigo linen top.',
    frameOneAnchorSeed: 'Front-facing 35mm master portrait on Frame 1, exact facial proportions: almond hazel eyes, shoulder-length wavy black hair, natural warm skin tone, sharp optical focus.',
    anchorToken: '[Subject-Anchor: FaceID_v4#Maya_0192]',
    referenceImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    tags: ['girl', 'person', 'woman', 'creator', 'nepali'],
    voiceId: 'maya_ne',
    defaultEmotion: 'confident',
  },
  {
    id: 'aarav_boy',
    name: 'Aarav (Alpine Guide / Explorer)',
    category: 'person',
    roleOrType: 'Boy / Male Protagonist',
    avatarEmoji: '🏔️',
    visualDescription: '28-year-old energetic South Asian man with athletic jawline, expressive dark amber eyes, textured short black hair, wearing an ochre-yellow alpine Gore-Tex jacket over a black thermal collar.',
    frameOneAnchorSeed: 'Three-quarter cinematic profile on Frame 1, exact ochre-yellow alpine jacket, athletic jawline, short textured dark hair, natural alpine daylight.',
    anchorToken: '[Subject-Anchor: FaceID_v4#Aarav_8841]',
    referenceImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    tags: ['boy', 'man', 'person', 'guide', 'explorer'],
    voiceId: 'aarav_ne',
    defaultEmotion: 'energetic',
  },
  {
    id: 'priya_girl',
    name: 'Priya (Student / Cultural Storyteller)',
    category: 'person',
    roleOrType: 'Girl / Female Protagonist',
    avatarEmoji: '🌸',
    visualDescription: '22-year-old Nepali girl with bright radiant smile, warm honey skin tone, long straight jet-black hair tied with a traditional maroon ribbon, wearing a subtle handmade Dhaka-pattern scarf over an emerald knit sweater.',
    frameOneAnchorSeed: 'Frame 1 eye-level portrait, long jet-black hair with maroon ribbon, authentic Dhaka scarf texture, bright warm smile.',
    anchorToken: '[Subject-Anchor: FaceID_v4#Priya_3319]',
    referenceImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    tags: ['girl', 'student', 'youth', 'person', 'dhaka'],
    voiceId: 'hemkala_pure_ne',
    defaultEmotion: 'happy',
  },
  {
    id: 'rohit_boy',
    name: 'Rohit (Creative Urban Youth)',
    category: 'person',
    roleOrType: 'Boy / Male Protagonist',
    avatarEmoji: '🛹',
    visualDescription: '20-year-old Nepali urban youth with styled wavy dark brown fringe, wearing a vintage washed denim jacket over a white tee, silver ring on right thumb, casual charismatic demeanor.',
    frameOneAnchorSeed: 'Frame 1 candid camera angle, washed denim jacket, dark brown textured fringe, relaxed confident gaze.',
    anchorToken: '[Subject-Anchor: FaceID_v4#Rohit_7712]',
    referenceImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    tags: ['boy', 'youth', 'urban', 'person'],
    voiceId: 'sagar_pure_ne',
    defaultEmotion: 'energetic',
  },
  {
    id: 'guru_ba_elder',
    name: 'Guru-ba (Himalayan Master / Elder)',
    category: 'person',
    roleOrType: 'Elder / Master Craftsman',
    avatarEmoji: '📿',
    visualDescription: '68-year-old revered Himalayan master elder with gentle wise eyes, silver-grey beard, weather-lined face, wearing a traditional maroon and ochre woven wool robe with brass prayer beads around wrist.',
    frameOneAnchorSeed: 'Frame 1 atmospheric medium shot, silver-grey beard, authentic maroon wool robe, wise reflective gaze, warm volumetric lighting.',
    anchorToken: '[Subject-Anchor: FaceID_v4#GuruBa_9901]',
    tags: ['elder', 'artisan', 'monk', 'person'],
    voiceId: 'guru_elder_ne',
    defaultEmotion: 'neutral',
  },
  {
    id: 'sagar_host',
    name: 'Sagar (Tech Host & Anchor)',
    category: 'person',
    roleOrType: 'Broadcaster / Host',
    avatarEmoji: '🎙️',
    visualDescription: '32-year-old articulate Nepali tech broadcaster with neat dark hair, wearing a deep navy studio polo shirt with silver professional broadcast headphones resting around his neck.',
    frameOneAnchorSeed: 'Frame 1 broadcast close-up, navy polo shirt, silver studio headphones, neat parted hair, studio softbox illumination.',
    anchorToken: '[Subject-Anchor: FaceID_v4#Sagar_4410]',
    tags: ['host', 'broadcaster', 'person'],
    voiceId: 'sagar_pure_ne',
    defaultEmotion: 'neutral',
  },

  // --- VEHICLES (Bus, 4x4 Jeep, River Raft, Bike) ---
  {
    id: 'sajha_bus',
    name: 'Sajha Yatayat Green Eco-Bus',
    category: 'vehicle',
    roleOrType: 'Public Transit / Iconic City Bus',
    avatarEmoji: '🚌',
    visualDescription: 'Iconic Nepali Sajha Yatayat green and cream public passenger bus, registration BA 2 KHA 8840, chrome front bumper, bold green body with crisp white and cream side stripes, high-visibility LED destination board on windshield, polished reflective windows.',
    frameOneAnchorSeed: 'Frame 1 frontal three-quarter vehicle shot, distinctive two-tone green and cream livery, chrome bumper, crisp front LED display, realistic metallic reflections.',
    anchorToken: '[Subject-Anchor: VehicleLock_v3#SajhaBus_0488]',
    tags: ['bus', 'vehicle', 'transit', 'sajha', 'kathmandu'],
  },
  {
    id: 'mountain_jeep',
    name: 'Himalayan 4x4 Expedition Jeep',
    category: 'vehicle',
    roleOrType: 'Off-Road Alpine Vehicle',
    avatarEmoji: '🚙',
    visualDescription: 'Rugged matte olive-green Mahindra 4x4 mountain expedition jeep, roof-mounted heavy-duty tubular luggage rack packed with waterproof duffel bags and recovery tracks, aggressive all-terrain mud tires with light dust patina, dual yellow fog lights on heavy steel front bullbar.',
    frameOneAnchorSeed: 'Frame 1 dynamic 3/4 low angle, matte olive-green body, loaded roof expedition rack, dual amber fog lights on bullbar.',
    anchorToken: '[Subject-Anchor: VehicleLock_v3#ExpeditionJeep_5120]',
    tags: ['jeep', 'vehicle', '4x4', 'mountain', 'offroad'],
  },
  {
    id: 'trishuli_raft',
    name: 'Trishuli Rapid River Raft',
    category: 'vehicle',
    roleOrType: 'White-Water Raft',
    avatarEmoji: '🛶',
    visualDescription: 'Heavy-duty 14-foot self-bailing bright canary-yellow river expedition raft with royal blue perimeter safety rub-rails, rigged blue composite guide oars, black perimeter grab-lines.',
    frameOneAnchorSeed: 'Frame 1 water-level tracking angle, bright yellow inflatable chambers, royal blue rub-rails, water droplets glistening on PVC surface.',
    anchorToken: '[Subject-Anchor: VehicleLock_v3#RiverRaft_9044]',
    tags: ['raft', 'boat', 'vehicle', 'river', 'water'],
  },
  {
    id: 'vintage_bike',
    name: 'Himalayan Royal Enfield Classic',
    category: 'vehicle',
    roleOrType: 'Classic Motorcycle',
    avatarEmoji: '🏍️',
    visualDescription: 'Stealth matte-black Royal Enfield Classic 350 motorcycle, polished chrome exhaust header pipe, tan distressed-leather saddle and side pannier bags, round vintage glass headlamp with amber halo.',
    frameOneAnchorSeed: 'Frame 1 beauty angle, matte black fuel tank, chrome engine casing, tan leather saddlebags, realistic metallic specular highlights.',
    anchorToken: '[Subject-Anchor: VehicleLock_v3#EnfieldBike_1289]',
    tags: ['motorcycle', 'bike', 'vehicle', 'classic'],
  },

  // --- PLACES & ENVIRONMENTS (Village, House, River, Lake) ---
  {
    id: 'namche_village',
    name: 'Namche Bazaar Alpine Village',
    category: 'environment',
    roleOrType: 'Himalayan Mountain Village',
    avatarEmoji: '🏘️',
    visualDescription: 'Iconic horseshoe-shaped amphitheater mountain village of Namche Bazaar (3,440m), tiers of traditional stone Sherpa lodges with vibrant emerald green and azure blue tin roofs, winding flagstone staircases, snow-capped Kongde Ri mountain summit towering in the clear sky backdrop.',
    frameOneAnchorSeed: 'Frame 1 establishing aerial angle, characteristic horseshoe bowl layout, colorful green and blue lodge roofs, stone pathways, majestic snow peak background.',
    anchorToken: '[Subject-Anchor: EnvLock_v2#NamcheVillage_7701]',
    tags: ['village', 'namche', 'environment', 'mountain', 'himalaya'],
  },
  {
    id: 'newari_house',
    name: 'Traditional Newari Brick Courtyard House',
    category: 'environment',
    roleOrType: 'Historic Architecture & Residence',
    avatarEmoji: '🏠',
    visualDescription: '3-story historic Newari brick residential courtyard house (Baha) in Patan, exposed hand-fired red terracotta dachi appa bricks, deeply carved black sal-wood latticed windows (Aakhijhyal), sloping clay tile roof with brass rooftop finial, heavy wooden double doors with brass lion knockers.',
    frameOneAnchorSeed: 'Frame 1 architectural courtyard perspective, terracotta brick texture, intricately carved black timber Aakhijhyal windows, authentic sloped tile eaves.',
    anchorToken: '[Subject-Anchor: ArchLock_v2#NewariHouse_4210]',
    tags: ['house', 'courtyard', 'architecture', 'newari', 'heritage', 'patan'],
  },
  {
    id: 'sacred_river',
    name: 'Trishuli / Seti Glacial Mountain River',
    category: 'environment',
    roleOrType: 'Glacial Alpine River & Canyon',
    avatarEmoji: '🌊',
    visualDescription: 'Rushing crystal-clear turquoise and emerald glacial alpine river cutting through a dramatic deep slate canyon, smooth water-sculpted white and grey granite boulders, frothing white-water rapids, early morning mountain mist hovering just above the water surface.',
    frameOneAnchorSeed: 'Frame 1 low riverbank angle, turquoise rushing water over grey granite boulders, morning mist rising over current, razor-sharp water refraction.',
    anchorToken: '[Subject-Anchor: EnvLock_v2#GlacialRiver_6633]',
    tags: ['river', 'water', 'environment', 'rapids', 'nature'],
  },
  {
    id: 'phewa_lake',
    name: 'Phewa Lake & Machhapuchhre Vista',
    category: 'environment',
    roleOrType: 'Lakeside Landscape',
    avatarEmoji: '🏞️',
    visualDescription: 'Serene glassy emerald waters of Phewa Lake in Pokhara at calm morning hour, a cluster of brightly painted red, blue, and yellow traditional wooden boats (doonga) anchored near the shore, mirrored reflection of the sacred double-peaked Machhapuchhre (Fishtail) mountain on the water surface.',
    frameOneAnchorSeed: 'Frame 1 shore perspective, colorful wooden rowboats in foreground, glass-calm lake reflection of Fishtail peak in background.',
    anchorToken: '[Subject-Anchor: EnvLock_v2#PhewaLake_8819]',
    tags: ['lake', 'pokhara', 'environment', 'mountain', 'landscape'],
  },

  // --- ANIMALS & WILDLIFE (Danfe, Snow Leopard, Yak, Dog) ---
  {
    id: 'danfe_monal',
    name: 'Himalayan Danfe (Impeyan Monal)',
    category: 'animal',
    roleOrType: 'National Bird / Wildlife',
    avatarEmoji: '🦚',
    visualDescription: 'Stunning male Himalayan Monal (Danfe) bird perched on a mossy rhododendron branch, iridescent metallic emerald-green head with erect wire-crested feathers, iridescent royal-purple back, copper-red neck, rich golden-amber tail feathers, glistening in alpine morning sun.',
    frameOneAnchorSeed: 'Frame 1 macro wildlife portrait, shimmering metallic green crest, iridescent plumage with subsurface specular shine, natural mossy wood perch.',
    anchorToken: '[Subject-Anchor: CreatureLock_v3#DanfeMonal_1109]',
    tags: ['animal', 'bird', 'danfe', 'wildlife', 'himalayan'],
  },
  {
    id: 'snow_leopard',
    name: 'Himalayan Snow Leopard (Ghost of the Mountains)',
    category: 'animal',
    roleOrType: 'Apex Alpine Predator',
    avatarEmoji: '🐆',
    visualDescription: 'Majestic adult Himalayan Snow Leopard crouched gracefully on a sheer grey granite cliff ledge, thick plush smoky grey-white fur densely patterned with dark charcoal rosettes, extraordinarily long thick ringed tail curled beside it, piercing pale jade-green eyes surveying the valley.',
    frameOneAnchorSeed: 'Frame 1 intense eye-contact portrait, dense smoky-grey rosette coat, piercing jade-green eyes, sharp cliff ledge framing.',
    anchorToken: '[Subject-Anchor: CreatureLock_v3#SnowLeopard_9432]',
    tags: ['animal', 'snow leopard', 'wildlife', 'predator', 'mountain'],
  },
  {
    id: 'mountain_yak',
    name: 'High-Altitude Himalayan Yak',
    category: 'animal',
    roleOrType: 'Alpine Pack Animal & Icon',
    avatarEmoji: '🐂',
    visualDescription: 'Magnificent adult Himalayan domestic yak standing in snow, dense shaggy dark espresso and cream wool coat sweeping near the ground, large sweeping black horns with ivory tips, adorned with a traditional hand-woven red wool collar with a resonant brass bell.',
    frameOneAnchorSeed: 'Frame 1 front three-quarter profile, long shaggy wool coat, sweeping horns, red embroidered bell collar, snowy ground.',
    anchorToken: '[Subject-Anchor: CreatureLock_v3#HimalayanYak_7221]',
    tags: ['animal', 'yak', 'wildlife', 'himalaya'],
  },
  {
    id: 'street_dog',
    name: 'Bhotia Mountain Sheepdog',
    category: 'animal',
    roleOrType: 'Friendly Companion Animal',
    avatarEmoji: '🐕',
    visualDescription: 'Fluffy warm-fawn and cream Himalayan mountain dog (Bhotia) with alert upright black-tipped ears, thick weather-resistant double coat, curly plume tail, warm friendly amber eyes, sitting comfortably on sun-warmed stone flags.',
    frameOneAnchorSeed: 'Frame 1 eye-level companion angle, fluffy fawn double coat, alert expressive eyes, curly plume tail, stone patio setting.',
    anchorToken: '[Subject-Anchor: CreatureLock_v3#BhotiaDog_3301]',
    tags: ['animal', 'dog', 'pet', 'companion'],
  },
];

export const CHARACTER_DNA_LIST: CharacterDNA[] = SUBJECT_LOCK_REGISTRY.filter(s => s.category === 'person');

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
        recommendedDuration: 5,
      },
      {
        id: 'cam_guest_mcu',
        title: 'Cam 3: Guest / Co-Host Close-Up (Maya)',
        badge: '👩 Co-Host Close-Up',
        framing: 'Medium Close-Up (MCU)',
        subtitle: 'Co-host listening attentively, smiling and nodding into microphone',
        prompt: 'Medium close-up camera shot in modern podcast studio with warm oak acoustic panels. Maya, an articulate 25-year-old Nepali woman, listens attentively, smiles, and responds warmly into her studio boom microphone, soft warm rim light, 4k.',
        recommendedDuration: 5,
      },
      {
        id: 'cam_ots_perspective',
        title: 'Cam 4: Over-the-Shoulder (OTS Perspective)',
        badge: '🔄 Over-The-Shoulder',
        framing: 'Over-the-Shoulder Dynamic',
        subtitle: 'Looking past host shoulder towards guest speaking across the desk',
        prompt: 'Over-the-shoulder camera shot in modern broadcast podcast studio, looking past the male host’s shoulder towards the female guest speaking across the walnut desk, shallow depth of field, professional studio depth, 4k broadcast television.',
        recommendedDuration: 5,
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
        recommendedDuration: 5,
      },
      {
        id: 'tech_speaker_b',
        title: 'Cam 3: Product Lead Reaction',
        badge: '👩 Product Lead',
        framing: 'Medium Reaction',
        subtitle: 'Nodding thoughtfully and adding strategic commentary',
        prompt: 'Medium close-up of a tech product director nodding thoughtfully and smiling while looking at a tablet on desk, magenta neon studio bokeh, 4k photorealistic.',
        recommendedDuration: 5,
      },
    ],
  },
];

export const NARRATIVE_STORYBOARDS: NarrativeStoryboardPack[] = [
  // ==========================================
  // 1. THE MOUNTAIN MESSENGER: 7-CLIP SHORT MOVIE (100% SUBJECT LOCK)
  // ==========================================
  {
    id: 'mountain_messenger_movie',
    title: 'The Mountain Messenger (7-Clip Short Movie)',
    badge: '🎬 7-Clip Short Movie',
    category: 'movie',
    aspectRatio: '16:9',
    characterId: 'aarav_boy',
    subjectLockId: 'aarav_boy',
    clipCount: 7,
    totalEstimatedDuration: 45,
    visualStyle: '35mm anamorphic cinema, continuous golden-to-dusk light progression, photorealistic Arri Alexa LF color grading.',
    description: 'A complete 7-clip short film following mountain guide Aarav on a vital journey across Himalayan landscapes with 100% character and vehicle lock across all frames.',
    scenes: [
      {
        id: 'mm_scene_1',
        sceneNumber: 1,
        title: 'Scene 1: Departure at Dawn (Frame 1 Lock)',
        framing: 'Medium Establishing Shot',
        prompt: '[Subject-Anchor: FaceID_v4#Aarav_8841] Aarav, 28-year-old Nepali guide in ochre-yellow alpine jacket, steps out from an ancient doorway into misty morning light, tightening backpack straps with determined focus, 4k 35mm film.',
        recommendedDuration: 5,
        subtitleEn: 'At dawn, Aarav begins the critical expedition to the high sanctuary.',
        subtitleNe: 'बिहानीको उज्यालोसँगै आरभले हिमाली यात्राको पहिलो पाइला चाल्यो।',
        characterId: 'aarav_boy',
        subjectLockId: 'aarav_boy',
        continuationNote: 'Frame 1 locks Aarav in ochre jacket stepping forward.',
      },
      {
        id: 'mm_scene_2',
        sceneNumber: 2,
        title: 'Scene 2: Green Sajha Bus Transit (Vehicle Lock)',
        framing: 'Dynamic Tracking Profile',
        prompt: '[Subject-Anchor: VehicleLock_v3#SajhaBus_0488] The iconic green and cream Sajha Yatayat bus drives smoothly along a curving mountain highway flanked by pine trees and morning mist, sun glinting off the polished windows, 4k.',
        recommendedDuration: 5,
        subtitleEn: 'The valley transit bus winds through the mountain passes.',
        subtitleNe: 'हरियो साझा बस पहाडी मोडहरू पार गर्दै अगाडि बढ्छ।',
        subjectLockId: 'sajha_bus',
        continuationNote: 'Connects departure to transit with locked green bus.',
      },
      {
        id: 'mm_scene_3',
        sceneNumber: 3,
        title: 'Scene 3: Glacial River Suspension Crossing',
        framing: 'Wide Cinematic Sweep',
        prompt: '[Subject-Anchor: FaceID_v4#Aarav_8841] [Subject-Anchor: EnvLock_v2#GlacialRiver_6633] Aarav in his ochre jacket walks steadily across a swaying steel suspension bridge high above rushing turquoise rapids of the glacial river, prayer flags fluttering in wind, 4k.',
        recommendedDuration: 8,
        subtitleEn: 'Suspended high above the glacial waters, the bridge sways in the mountain wind.',
        subtitleNe: 'गहिरो नदीमाथि झोलुङ्गे पुलमा आरभ सावधानीपूर्वक अघि बढ्छ।',
        characterId: 'aarav_boy',
        subjectLockId: 'sacred_river',
        continuationNote: 'Frame 1 matches Aarav walking onto bridge over turquoise river.',
      },
      {
        id: 'mm_scene_4',
        sceneNumber: 4,
        title: 'Scene 4: Arrival at Namche Village (Env Lock)',
        framing: 'Establishing Low-to-High Pan',
        prompt: '[Subject-Anchor: FaceID_v4#Aarav_8841] [Subject-Anchor: EnvLock_v2#NamcheVillage_7701] Aarav arrives at stone entrance stairs of Namche Bazaar village, looking up at amphitheater of green and blue tin roofs with snowy peaks in backdrop, 4k.',
        recommendedDuration: 5,
        subtitleEn: 'Reaching the stone alleys of Namche Bazaar beneath the soaring peaks.',
        subtitleNe: 'हिउँचुलीहरूको काखमा रहेको नाम्चे बजारको प्रवेशद्वारमा आरभ आइपुग्छ।',
        characterId: 'aarav_boy',
        subjectLockId: 'namche_village',
        continuationNote: 'Frame 1 locks Namche village architecture and Aarav look.',
      },
      {
        id: 'mm_scene_5',
        sceneNumber: 5,
        title: 'Scene 5: Yak Caravan Encounter (Animal Lock)',
        framing: 'Medium Over-Shoulder Shot',
        prompt: '[Subject-Anchor: FaceID_v4#Aarav_8841] [Subject-Anchor: CreatureLock_v3#HimalayanYak_7221] Aarav steps aside respectfully along the trail as a shaggy Himalayan yak with red bell collar passes by, bells clanging gently in crisp alpine air, 4k.',
        recommendedDuration: 5,
        subtitleEn: 'A shaggy alpine yak caravan treads the ancient stone trade trail.',
        subtitleNe: 'घण्टीको मीठो आवाजसँगै चौंरी गाईहरूको ताँती बाटो काट्छ।',
        characterId: 'aarav_boy',
        subjectLockId: 'mountain_yak',
        continuationNote: 'Frame 1 connects trail progression with locked yak subject.',
      },
      {
        id: 'mm_scene_6',
        sceneNumber: 6,
        title: 'Scene 6: Monastery Courtyard & Prayer Wheels',
        framing: 'Slow Tracking Medium Shot',
        prompt: '[Subject-Anchor: FaceID_v4#Aarav_8841] Inside cliffside monastery courtyard at golden hour, Aarav in his ochre jacket gently spins polished bronze prayer wheels as warm amber dust filters through wooden eaves, 4k.',
        recommendedDuration: 5,
        subtitleEn: 'Spinning the weathered bronze prayer wheels in silent contemplation.',
        subtitleNe: 'गुम्बाको शान्त प्राङ्गणमा माने घुमाउँदै आरभले प्रार्थना गर्छ।',
        characterId: 'aarav_boy',
        subjectLockId: 'aarav_boy',
        continuationNote: 'Frame 1 maintains Aarav facial profile and jacket texture.',
      },
      {
        id: 'mm_scene_7',
        sceneNumber: 7,
        title: 'Scene 7: High Ridge Summit Climax (14s Master)',
        framing: 'Epic Slow-Motion Aerial Sweep',
        prompt: '[Subject-Anchor: FaceID_v4#Aarav_8841] Epic cinematic slow-motion drone flyover soaring around Aarav standing atop high snowy mountain ridge at sunset, arms outstretched towards blazing orange sky and radiant Everest summit, 8k photorealistic.',
        recommendedDuration: 14,
        subtitleEn: 'Standing at the world’s summit, the messenger delivers his promise to the mountains.',
        subtitleNe: 'हिमालको सर्वोच्च उचाइमा उभिएर आरभले आफ्नो संकल्प पूरा गर्छ।',
        characterId: 'aarav_boy',
        subjectLockId: 'aarav_boy',
        continuationNote: 'Climax 14-second extended sequence ending the short movie.',
      },
    ],
  },

  // ==========================================
  // 2. KATHMANDU TO EVEREST EXPEDITION: 7-CLIP TRAVEL FEATURE
  // ==========================================
  {
    id: 'kathmandu_to_everest_expedition',
    title: 'Kathmandu to Everest: The Journey (7-Clip Feature)',
    badge: '🏔️ 7-Clip Travel Feature',
    category: 'documentary',
    aspectRatio: '16:9',
    characterId: 'maya_girl',
    subjectLockId: 'maya_girl',
    clipCount: 7,
    totalEstimatedDuration: 50,
    visualStyle: 'National Geographic 4K documentary style, crisp volumetric sunlight, natural ambient audio pacing.',
    description: 'An immersive 7-clip travel documentary journey starting from Patan heritage courtyard to Lukla, suspension bridges, Namche, and Everest base ridge.',
    scenes: [
      {
        id: 'ke_scene_1',
        sceneNumber: 1,
        title: 'Clip 1: Newari Heritage Courtyard (Arch Lock)',
        framing: 'Slow Push-In Medium Shot',
        prompt: '[Subject-Anchor: FaceID_v4#Maya_0192] [Subject-Anchor: ArchLock_v2#NewariHouse_4210] Maya, 25-year-old Nepali woman in indigo linen top, examines map in red brick Patan courtyard with carved black Aakhijhyal windows, morning sunbeams, 4k.',
        recommendedDuration: 5,
        subtitleEn: 'The expedition begins in the ancient brick courtyards of Patan.',
        subtitleNe: 'पाटनको ऐतिहासिक प्राङ्गणबाट सगरमाथा यात्राको योजना बन्छ।',
        characterId: 'maya_girl',
        subjectLockId: 'newari_house',
      },
      {
        id: 'ke_scene_2',
        sceneNumber: 2,
        title: 'Clip 2: Mountain Flight Over Cloud Sea',
        framing: 'Aerial Window Perspective',
        prompt: 'Cinematic aerial view from twin-otter aircraft flying above vast sea of white clouds, jagged snow-covered Himalayan peaks jutting into brilliant cobalt blue sky, 4k.',
        recommendedDuration: 5,
        subtitleEn: 'Soaring above the cloud sea towards the Himalayan airstrip.',
        subtitleNe: 'बादलको सागरमाथि उड्दै जहाज हिमाली विमानस्थलतर्फ बढ्छ।',
      },
      {
        id: 'ke_scene_3',
        sceneNumber: 3,
        title: 'Clip 3: Danfe Monal on Alpine Pine (Bird Lock)',
        framing: 'Macro Telephoto Wildlife',
        prompt: '[Subject-Anchor: CreatureLock_v3#DanfeMonal_1109] Iridescent male Himalayan Danfe with shimmering emerald crest perches on lichen-covered pine branch in misty mountain forest, turning head with alert grace, 4k.',
        recommendedDuration: 5,
        subtitleEn: 'The iridescent Danfe greets travelers in the mountain pine forests.',
        subtitleNe: 'सल्लाको वनमा राष्ट्रिय चरा डाँफेको मनमोहक रङ्ग देखिन्छ।',
        subjectLockId: 'danfe_monal',
      },
      {
        id: 'ke_scene_4',
        sceneNumber: 4,
        title: 'Clip 4: Turquoise Glacial River Rapids',
        framing: 'Low-Angle Water Tracking',
        prompt: '[Subject-Anchor: EnvLock_v2#GlacialRiver_6633] Crystal-clear turquoise rapids of the rushing Himalayan river cascade over white granite boulders, crisp water spray catching sunlight, 4k.',
        recommendedDuration: 5,
        subtitleEn: 'Glacial waters thunder through deep Himalayan river valleys.',
        subtitleNe: 'हिमनदीको कञ्चन पानी ढुङ्गाहरूमा छचल्किँदै बग्दछ।',
        subjectLockId: 'sacred_river',
      },
      {
        id: 'ke_scene_5',
        sceneNumber: 5,
        title: 'Clip 5: Namche Bazaar Step Ascent',
        framing: 'Medium Profile Walk',
        prompt: '[Subject-Anchor: FaceID_v4#Maya_0192] [Subject-Anchor: EnvLock_v2#NamcheVillage_7701] Maya smiling enthusiastically as she walks up stone steps of Namche Bazaar, colorful blue-roof lodges and prayer flags around her, 4k.',
        recommendedDuration: 8,
        subtitleEn: 'Ascending the stepped pathways of the mountain capital.',
        subtitleNe: 'नाम्चे बजारको उकालोमा मायाको उत्साही पाइला।',
        characterId: 'maya_girl',
        subjectLockId: 'namche_village',
      },
      {
        id: 'ke_scene_6',
        sceneNumber: 6,
        title: 'Clip 6: Snow Leopard Gaze on Ridge (Animal Lock)',
        framing: 'Dramatic Telephoto Wildlife Shot',
        prompt: '[Subject-Anchor: CreatureLock_v3#SnowLeopard_9432] Rare Himalayan Snow Leopard perched on rocky high ridge, thick rosette coat blowing in wind, gazing across misty valley with jade eyes, 4k cinematic.',
        recommendedDuration: 8,
        subtitleEn: 'High above the snowline, the elusive mountain leopard watches in silence.',
        subtitleNe: 'हिउँको उच्च भागमा हिउँ चितुवाको शान्त र शक्तिशाली उपस्थिति।',
        subjectLockId: 'snow_leopard',
      },
      {
        id: 'ke_scene_7',
        sceneNumber: 7,
        title: 'Clip 7: Everest Base Ridge Sunset (15s Extended)',
        framing: 'Panoramic Ultra-Wide 360 Drone',
        prompt: '[Subject-Anchor: FaceID_v4#Maya_0192] Maya standing on high viewpoint at sunset with Mount Everest, Lhotse, and Nuptse illuminated in brilliant golden-pink alpenglow, majestic 8k 15-second cinematic reveal.',
        recommendedDuration: 15,
        subtitleEn: 'The journey culminates in front of Everest’s timeless sunset crown.',
        subtitleNe: 'सूर्यास्तको सुनौलो प्रकाशमा सगरमाथाको अद्भूत दृश्यसँगै यात्राको पूर्णता।',
        characterId: 'maya_girl',
      },
    ],
  },

  // ==========================================
  // 3. GREEN SAJHA BUS CITY REEL: 6-CLIP VIRAL AD / SHOTS
  // ==========================================
  {
    id: 'sajha_bus_city_reel',
    title: 'Iconic Sajha Bus: Kathmandu Journey (6-Clip Reel / Ad)',
    badge: '⚡ 6-Clip Commercial Reel',
    category: 'commercial',
    aspectRatio: '9:16',
    characterId: 'priya_girl',
    subjectLockId: 'sajha_bus',
    clipCount: 6,
    totalEstimatedDuration: 30,
    visualStyle: 'Vertical 9:16 high-energy commercial color grading, punchy transitions, dynamic motion blur.',
    description: 'A 6-clip commercial reel starring the iconic Green Sajha Bus and passenger Priya touring Kathmandu landmarks.',
    scenes: [
      {
        id: 'sb_clip_1',
        sceneNumber: 1,
        title: 'Clip 1: Hook - Door Open at Sunrise',
        framing: 'Fast Push-In Close-Up',
        prompt: '[Subject-Anchor: VehicleLock_v3#SajhaBus_0488] Vertical 9:16 shot of polished green Sajha Bus automatic doors gliding open at golden sunrise, morning light reflecting on chrome handrails, 4k 60fps.',
        recommendedDuration: 4,
        subtitleEn: 'Every great Kathmandu morning begins with Sajha.',
        subtitleNe: 'काठमाडौँको प्रत्येक बिहानीको सुन्दर सुरुवात।',
        subjectLockId: 'sajha_bus',
      },
      {
        id: 'sb_clip_2',
        sceneNumber: 2,
        title: 'Clip 2: Priya Passenger Boarding (Girl Lock)',
        framing: 'Medium Profile Action',
        prompt: '[Subject-Anchor: FaceID_v4#Priya_3319] [Subject-Anchor: VehicleLock_v3#SajhaBus_0488] Vertical 9:16 shot of Priya, 22yo Nepali girl with Dhaka scarf, smiling warmly as she taps smart travel card on bus digital reader, 4k.',
        recommendedDuration: 4,
        subtitleEn: 'Seamless travel connecting students and creators across the valley.',
        subtitleNe: 'स्मार्ट कार्ड ट्यापसँगै सुरक्षित र सहज यात्रा।',
        characterId: 'priya_girl',
        subjectLockId: 'sajha_bus',
      },
      {
        id: 'sb_clip_3',
        sceneNumber: 3,
        title: 'Clip 3: Patan Durbar Square Glide-By',
        framing: 'Wide Street Tracking Shot',
        prompt: '[Subject-Anchor: VehicleLock_v3#SajhaBus_0488] Vertical 9:16 tracking shot of the sleek green Sajha bus cruising past historic ancient temples of Patan Durbar Square, pigeons fluttering, 4k.',
        recommendedDuration: 5,
        subtitleEn: 'Gliding past timeless Newari architectural wonders.',
        subtitleNe: 'ऐतिहासिक सम्पदाहरूलाई जोड्दै अघि बढ्दै।',
        subjectLockId: 'sajha_bus',
      },
      {
        id: 'sb_clip_4',
        sceneNumber: 4,
        title: 'Clip 4: River Bridge Crossing (River Lock)',
        framing: 'Drone Down-Angle Tracking',
        prompt: '[Subject-Anchor: VehicleLock_v3#SajhaBus_0488] [Subject-Anchor: EnvLock_v2#GlacialRiver_6633] Vertical 9:16 high-angle aerial view of the green Sajha bus crossing the wide river bridge with city skyline in distance, 4k.',
        recommendedDuration: 5,
        subtitleEn: 'Crossing the river bridges in eco-friendly comfort.',
        subtitleNe: 'नदीको पुल पार गर्दै हरित यात्राको सन्देश।',
        subjectLockId: 'sajha_bus',
      },
      {
        id: 'sb_clip_5',
        sceneNumber: 5,
        title: 'Clip 5: Window View & City Lights',
        framing: 'Atmospheric Medium Close-Up',
        prompt: '[Subject-Anchor: FaceID_v4#Priya_3319] Vertical 9:16 over-the-shoulder shot of Priya looking out large clean bus window as twilight city neon lights illuminate outside, serene smile, 4k.',
        recommendedDuration: 4,
        subtitleEn: 'Sit back, relax, and watch the city come alive.',
        subtitleNe: 'झ्यालबाट देखिने काठमाडौँको साँझको रमणीय दृश्य।',
        characterId: 'priya_girl',
      },
      {
        id: 'sb_clip_6',
        sceneNumber: 6,
        title: 'Clip 6: CTA - Modern Terminal (8s Climax)',
        framing: 'Centered Hero Brand Shot',
        prompt: '[Subject-Anchor: VehicleLock_v3#SajhaBus_0488] Vertical 9:16 hero shot of the gleaming green Sajha bus parked at modern terminal with glowing NepalAI Studio 3D motion graphics overlay, 4k commercial.',
        recommendedDuration: 8,
        subtitleEn: 'Move forward with smart green mobility. Ride Sajha today!',
        subtitleNe: 'स्मार्ट र हरित यात्राको हिस्सा बन्नुहोस्। साझा रोज्नुहोस्!',
        subjectLockId: 'sajha_bus',
      },
    ],
  },

  // ==========================================
  // 4. HIMALAYAN PURE SPRING: 6-CLIP TV ADVERTISEMENT
  // ==========================================
  {
    id: 'himalayan_spring_ad',
    title: 'Himalayan Spring: 30s Brand Commercial (6-Clip Ad)',
    badge: '📺 6-Clip TV Commercial',
    category: 'commercial',
    aspectRatio: '16:9',
    characterId: 'rohit_boy',
    subjectLockId: 'sacred_river',
    clipCount: 6,
    totalEstimatedDuration: 30,
    visualStyle: 'High-end TV commercial aesthetic, macro liquid dynamics, crisp studio product lighting.',
    description: 'A 6-clip structured commercial (Hook -> Glacial Source -> Purity -> Packaging -> Lifestyle -> Call to Action).',
    scenes: [
      {
        id: 'hsa_clip_1',
        sceneNumber: 1,
        title: 'Clip 1: Glacial Glacier Reveal',
        framing: 'Cinematic High Drone Sweep',
        prompt: 'Cinematic wide 16:9 shot of pure blue Himalayan glacier ice glowing under bright morning sun, crystal drops melting into pristine pool, 4k commercial.',
        recommendedDuration: 4,
        subtitleEn: 'Born from the pure untouched heights of the Himalayas.',
        subtitleNe: 'सगरमाथाको काखबाट सुरु भएको शुद्धताको मुहान।',
      },
      {
        id: 'hsa_clip_2',
        sceneNumber: 2,
        title: 'Clip 2: Mountain River Rushing',
        framing: 'Macro Water Dynamics',
        prompt: '[Subject-Anchor: EnvLock_v2#GlacialRiver_6633] Macro slow-motion 120fps camera tracking crystal water splashing over smooth granite river stones in sparkling daylight, 4k.',
        recommendedDuration: 4,
        subtitleEn: 'Naturally filtered through ancient mineral stone.',
        subtitleNe: 'प्राकृतिक खनिज ढुङ्गाहरूबाट छानिएको शुद्ध जल।',
        subjectLockId: 'sacred_river',
      },
      {
        id: 'hsa_clip_3',
        sceneNumber: 3,
        title: 'Clip 3: Glass Bottle Product Hero',
        framing: 'Studio Lighting Turntable',
        prompt: 'Luxury frosted glass water bottle with embossed silver Himalayan peak logo rotating on sleek dark surface with ice cubes and condensation droplets, 4k commercial.',
        recommendedDuration: 5,
        subtitleEn: 'Crafted in eco-friendly luxury glass.',
        subtitleNe: 'पर्यावरणमैत्री प्रिमियम सिसाको बोतलमा सुरक्षित।',
      },
      {
        id: 'hsa_clip_4',
        sceneNumber: 4,
        title: 'Clip 4: Rohit Refreshment Drink (Boy Lock)',
        framing: 'Dynamic Lifestyle MCU',
        prompt: '[Subject-Anchor: FaceID_v4#Rohit_7712] Rohit, 20yo Nepali youth in denim jacket, takes a refreshing sip from the glass bottle, sighing with genuine satisfaction in sunlit city park, 4k.',
        recommendedDuration: 5,
        subtitleEn: 'Pure vitality for every active moment.',
        subtitleNe: 'प्रत्येक पलमा ताजगी र नयाँ ऊर्जा।',
        characterId: 'rohit_boy',
      },
      {
        id: 'hsa_clip_5',
        sceneNumber: 5,
        title: 'Clip 5: Lakeside Serenity (Lake Lock)',
        framing: 'Wide Scenic Horizon',
        prompt: '[Subject-Anchor: EnvLock_v2#PhewaLake_8819] Beautiful serene shot of Phewa Lake at sunset with colorful boats and Fishtail mountain reflection, pristine calmness, 4k.',
        recommendedDuration: 4,
        subtitleEn: 'The true taste of Himalayan serenity.',
        subtitleNe: 'हिमालको अनुपम शान्ति र मिठास।',
        subjectLockId: 'phewa_lake',
      },
      {
        id: 'hsa_clip_6',
        sceneNumber: 6,
        title: 'Clip 6: CTA Hero Brand Lock (8s Finale)',
        framing: 'Centered Billboard Lock',
        prompt: 'Crisp commercial product line-up on mountain terrace with animated 3D golden typography "Pure Himalaya - Taste the Summit", 8k 60fps TV commercial.',
        recommendedDuration: 8,
        subtitleEn: 'Pure Himalaya. Taste the summit. Available nationwide.',
        subtitleNe: 'प्योर हिमालया। चुलीको शुद्धता। आजै किन्नुहोस्!',
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
    defaultDuration: '12',
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
    id: 'preset_cinematic_drama_12s',
    title: 'Extended Cinematic Master (16:9 • 12s Sora)',
    badge: '🍿 12s Sora Master',
    formatCategory: 'movie',
    aspectRatio: '16:9',
    resolution: '1280x720',
    defaultDuration: '12',
    samplePrompt: 'Extended 12-second cinematic 35mm film continuous tracking shot following an alpine explorer stepping out on a cliff summit as morning sunrise paints the peaks in gold, fluid camera motion, 4k.',
    subtitle: 'Full 12-second extended Sora-2 cinematic shot with maximum narrative arc.',
    pacingNote: 'Rich narrative progression with sustained character & environment fidelity.',
  },
];
