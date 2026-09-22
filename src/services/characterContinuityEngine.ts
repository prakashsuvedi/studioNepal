/**
 * NepalAI Studio - Sequential Character Continuity & Multi-Scene Evolution Engine
 * 
 * Mathematical, Logical, and Engineering System for:
 * 1. Dynamic character extraction & identity locking from Scene 1 prompt (no forced default character).
 * 2. Sequential character carrying & resolution across Scene 2, Scene 3, Scene N.
 * 3. Dynamic multi-character registry: introducing new characters on Scene 2/3 while preserving previous locks.
 * 4. Latent frame-to-frame narrative continuity & intelligent "Continue Scene" prompt prediction.
 */

export interface ContinuityKeyword {
  id: string;
  keyword: string;
  category: 'lighting' | 'optics' | 'wardrobe' | 'facial' | 'environment' | 'style';
  source: 'scene1_prompt' | 'character_dna' | 'custom';
  enabled: boolean;
  confidence: number;
}

export interface DynamicCharacterIdentity {
  id: string;
  name: string;
  roleOrArchetype: string;
  avatarEmoji: string;
  visualDescription: string;
  frameOneAnchorSeed: string;
  anchorToken: string;
  originSceneIndex: number; // 1 for Scene 1, 2 for Scene 2, etc.
  isLocked: boolean;
  referenceImage?: string;
  snapshotBase64?: string;
  snapshotTimestamp?: string;
  snapshotSceneIndex?: number;
  attire: string;
  hair?: string;
  eyes?: string;
  clothing?: string;
  facialFeatures?: string;
  physicalTraits: string;
  tags: string[];
}

export interface SequentialSceneNode {
  id: string;
  sceneIndex: number;
  title: string;
  userPrompt: string;
  constructedPrompt: string;
  activeCharacterIds: string[];
  duration: '4' | '8' | '12';
  framing: string;
  cameraMovement: string;
  lightingAtmosphere: string;
  exitLatentContext: string;
  videoUrl?: string;
  status: 'idle' | 'rendering' | 'completed' | 'error';
  subtitleEn: string;
  subtitleNe?: string;
  characterTokensInjected?: string[];
  continuityKeywordsApplied?: string[];
}

export interface ProjectContinuityState {
  projectId: string;
  characters: DynamicCharacterIdentity[];
  scenes: SequentialSceneNode[];
  worldTheme: string;
  visualStyle: string;
  aspectRatio: '16:9' | '9:16';
  lastExitLatentContext: string;
}

// Common archetypes and emoji mapping
const ARCHETYPE_MAP: Record<string, { emoji: string; defaultRole: string }> = {
  monk: { emoji: '🧘‍♂️', defaultRole: 'Spiritual Master / Monk' },
  priest: { emoji: '📿', defaultRole: 'Temple Priest' },
  sherpa: { emoji: '🏔️', defaultRole: 'Himalayan Sherpa Guide' },
  guide: { emoji: '🧭', defaultRole: 'Mountain Explorer & Guide' },
  girl: { emoji: '👧', defaultRole: 'Young Female Protagonist' },
  woman: { emoji: '👩', defaultRole: 'Female Protagonist' },
  boy: { emoji: '👦', defaultRole: 'Young Male Protagonist' },
  man: { emoji: '👨', defaultRole: 'Male Protagonist' },
  elder: { emoji: '👴', defaultRole: 'Venerable Elder' },
  cyborg: { emoji: '🦾', defaultRole: 'Cybernetic Tech Pioneer' },
  robot: { emoji: '🤖', defaultRole: 'Autonomous AI Construct' },
  traveler: { emoji: '🎒', defaultRole: 'Adventurer & Nomad' },
  photographer: { emoji: '📸', defaultRole: 'Visual Chronicler' },
  artisan: { emoji: '🎨', defaultRole: 'Master Craftsman' },
  tiger: { emoji: '🐅', defaultRole: 'Royal Bengal Tiger' },
  leopard: { emoji: '🐆', defaultRole: 'Snow Leopard' },
  eagle: { emoji: '🦅', defaultRole: 'Himalayan Golden Eagle' },
  merchant: { emoji: '🏮', defaultRole: 'Heritage Merchant' },
  doctor: { emoji: '🩺', defaultRole: 'Medical Pioneer' },
  warrior: { emoji: '⚔️', defaultRole: 'Ancient Guardian' },
};

/**
 * Generate a short deterministic hash for clean unique tokens
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).substring(0, 5).toUpperCase();
}

/**
 * Dynamically extract and synthesize character identities from a prompt.
 * Handles English, Nepali, or Romanized scripts without forcing predefined defaults.
 */
export function extractCharactersFromPrompt(
  prompt: string,
  sceneIndex: number = 1,
  existingRegistry: DynamicCharacterIdentity[] = []
): { extractedCharacter: DynamicCharacterIdentity | null; isNewCharacter: boolean } {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) return { extractedCharacter: null, isNewCharacter: false };

  const lower = cleanPrompt.toLowerCase();

  // 1. Check if the prompt explicitly matches an existing character already in registry
  for (const existing of existingRegistry) {
    const nameLower = existing.name.toLowerCase();
    const tagMatch = existing.tags.some(t => lower.includes(t.toLowerCase()));
    if (lower.includes(nameLower) || tagMatch || lower.includes(existing.roleOrArchetype.toLowerCase())) {
      return { extractedCharacter: existing, isNewCharacter: false };
    }
  }

  // 2. Detect character keywords or archetypes
  let detectedArchetype = 'person';
  let detectedEmoji = '👤';
  let detectedRole = 'Featured Character';

  for (const [keyword, meta] of Object.entries(ARCHETYPE_MAP)) {
    if (lower.includes(keyword)) {
      detectedArchetype = keyword;
      detectedEmoji = meta.emoji;
      detectedRole = meta.defaultRole;
      break;
    }
  }

  // 3. Extract proper name if specified (e.g., "named Maya", "Maya is walking", "an old monk named Tenzing", "Aarav")
  let characterName = '';
  const namedMatch = cleanPrompt.match(/(?:named|called|naame)\s+([A-Z][a-z]+)/i);
  if (namedMatch && namedMatch[1]) {
    characterName = namedMatch[1];
  } else {
    // Check if starts with a Capitalized Name (e.g. "Ananya walks along...")
    const startNameMatch = cleanPrompt.match(/^([A-Z][a-z]+)\b/);
    if (startNameMatch && !['A', 'An', 'The', 'In', 'On', 'At', 'When', 'Inside', 'Wide', 'Cinematic', 'Slow'].includes(startNameMatch[1])) {
      characterName = startNameMatch[1];
    }
  }

  if (!characterName) {
    characterName = `${detectedArchetype.charAt(0).toUpperCase() + detectedArchetype.slice(1)} ${sceneIndex > 1 ? `#${sceneIndex}` : ''}`.trim();
  }

  // 4. Extract Attire / Clothing descriptors
  const attireKeywords = ['wearing', 'dressed in', 'shawl', 'jacket', 'robe', 'sweater', 'kurta', 'suit', 'hoodie', 'scarf', 'turban', 'shirt', 'vest', 'coat', 'cloak', 'dress'];
  let detectedAttire = 'authentic character wardrobe with fine fabric textures and natural folds';
  for (const att of attireKeywords) {
    const idx = lower.indexOf(att);
    if (idx !== -1) {
      const snippet = cleanPrompt.slice(idx, idx + 80).split(/[.,;]/)[0];
      if (snippet) {
        detectedAttire = snippet.trim();
        break;
      }
    }
  }

  // 5. Extract Hair descriptors
  const hairKeywords = ['hair', 'beard', 'braid', 'bun', 'curls', 'locks', 'shaved', 'ponytail'];
  let detectedHair = 'natural dark textured hair with authentic styling';
  for (const hk of hairKeywords) {
    const idx = lower.indexOf(hk);
    if (idx !== -1) {
      const start = Math.max(0, idx - 25);
      const snippet = cleanPrompt.slice(start, idx + 40).split(/[.,;]/)[0];
      if (snippet) {
        detectedHair = snippet.trim();
        break;
      }
    }
  }

  // 6. Extract Eyes descriptors
  const eyeKeywords = ['eyes', 'gaze', 'amber eyes', 'brown eyes', 'dark eyes', 'hazel eyes', 'black eyes'];
  let detectedEyes = 'expressive dark brown almond eyes, sharp optical focus';
  for (const ek of eyeKeywords) {
    const idx = lower.indexOf(ek);
    if (idx !== -1) {
      const start = Math.max(0, idx - 20);
      const snippet = cleanPrompt.slice(start, idx + 35).split(/[.,;]/)[0];
      if (snippet) {
        detectedEyes = snippet.trim();
        break;
      }
    }
  }

  // 7. Extract Facial features descriptors
  let detectedFace = `authentic ${detectedArchetype} facial structure, sharp expressive gaze, 4k photorealistic skin micro-textures`;

  // 8. Synthesize rich visual DNA & Anchor Token
  const tokenHash = hashString(`${characterName}_${sceneIndex}_${cleanPrompt.slice(0, 30)}`);
  const safeTokenName = characterName.replace(/[^a-zA-Z0-9]/g, '');
  const anchorToken = `[Subject-Anchor: FaceID_Auto#${safeTokenName}_${tokenHash}]`;

  const visualDescription = `${characterName}, ${detectedRole} | Hair: ${detectedHair} | Eyes: ${detectedEyes} | Clothing: ${detectedAttire} | Face: ${detectedFace} | Consistent identity DNA across shots.`;
  const frameOneAnchorSeed = `Frame 1 cinematic portrait lock: ${characterName} (${detectedRole}), hair: ${detectedHair}, eyes: ${detectedEyes}, wardrobe: ${detectedAttire}, face: ${detectedFace}, 35mm lens, optical focus.`;

  const newCharacter: DynamicCharacterIdentity = {
    id: `char-${Date.now()}-${tokenHash.toLowerCase()}`,
    name: characterName,
    roleOrArchetype: detectedRole,
    avatarEmoji: detectedEmoji,
    visualDescription,
    frameOneAnchorSeed,
    anchorToken,
    originSceneIndex: sceneIndex,
    isLocked: true,
    attire: detectedAttire,
    hair: detectedHair,
    eyes: detectedEyes,
    clothing: detectedAttire,
    facialFeatures: detectedFace,
    physicalTraits: `Distinctive ${detectedArchetype} features, natural skin micro-textures, expressive gaze`,
    tags: [detectedArchetype, characterName.toLowerCase(), `scene${sceneIndex}`]
  };

  return { extractedCharacter: newCharacter, isNewCharacter: true };
}

/**
 * Format locked character descriptors specifically for Sora-2 prompt generation
 */
export function formatCharacterPromptDescriptor(char: DynamicCharacterIdentity): string {
  const hairDesc = char.hair ? `hair: ${char.hair}` : '';
  const eyesDesc = char.eyes ? `eyes: ${char.eyes}` : '';
  const clothDesc = (char.clothing || char.attire) ? `clothing: ${char.clothing || char.attire}` : '';
  const faceDesc = char.facialFeatures ? `facial features: ${char.facialFeatures}` : '';
  const snapshotRef = char.snapshotBase64 ? `[Visual-Snapshot-Reference: Frame#${char.snapshotSceneIndex || 1} Base64 Style Vector Lock]` : '';
  
  const descriptors = [hairDesc, eyesDesc, clothDesc, faceDesc].filter(Boolean).join(', ');
  return `${char.anchorToken} [Character Identity: ${char.name} (${char.roleOrArchetype})${descriptors ? ' - ' + descriptors : ''}]${snapshotRef ? ' ' + snapshotRef : ''}`;
}

/**
 * Mathematical & Logical Resolver for Scene N:
 * - Injects locked Character 1, Character 2, or both based on presence.
 * - Handles introduction of new characters on Scene 2 or Scene 3.
 * - Binds Latent Continuity Context from previous scene exit frame.
 */
export function resolveSceneContinuity(params: {
  sceneIndex: number;
  userPrompt: string;
  projectRegistry: DynamicCharacterIdentity[];
  previousScene?: SequentialSceneNode;
  requestedCharacterIds?: string[];
  duration?: '4' | '8' | '12';
  continuityKeywords?: ContinuityKeyword[] | string[];
}): {
  constructedPrompt: string;
  updatedRegistry: DynamicCharacterIdentity[];
  activeCharacters: DynamicCharacterIdentity[];
  newlyIntroducedCharacter: DynamicCharacterIdentity | null;
  exitLatentContext: string;
  appliedKeywords: string[];
} {
  const { sceneIndex, userPrompt, projectRegistry, previousScene, requestedCharacterIds, duration = '8', continuityKeywords = [] } = params;
  let updatedRegistry = [...projectRegistry];
  let activeCharacters: DynamicCharacterIdentity[] = [];
  let newlyIntroducedCharacter: DynamicCharacterIdentity | null = null;

  // 1. If explicit character IDs were passed by the user, bind those
  if (requestedCharacterIds && requestedCharacterIds.length > 0) {
    activeCharacters = updatedRegistry.filter(c => requestedCharacterIds.includes(c.id));
  } else {
    // 2. Analyze user prompt against existing registry
    const lower = userPrompt.toLowerCase();
    const matchedExisting = updatedRegistry.filter(c => 
      lower.includes(c.name.toLowerCase()) || 
      c.tags.some(t => lower.includes(t.toLowerCase())) ||
      (c.originSceneIndex === 1 && sceneIndex === 2 && !lower.includes('new character') && !lower.includes('another'))
    );

    if (matchedExisting.length > 0) {
      activeCharacters = matchedExisting;
    }

    // 3. Check if a brand new character is introduced in this scene
    const { extractedCharacter, isNewCharacter } = extractCharactersFromPrompt(userPrompt, sceneIndex, updatedRegistry);
    if (extractedCharacter && isNewCharacter) {
      // If Scene 1 or user specifically introduced a new character
      newlyIntroducedCharacter = extractedCharacter;
      updatedRegistry.push(extractedCharacter);
      activeCharacters.push(extractedCharacter);
    } else if (activeCharacters.length === 0 && updatedRegistry.length > 0) {
      // Default to the most recently used / primary character
      activeCharacters = [updatedRegistry[0]];
    } else if (activeCharacters.length === 0 && extractedCharacter) {
      newlyIntroducedCharacter = extractedCharacter;
      updatedRegistry.push(extractedCharacter);
      activeCharacters = [extractedCharacter];
    }
  }

  // 4. Construct character identity prefix tokens with explicit visual descriptors (hair, clothing, facial features)
  const characterTokens = activeCharacters.map(c => formatCharacterPromptDescriptor(c)).join(' • ');

  // 5. Construct previous scene continuity bridge
  let continuityBridge = '';
  if (previousScene && sceneIndex > 1) {
    const prevExit = previousScene.exitLatentContext || `Scene ${sceneIndex - 1} exit frame with consistent lighting and subject vector.`;
    continuityBridge = `[Continuity Vector from Scene ${sceneIndex - 1}: ${prevExit}]`;
  }

  // 6. Extract active Continuity Keywords string for subsequent scenes (Scene 2+)
  let keywordTokens: string[] = [];
  if (Array.isArray(continuityKeywords) && continuityKeywords.length > 0) {
    keywordTokens = continuityKeywords
      .map(k => typeof k === 'string' ? k : (k.enabled ? k.keyword : ''))
      .filter(Boolean);
  }

  let keywordsPrefix = '';
  if (keywordTokens.length > 0 && sceneIndex > 1) {
    keywordsPrefix = `[Visual-Continuity-Lock: ${keywordTokens.join(' | ')}]`;
  }

  // 7. Clean base user prompt of old tokens to prevent duplicate stacking
  const cleanedUserPrompt = userPrompt
    .replace(/\[Visual-Continuity-Lock:[^\]]+\]\s*/g, '')
    .replace(/\[Subject-Anchor:[^\]]+\]\s*/g, '')
    .replace(/\[Frame 1 Sync:[^\]]+\]\s*/g, '')
    .replace(/\[Continuity Vector[^\]]+\]\s*/g, '')
    .trim();

  // 8. Compose finalized multi-stage prompt for Sora-2
  const promptParts: string[] = [];
  if (keywordsPrefix) promptParts.push(keywordsPrefix);
  if (characterTokens) promptParts.push(characterTokens);
  if (continuityBridge) promptParts.push(continuityBridge);
  if (cleanedUserPrompt) promptParts.push(cleanedUserPrompt);

  const constructedPrompt = promptParts.join(', ');

  // 9. Predict Exit Latent Context for this Scene (to feed Scene N+1)
  const charNames = activeCharacters.map(c => c.name).join(' and ') || 'Subject';
  const exitLatentContext = `${charNames} completing scene action at ${duration}s mark, maintaining camera angle, gaze direction, and environmental illumination for seamless match-cut into Scene ${sceneIndex + 1}.`;

  return {
    constructedPrompt: constructedPrompt.trim(),
    updatedRegistry,
    activeCharacters,
    newlyIntroducedCharacter,
    exitLatentContext,
    appliedKeywords: keywordTokens
  };
}

export interface ExtractedSceneContext {
  rawPrompt: string;
  cleanedBasePrompt: string;
  subjectName: string;
  subjectRole: string;
  genre: 'horror' | 'cyberpunk' | 'scifi' | 'action' | 'fantasy' | 'nature' | 'heritage_nepal' | 'urban' | 'cozy' | 'drama' | 'cinematic';
  environment: string;
  atmosphere: string;
  lighting: string;
  cameraStyle: string;
  keyObjects: string[];
  primaryAction: string;
  regionalContext?: string;
}

/**
 * Deep Context & Semantic Extractor from initial User Prompt
 * Analyzes genre, environment, lighting, objects, cultural anchors, and actions
 * so subsequent scenes are 100% extracted from the user's actual input.
 */
export function extractSceneContextFromPrompt(
  prompt: string,
  primaryChar?: DynamicCharacterIdentity | null
): ExtractedSceneContext {
  const raw = prompt.trim();
  const lower = raw.toLowerCase();

  // Strip token markers if present
  const cleaned = raw
    .replace(/\[Visual-Continuity-Lock:[^\]]+\]\s*/g, '')
    .replace(/\[Subject-Anchor:[^\]]+\]\s*/g, '')
    .replace(/\[Frame \d+ Sync:[^\]]+\]\s*/g, '')
    .replace(/\[Continuity Vector[^\]]+\]\s*/g, '')
    .replace(/^(?:Create|Generate|Produce)?\s*(?:an?|the)?\s*(?:ultra-realistic|photorealistic|cinematic|4k|1080p|8k|hyper-realistic)?\s*/i, '')
    .trim();

  // 1. GENRE DETECTION
  let genre: ExtractedSceneContext['genre'] = 'cinematic';
  if (
    lower.includes('horror') || lower.includes('creepy') || lower.includes('eerie') ||
    lower.includes('ghost') || lower.includes('haunted') || lower.includes('thriller') ||
    lower.includes('terror') || lower.includes('cracked door') || lower.includes('flickering') ||
    lower.includes('shadowy figure') || lower.includes('sinister') || lower.includes('ominous') ||
    lower.includes('nightmare') || lower.includes('paranormal') || lower.includes('dark corridor')
  ) {
    genre = 'horror';
  } else if (
    lower.includes('cyberpunk') || lower.includes('blade runner') || lower.includes('neon') ||
    lower.includes('synthwave') || lower.includes('cyborg') || lower.includes('android') ||
    lower.includes('hologram') || lower.includes('dystopian') || lower.includes('megacity')
  ) {
    genre = 'cyberpunk';
  } else if (
    lower.includes('scifi') || lower.includes('sci-fi') || lower.includes('spaceship') ||
    lower.includes('starship') || lower.includes('space station') || lower.includes('alien') ||
    lower.includes('laboratory') || lower.includes('quantum') || lower.includes('astronaut') ||
    lower.includes('galaxy') || lower.includes('mars') || lower.includes('futuristic')
  ) {
    genre = 'scifi';
  } else if (
    lower.includes('fantasy') || lower.includes('dragon') || lower.includes('magic') ||
    lower.includes('wizard') || lower.includes('sorcerer') || lower.includes('enchanted') ||
    lower.includes('mythical') || lower.includes('elf') || lower.includes('castle') ||
    lower.includes('dungeon') || lower.includes('spell') || lower.includes('crystal')
  ) {
    genre = 'fantasy';
  } else if (
    lower.includes('action') || lower.includes('explosion') || lower.includes('chase') ||
    lower.includes('gunfight') || lower.includes('sword') || lower.includes('combat') ||
    lower.includes('battle') || lower.includes('racing') || lower.includes('superhero') ||
    lower.includes('vaulting') || lower.includes('martial arts')
  ) {
    genre = 'action';
  } else if (
    lower.includes('wildlife') || lower.includes('tiger') || lower.includes('leopard') ||
    lower.includes('safari') || lower.includes('jungle') || lower.includes('forest') ||
    lower.includes('ocean') || lower.includes('waterfall') || lower.includes('underwater') ||
    lower.includes('coral') || lower.includes('savanna')
  ) {
    genre = 'nature';
  } else if (
    lower.includes('nepal') || lower.includes('himalaya') || lower.includes('everest') ||
    lower.includes('annapurna') || lower.includes('sherpa') || lower.includes('stupa') ||
    lower.includes('temple') || lower.includes('monk') || lower.includes('kathmandu') ||
    lower.includes('pokhara') || lower.includes('prayer flag') || lower.includes('boudha')
  ) {
    genre = 'heritage_nepal';
  } else if (
    lower.includes('cozy') || lower.includes('coffee') || lower.includes('tea') ||
    lower.includes('fireplace') || lower.includes('rainy window') || lower.includes('warm blanket') ||
    lower.includes('bakery') || lower.includes('peaceful morning')
  ) {
    genre = 'cozy';
  } else if (
    lower.includes('detective') || lower.includes('noir') || lower.includes('investigation') ||
    lower.includes('courtroom') || lower.includes('interrogation') || lower.includes('crime')
  ) {
    genre = 'drama';
  } else if (
    lower.includes('apartment') || lower.includes('subway') || lower.includes('metro') ||
    lower.includes('city') || lower.includes('street') || lower.includes('downtown') ||
    lower.includes('skyscraper') || lower.includes('traffic')
  ) {
    genre = 'urban';
  }

  // 2. REGIONAL / CULTURAL ANCHOR
  let regionalContext = '';
  if (lower.includes('korean')) regionalContext = 'Korean';
  else if (lower.includes('japanese') || lower.includes('tokyo')) regionalContext = 'Japanese';
  else if (lower.includes('nepali') || lower.includes('nepal') || lower.includes('himalayan')) regionalContext = 'Nepali Himalayan';
  else if (lower.includes('nordic') || lower.includes('scandinavian')) regionalContext = 'Nordic';
  else if (lower.includes('french') || lower.includes('parisian') || lower.includes('paris')) regionalContext = 'Parisian';
  else if (lower.includes('indian')) regionalContext = 'Indian';
  else if (lower.includes('tibetan')) regionalContext = 'Tibetan';

  // 3. ENVIRONMENT EXTRACTOR
  let environment = '';
  // Try pattern matching for location phrases
  const envMatch = raw.match(/(?:in|inside|through|at|along|around|down)\s+(?:an?|the)?\s*([a-zA-Z0-9\s-]{4,50}?)(?:,|\.|\bas\b|\bwith\b|\bwhere\b|\bwhile\b|$)/i);
  if (envMatch && envMatch[1] && envMatch[1].trim().length > 3) {
    environment = envMatch[1].trim();
  }

  // Fallback environment inference based on keywords
  if (!environment || environment.length < 4) {
    if (lower.includes('apartment') && lower.includes('hallway')) environment = `${regionalContext ? regionalContext + ' ' : ''}apartment hallway`;
    else if (lower.includes('apartment')) environment = `${regionalContext ? regionalContext + ' ' : ''}apartment corridor`;
    else if (lower.includes('hospital') || lower.includes('asylum')) environment = 'abandoned medical corridor';
    else if (lower.includes('subway') || lower.includes('metro')) environment = 'underground metro station';
    else if (lower.includes('elevator')) environment = 'dimly lit elevator lobby';
    else if (lower.includes('temple') || lower.includes('stupa')) environment = 'sacred stone temple courtyard';
    else if (lower.includes('mountain') || lower.includes('ridge')) environment = 'high mountain pass overlook';
    else if (lower.includes('alley') || lower.includes('street')) environment = `${regionalContext ? regionalContext + ' ' : ''}narrow neon street`;
    else if (lower.includes('cockpit') || lower.includes('spaceship')) environment = 'starship command bridge';
    else if (lower.includes('lab') || lower.includes('laboratory')) environment = 'high-tech research laboratory';
    else if (lower.includes('cafe') || lower.includes('coffee')) environment = 'warm ambient coffee shop';
    else if (lower.includes('forest') || lower.includes('woods')) environment = 'misty pine forest';
    else environment = cleaned.split(/[.,]/)[0] || 'cinematic environment';
  }

  // 4. ATMOSPHERE & LIGHTING EXTRACTOR
  let lighting = 'cinematic natural lighting';
  if (lower.includes('flickering') || lower.includes('fluorescent')) {
    lighting = 'flickering greenish-white fluorescent tube lighting casting harsh pulsating shadows';
  } else if (lower.includes('golden hour') || lower.includes('sunset') || lower.includes('sunrise')) {
    lighting = 'warm golden hour alpenglow with soft amber rim illumination';
  } else if (lower.includes('neon') || lower.includes('cyberpunk')) {
    lighting = 'vibrant dual-tone cyan and magenta neon backlighting reflecting on wet surfaces';
  } else if (lower.includes('twilight') || lower.includes('dusk') || lower.includes('night') || lower.includes('dark')) {
    lighting = 'moody low-key chiaroscuro with deep atmospheric shadows and subtle fill';
  } else if (lower.includes('butter lamp') || lower.includes('candle') || lower.includes('lantern')) {
    lighting = 'warm flickering candlelight and golden brass lamp glow';
  } else if (lower.includes('mist') || lower.includes('fog')) {
    lighting = 'diffuse volumetric mist with soft morning sunbeams';
  }

  let atmosphere = 'cinematic atmospheric depth and realistic physics';
  if (genre === 'horror') {
    atmosphere = 'palpable psychological suspense, eerie silence, heavy ambient tension, and unsettling stillness';
  } else if (genre === 'cyberpunk') {
    atmosphere = 'dense urban haze, fine rain mist, electronic hum, and futuristic dystopian texture';
  } else if (genre === 'scifi') {
    atmosphere = 'sterile pressurized atmosphere, humming quantum hardware, and expansive cosmic vista';
  } else if (genre === 'heritage_nepal') {
    atmosphere = 'tranquil spiritual resonance, fluttering silk prayer flags, and crisp Himalayan alpine breeze';
  } else if (genre === 'cozy') {
    atmosphere = 'comforting warmth, gentle rain tapping against glass, and serene peace';
  }

  // 5. KEY OBJECTS & PROPS
  const keyObjects: string[] = [];
  const objectCandidates = [
    'cracked door', 'elevator', 'flickering light', 'rotary phone', 'security camera', 'knife',
    'flashlight', 'datapad', 'hologram', 'prayer flags', 'butter lamps', 'backpack', 'umbrella',
    'steaming cup', 'mirror', 'window', 'neon sign', 'ancient scroll', 'car', 'drone', 'crystal'
  ];
  for (const obj of objectCandidates) {
    if (lower.includes(obj)) {
      keyObjects.push(obj);
    }
  }

  // 6. SUBJECT NAME & ROLE
  const subjectName = primaryChar?.name || 'The protagonist';
  const subjectRole = primaryChar?.roleOrArchetype || 'Protagonist';

  // 7. CAMERA STYLE
  let cameraStyle = 'Smooth Steadicam Tracking';
  if (genre === 'horror') cameraStyle = 'Slow Creeping Low-Angle Push-In (35mm shallow focus)';
  else if (genre === 'cyberpunk') cameraStyle = 'Dynamic Lateral Dolly with Anamorphic Flares';
  else if (genre === 'action') cameraStyle = 'Kinetic Tracking Handheld Steadicam';
  else if (genre === 'heritage_nepal') cameraStyle = 'Graceful Panoramic Crane & Smooth Tracking';
  else if (genre === 'cozy') cameraStyle = 'Intimate Static 50mm Prime with Soft Bokeh';

  return {
    rawPrompt: raw,
    cleanedBasePrompt: cleaned,
    subjectName,
    subjectRole,
    genre,
    environment,
    atmosphere,
    lighting,
    cameraStyle,
    keyObjects,
    primaryAction: 'navigating the environment with deliberate purpose',
    regionalContext
  };
}

/**
 * Intelligent Narrative Continuation Predictor:
 * Generates the next logical, cinematic scene beat strictly extracted from Scene N's user prompt.
 */
export function predictNextSceneBeat(
  currentScene: SequentialSceneNode,
  activeCharacters: DynamicCharacterIdentity[],
  allRegistry: DynamicCharacterIdentity[]
): {
  nextTitle: string;
  nextPrompt: string;
  nextSubtitleEn: string;
  nextSubtitleNe: string;
  framing: string;
  cameraMovement: string;
  recommendedDuration: '4' | '8' | '12';
} {
  const nextIdx = currentScene.sceneIndex + 1;
  const primaryChar = activeCharacters[0] || allRegistry[0] || null;
  const ctx = extractSceneContextFromPrompt(currentScene.userPrompt, primaryChar);
  const name = primaryChar?.name || ctx.subjectName || 'The subject';
  const env = ctx.environment || 'the hallway';

  let nextTitle = `Scene ${nextIdx}: Narrative Beat`;
  let nextPrompt = '';
  let nextSubtitleEn = '';
  let nextSubtitleNe = '';
  let framing = 'Tracking Medium Shot (35mm)';
  let cameraMovement = 'Smooth Forward Tracking';
  let recommendedDuration: '4' | '8' | '12' = '8';

  // ─────────────────────────────────────────────────────────────
  // SCENE 2: DIRECT CONTINUATION & IMMEDIATE ACTION PROGRESSION
  // (Directly extracted from Scene 1 user input context)
  // ─────────────────────────────────────────────────────────────
  if (nextIdx === 2) {
    if (ctx.genre === 'horror') {
      const objFocus = ctx.keyObjects.includes('elevator') ? 'the slowly opening elevator doors' 
        : ctx.keyObjects.includes('cracked door') ? 'the cracked door as a faint silhouette shifts inside'
        : 'the dark corridor ahead';
      nextTitle = `Scene 2: Corridor Advance & Rising Tension`;
      nextPrompt = `Continuous slow creeping tracking shot inside the ${env}. The ${ctx.lighting} flickers erratically overhead as ${name} takes slow, cautious footsteps forward, the camera edging over their shoulder toward ${objFocus}. Deep psychological suspense, realistic dust motes, 4k cinematic horror grading.`;
      nextSubtitleEn = `Every cautious step down the hallway brings an unsettling realization.`;
      nextSubtitleNe = `प्रत्येक सतर्क पाइलाले कोरिडोरको चिसो सन्नाटालाई चीर्छ।`;
      framing = 'Slow Creeping Low-Angle 35mm';
      cameraMovement = 'Subtle Unsettling Dolly Push-In';
      recommendedDuration = '8';
    } else if (ctx.genre === 'cyberpunk') {
      nextTitle = `Scene 2: Neon Alley Infiltration & Data Scan`;
      nextPrompt = `Continuous tracking shot following ${name} stepping deeper into the ${env}. Dual-tone neon reflections shimmer across wet ground as they activate a glowing holographic scanner, checking incoming encrypted transmissions while high-speed aerial vehicles zoom past overhead.`;
      nextSubtitleEn = `Navigating deeper through the glowing rain-slicked labyrinth.`;
      nextSubtitleNe = `चम्किला नियोन बत्तीहरूको छायामा डाटा संकलन गर्दै।`;
      framing = 'Medium-Wide Anamorphic 35mm';
      cameraMovement = 'Dynamic Lateral Steadicam';
      recommendedDuration = '8';
    } else if (ctx.genre === 'scifi') {
      nextTitle = `Scene 2: System Diagnostics & Module Breach`;
      nextPrompt = `Smooth cinematic tracking shot following ${name} in the ${env}. Holographic telemetry readouts project floating diagrams as warning lights pulse smoothly, and the automated hydraulic bulkhead seals shut behind them with realistic vapor release.`;
      nextSubtitleEn = `System telemetry synchronizes as the mission enters critical status.`;
      nextSubtitleNe = `अन्तरिक्ष मोड्युलमा सेन्सरहरू सक्रिय हुँदै।`;
      framing = 'Medium Close-Up 50mm Prime';
      cameraMovement = 'Smooth Orbital Track';
      recommendedDuration = '8';
    } else if (ctx.genre === 'heritage_nepal') {
      nextTitle = `Scene 2: Heritage Courtyard & Morning Passage`;
      nextPrompt = `Continuous tracking shot following ${name} stepping through the stone pathway of the ${env}. Fluttering silk prayer flags catch the warm golden morning light as soft incense smoke drifts past historic brick architecture in 4k cinematic clarity.`;
      nextSubtitleEn = `Descending through the ancient heritage corridors as the morning awakens.`;
      nextSubtitleNe = `बिहानीको सुनौलो घाममा परम्परागत आँगनतर्फ अघि बढ्दै।`;
      framing = 'Medium Low-Angle Tracking (35mm)';
      cameraMovement = 'Lateral Steadicam';
      recommendedDuration = '8';
    } else if (ctx.genre === 'cozy') {
      nextTitle = `Scene 2: Quiet Reflection & Warm Moment`;
      nextPrompt = `Intimate medium shot of ${name} in the ${env}. Steam gently rises from a warm beverage as they look toward the rain-streaked window glass, soft ambient lighting highlighting gentle expressions and textured fabric details.`;
      nextSubtitleEn = `A quiet peaceful moment captured in warm soothing light.`;
      nextSubtitleNe = `शान्त वातावरणमा न्यानो पलको अनुभूति।`;
      framing = '50mm T1.5 Shallow Depth of Field';
      cameraMovement = 'Slow Gentle Glide';
      recommendedDuration = '8';
    } else if (ctx.genre === 'action') {
      nextTitle = `Scene 2: Sprint & Evasive Manoeuvre`;
      nextPrompt = `High-energy kinetic tracking shot following ${name} dashing through the ${env}. Camera matches rapid movement as debris scatters underfoot, maintaining razor-sharp focus on their determined expression and athletic motion.`;
      nextSubtitleEn = `Moving with rapid precision through hostile terrain.`;
      nextSubtitleNe = `तीव्र गतिमा अवरोधहरू पन्छाउँदै अघि बढ्दै।`;
      framing = 'Wide Dynamic Action Framing';
      cameraMovement = 'Fast Forward Tracking';
      recommendedDuration = '8';
    } else if (ctx.genre === 'nature') {
      nextTitle = `Scene 2: Forest Trail & Wildlife Encounter`;
      nextPrompt = `Smooth fluid tracking shot through lush foliage following ${name} moving across the ${env}. Sunbeams pierce the canopy in dramatic volumetric shafts as native fauna reacts in the natural habitat, photorealistic 4k detail.`;
      nextSubtitleEn = `Venturing deeper into the untouched wilderness.`;
      nextSubtitleNe = `प्राकृतिक सौन्दर्यको गहिराइमा निरन्तर यात्रा।`;
      framing = 'Wide 24mm Nature Vista';
      cameraMovement = 'Smooth Pan & Forward Glide';
      recommendedDuration = '8';
    } else {
      // General Context-Derived Continuation
      nextTitle = `Scene 2: Progression in ${ctx.environment.slice(0, 30)}`;
      nextPrompt = `Continuous tracking shot following ${name} in the ${env}. Moving forward with clear purpose as ${ctx.lighting} emphasizes atmospheric textures and spatial depth, seamlessly continuing from Scene 1 in 4k cinematic fidelity.`;
      nextSubtitleEn = `Continuing the journey with steadfast determination.`;
      nextSubtitleNe = `यात्रा निरन्तर उद्देश्यपूर्ण दिशामा अगाडि बढ्छ।`;
      framing = 'Tracking Medium Shot (35mm)';
      cameraMovement = 'Dynamic Dolly Forward';
      recommendedDuration = '8';
    }
  } 
  // ─────────────────────────────────────────────────────────────
  // SCENE 3: THRESHOLD CROSSING, DISCOVERY, OR ESCALATION BEAT
  // ─────────────────────────────────────────────────────────────
  else if (nextIdx === 3) {
    if (ctx.genre === 'horror') {
      nextTitle = `Scene 3: Threshold Entry & Dark Discovery`;
      nextPrompt = `Dramatic slow push-in shot of ${name} reaching out to push open the door inside the ${env}. The door creaks open into a pitch-black interior where a solitary glowing light flickers against vintage wallpaper, heart-pounding suspense.`;
      nextSubtitleEn = `Stepping across the threshold into the unknown dark.`;
      nextSubtitleNe = `अँध्यारो कोठाको ढोका खुल्दा मुटुको धड्कन बढ्छ।`;
      framing = 'Over-the-Shoulder Push-In (35mm)';
      cameraMovement = 'Slow Tense Creep';
      recommendedDuration = '12';
    } else if (ctx.genre === 'cyberpunk') {
      nextTitle = `Scene 3: Overlook & Hologram Decryption`;
      nextPrompt = `Sweeping low-angle orbit shot of ${name} standing at the elevated catwalk overlooking the ${env}. Towering holographic advertisements illuminate the mist as an encrypted digital sphere expands in their palms.`;
      nextSubtitleEn = `At the neon precipice, the decrypted coordinates come alive.`;
      nextSubtitleNe = `भव्य नियोन शहरको पृष्ठभूमिमा डाटा प्रकट हुन्छ।`;
      framing = 'Low-Angle 24mm Anamorphic';
      cameraMovement = 'Sweeping 180-Degree Orbit';
      recommendedDuration = '12';
    } else if (ctx.genre === 'heritage_nepal') {
      nextTitle = `Scene 3: Sanctuary Overlook & Sacred Vista`;
      nextPrompt = `Dramatic wide-angle dynamic shot of ${name} reaching the high stone overlook of the ${env}. The clouds part to reveal the majestic snow-capped peaks illuminated in golden sunset splendour, prayer flags fluttering in the breeze.`;
      nextSubtitleEn = `At the sanctuary overlook, the golden peaks reveal their secret.`;
      nextSubtitleNe = `मन्दिरको उचाइबाट हिमशृङ्खलाको अनुपम दृश्य देखिन्छ।`;
      framing = 'Wide 24mm Anamorphic Master';
      cameraMovement = 'Sweeping Crane Pull-Back';
      recommendedDuration = '12';
    } else {
      nextTitle = `Scene 3: Climactic Vista & Turning Point`;
      nextPrompt = `Dramatic wide shot of ${name} in the ${env} reaching a pivotal vantage point. The atmospheric lighting shifts dynamically, revealing the full scale and breathtaking depth of the world in 4k photorealistic fidelity.`;
      nextSubtitleEn = `The horizon opens to reveal the full magnitude of the journey.`;
      nextSubtitleNe = `क्षितिज फराकिलो बन्दै नयाँ आयामहरू खुल्छन्।`;
      framing = 'Wide 24mm Anamorphic Master';
      cameraMovement = 'Sweeping Crane Pull-Back';
      recommendedDuration = '12';
    }
  } 
  // ─────────────────────────────────────────────────────────────
  // SCENE 4: RISING DRAMATIC CLIMAX & HIGH INTENSITY
  // ─────────────────────────────────────────────────────────────
  else if (nextIdx === 4) {
    nextTitle = `Scene 4: Dramatic Climax & Confrontation`;
    nextPrompt = `Intense cinematic medium close-up of ${name} in the ${env}. Dramatic lighting intensifies facial textures and expressive focus as a sudden visual revelation transforms the scene, blockbuster cinema grading.`;
    nextSubtitleEn = `In the pivotal moment, courage meets destiny.`;
    nextSubtitleNe = `निर्णायक मोडमा पुग्दा कथाले नयाँ गति लिन्छ।`;
    framing = 'Tight Hero Profile (50mm Prime)';
    cameraMovement = 'Dynamic Snap Orbit';
    recommendedDuration = '12';
  } 
  // ─────────────────────────────────────────────────────────────
  // SCENE 5: EMOTIONAL RESOLUTION & AFTERMATH
  // ─────────────────────────────────────────────────────────────
  else if (nextIdx === 5) {
    nextTitle = `Scene 5: Atmosphere & Emotional Resonance`;
    nextPrompt = `Atmospheric medium shot of ${name} pausing in the ${env}. The ${ctx.lighting} gently transitions into twilight tones as ambient environmental particles drift through the frame in serene resolution.`;
    nextSubtitleEn = `The echoes of the journey settle into profound quietude.`;
    nextSubtitleNe = `यात्राको गहिरो अनुभव शान्तिमा रूपान्तरित हुन्छ।`;
    framing = 'Medium Atmosphere Two-Shot';
    cameraMovement = 'Slow Gentle Drift';
    recommendedDuration = '12';
  } 
  // ─────────────────────────────────────────────────────────────
  // SCENE 6+: GRAND FINALE MASTER SHOT & HERO STINGER
  // ─────────────────────────────────────────────────────────────
  else {
    nextTitle = `Scene ${nextIdx}: Grand Finale & Lingering Stinger`;
    nextPrompt = `Epic cinematic pull-back establishing master shot of ${name} standing within the grand expanse of the ${env} under glowing twilight sky, ultimate 4k photorealistic blockbuster finish.`;
    nextSubtitleEn = `NepalAI Studio • The Story Continues.`;
    nextSubtitleNe = `नेपाल एआई स्टुडियो • कथा निरन्तर जारी छ।`;
    framing = 'Grand Aerial Drone Vista';
    cameraMovement = 'High-Altitude Aerial Ascent';
    recommendedDuration = '12';
  }

  return {
    nextTitle,
    nextPrompt,
    nextSubtitleEn,
    nextSubtitleNe,
    framing,
    cameraMovement,
    recommendedDuration
  };
}

/**
 * Generate full multi-segment chained storyboard derived 100% from user's initial prompt
 */
export function generateChainedSegmentsFromPrompt(
  initialPrompt: string,
  primaryChar?: DynamicCharacterIdentity | null
): Array<{
  id: string;
  order: number;
  title: string;
  recommendedDuration: number;
  framing: string;
  prompt: string;
  subtitleEn: string;
  subtitleNe: string;
  exitLatentContext: string;
}> {
  const ctx = extractSceneContextFromPrompt(initialPrompt, primaryChar);
  const name = primaryChar?.name || ctx.subjectName || 'The protagonist';
  const env = ctx.environment;

  // Scene 1: Master Hero Establishing Shot
  const seg1 = {
    id: 'seg-1',
    order: 1,
    title: 'Scene 1: Master Hero Establishing Shot',
    recommendedDuration: 12,
    framing: ctx.cameraStyle || 'Cinematic Wide 35mm Master',
    prompt: initialPrompt.trim(),
    subtitleEn: `The scene opens in the ${env}.`,
    subtitleNe: `कथाको सुरुवात ${env} बाट हुन्छ।`,
    exitLatentContext: `${name} turns from the center of the frame, moving purposefully toward the next action beat.`
  };

  // Scene 2: Direct Action & Progression
  const dummyScene1: SequentialSceneNode = {
    id: 's-1',
    sceneIndex: 1,
    title: seg1.title,
    userPrompt: initialPrompt,
    constructedPrompt: initialPrompt,
    activeCharacterIds: primaryChar ? [primaryChar.id] : [],
    duration: '12',
    framing: seg1.framing,
    cameraMovement: 'Smooth Slow Push-In',
    lightingAtmosphere: ctx.lighting,
    exitLatentContext: seg1.exitLatentContext,
    status: 'idle',
    subtitleEn: seg1.subtitleEn,
    subtitleNe: seg1.subtitleNe
  };

  const p2 = predictNextSceneBeat(dummyScene1, primaryChar ? [primaryChar] : [], []);
  const seg2 = {
    id: 'seg-2',
    order: 2,
    title: p2.nextTitle,
    recommendedDuration: 12,
    framing: p2.framing,
    prompt: p2.nextPrompt,
    subtitleEn: p2.nextSubtitleEn,
    subtitleNe: p2.nextSubtitleNe,
    exitLatentContext: `${name} reaches the focal point of the area, maintaining eye-line and velocity.`
  };

  // Scene 3
  const dummyScene2: SequentialSceneNode = {
    ...dummyScene1,
    sceneIndex: 2,
    userPrompt: p2.nextPrompt
  };
  const p3 = predictNextSceneBeat(dummyScene2, primaryChar ? [primaryChar] : [], []);
  const seg3 = {
    id: 'seg-3',
    order: 3,
    title: p3.nextTitle,
    recommendedDuration: 12,
    framing: p3.framing,
    prompt: p3.nextPrompt,
    subtitleEn: p3.nextSubtitleEn,
    subtitleNe: p3.nextSubtitleNe,
    exitLatentContext: `${name} steps across the threshold as the atmosphere intensifies.`
  };

  // Scene 4
  const dummyScene3: SequentialSceneNode = {
    ...dummyScene1,
    sceneIndex: 3,
    userPrompt: p3.nextPrompt
  };
  const p4 = predictNextSceneBeat(dummyScene3, primaryChar ? [primaryChar] : [], []);
  const seg4 = {
    id: 'seg-4',
    order: 4,
    title: p4.nextTitle,
    recommendedDuration: 12,
    framing: p4.framing,
    prompt: p4.nextPrompt,
    subtitleEn: p4.nextSubtitleEn,
    subtitleNe: p4.nextSubtitleNe,
    exitLatentContext: `${name} reacts to the central reveal with sharp optical gaze.`
  };

  // Scene 5
  const dummyScene4: SequentialSceneNode = {
    ...dummyScene1,
    sceneIndex: 4,
    userPrompt: p4.nextPrompt
  };
  const p5 = predictNextSceneBeat(dummyScene4, primaryChar ? [primaryChar] : [], []);
  const seg5 = {
    id: 'seg-5',
    order: 5,
    title: p5.nextTitle,
    recommendedDuration: 12,
    framing: p5.framing,
    prompt: p5.nextPrompt,
    subtitleEn: p5.nextSubtitleEn,
    subtitleNe: p5.nextSubtitleNe,
    exitLatentContext: `${name} pauses as the dust settles into twilight.`
  };

  // Scene 6
  const dummyScene5: SequentialSceneNode = {
    ...dummyScene1,
    sceneIndex: 5,
    userPrompt: p5.nextPrompt
  };
  const p6 = predictNextSceneBeat(dummyScene5, primaryChar ? [primaryChar] : [], []);
  const seg6 = {
    id: 'seg-6',
    order: 6,
    title: p6.nextTitle,
    recommendedDuration: 12,
    framing: p6.framing,
    prompt: p6.nextPrompt,
    subtitleEn: p6.nextSubtitleEn,
    subtitleNe: p6.nextSubtitleNe,
    exitLatentContext: `Wide master panoramic overview fading gracefully to black.`
  };

  return [seg1, seg2, seg3, seg4, seg5, seg6];
}

/**
 * Initialize a 3-scene project workflow derived 100% from the initial user prompt
 */
export function initializeProjectContinuity(initialPrompt: string, aspectRatio: '16:9' | '9:16' = '16:9'): ProjectContinuityState {
  const { extractedCharacter } = extractCharactersFromPrompt(initialPrompt, 1, []);
  const initialRegistry: DynamicCharacterIdentity[] = extractedCharacter ? [extractedCharacter] : [];
  const ctx = extractSceneContextFromPrompt(initialPrompt, extractedCharacter);

  const scene1Resolution = resolveSceneContinuity({
    sceneIndex: 1,
    userPrompt: initialPrompt,
    projectRegistry: initialRegistry,
    duration: '8'
  });

  const scene1Node: SequentialSceneNode = {
    id: `scene-node-${Date.now()}-1`,
    sceneIndex: 1,
    title: 'Scene 1: Master Hero Establishing Shot',
    userPrompt: initialPrompt,
    constructedPrompt: scene1Resolution.constructedPrompt,
    activeCharacterIds: scene1Resolution.activeCharacters.map(c => c.id),
    duration: '8',
    framing: ctx.cameraStyle || 'Cinematic Wide 35mm Master',
    cameraMovement: 'Smooth Slow Push-In',
    lightingAtmosphere: ctx.lighting,
    exitLatentContext: scene1Resolution.exitLatentContext,
    status: 'idle',
    subtitleEn: `The story begins in the ${ctx.environment}.`,
    subtitleNe: `कथाको सुरुवात हुन्छ।`,
    characterTokensInjected: scene1Resolution.activeCharacters.map(c => c.anchorToken)
  };

  // Predict Scene 2 directly from Scene 1 prompt context
  const scene2Prediction = predictNextSceneBeat(scene1Node, scene1Resolution.activeCharacters, scene1Resolution.updatedRegistry);
  const scene2Resolution = resolveSceneContinuity({
    sceneIndex: 2,
    userPrompt: scene2Prediction.nextPrompt,
    projectRegistry: scene1Resolution.updatedRegistry,
    previousScene: scene1Node,
    duration: scene2Prediction.recommendedDuration
  });

  const scene2Node: SequentialSceneNode = {
    id: `scene-node-${Date.now()}-2`,
    sceneIndex: 2,
    title: scene2Prediction.nextTitle,
    userPrompt: scene2Prediction.nextPrompt,
    constructedPrompt: scene2Resolution.constructedPrompt,
    activeCharacterIds: scene2Resolution.activeCharacters.map(c => c.id),
    duration: scene2Prediction.recommendedDuration,
    framing: scene2Prediction.framing,
    cameraMovement: scene2Prediction.cameraMovement,
    lightingAtmosphere: ctx.lighting,
    exitLatentContext: scene2Resolution.exitLatentContext,
    status: 'idle',
    subtitleEn: scene2Prediction.nextSubtitleEn,
    subtitleNe: scene2Prediction.nextSubtitleNe,
    characterTokensInjected: scene2Resolution.activeCharacters.map(c => c.anchorToken)
  };

  // Predict Scene 3 from Scene 2 prompt context
  const scene3Prediction = predictNextSceneBeat(scene2Node, scene2Resolution.activeCharacters, scene2Resolution.updatedRegistry);
  const scene3Resolution = resolveSceneContinuity({
    sceneIndex: 3,
    userPrompt: scene3Prediction.nextPrompt,
    projectRegistry: scene2Resolution.updatedRegistry,
    previousScene: scene2Node,
    duration: scene3Prediction.recommendedDuration
  });

  const scene3Node: SequentialSceneNode = {
    id: `scene-node-${Date.now()}-3`,
    sceneIndex: 3,
    title: scene3Prediction.nextTitle,
    userPrompt: scene3Prediction.nextPrompt,
    constructedPrompt: scene3Resolution.constructedPrompt,
    activeCharacterIds: scene3Resolution.activeCharacters.map(c => c.id),
    duration: scene3Prediction.recommendedDuration,
    framing: scene3Prediction.framing,
    cameraMovement: scene3Prediction.cameraMovement,
    lightingAtmosphere: ctx.lighting,
    exitLatentContext: scene3Resolution.exitLatentContext,
    status: 'idle',
    subtitleEn: scene3Prediction.nextSubtitleEn,
    subtitleNe: scene3Prediction.nextSubtitleNe,
    characterTokensInjected: scene3Resolution.activeCharacters.map(c => c.anchorToken)
  };

  const themeTitle = ctx.regionalContext ? `${ctx.regionalContext} ${ctx.genre.toUpperCase()}` : `${ctx.genre.toUpperCase()} Cinematic`;

  return {
    projectId: `proj-${Date.now()}`,
    characters: scene3Resolution.updatedRegistry,
    scenes: [scene1Node, scene2Node, scene3Node],
    worldTheme: themeTitle,
    visualStyle: 'Photorealistic 4k',
    aspectRatio,
    lastExitLatentContext: scene1Node.exitLatentContext
  };
}

export interface ExportedSceneSequenceProject {
  formatVersion: '1.0';
  exportTimestamp: string;
  exportedBy: string;
  projectId: string;
  projectTitle?: string;
  worldTheme: string;
  visualStyle: string;
  aspectRatio: '16:9' | '9:16';
  characterMode: 'reuse' | 'new';
  selectedCharacterId: string | null;
  characters: DynamicCharacterIdentity[];
  scenes: SequentialSceneNode[];
  continuityKeywords?: ContinuityKeyword[];
  continuityKeywordsEnabled?: boolean;
  sceneToCharacterMapping: Array<{
    sceneIndex: number;
    sceneTitle: string;
    duration: string;
    cameraMovement: string;
    framing: string;
    lightingAtmosphere: string;
    activeCharacterIds: string[];
    characterNames: string[];
    userPrompt: string;
    constructedPrompt: string;
    hasVideoUrl: boolean;
    status: string;
  }>;
  totalScenes: number;
  totalLockedCharacters: number;
  snapshotsIncluded: number;
}

/**
 * Intelligent Extractor that analyzes Scene 1's prompt, framing, lighting atmosphere,
 * and character visual descriptors (hair, eyes, clothing, facial features) to automatically
 * suggest prioritized 'Continuity Keywords'.
 */
export function extractContinuityKeywordsFromScene(params: {
  scene1?: SequentialSceneNode;
  scene1Prompt?: string;
  characters?: DynamicCharacterIdentity[];
  worldTheme?: string;
  visualStyle?: string;
}): ContinuityKeyword[] {
  const { scene1, scene1Prompt, characters = [], worldTheme = 'Himalayan Cinematic Realism', visualStyle = 'Photorealistic 4k' } = params;
  const rawPrompt = (scene1?.userPrompt || scene1Prompt || '').trim();
  const lowerPrompt = rawPrompt.toLowerCase();
  const lighting = (scene1?.lightingAtmosphere || '').toLowerCase();
  const framing = (scene1?.framing || '').toLowerCase();

  const suggested: ContinuityKeyword[] = [];
  const addedSet = new Set<string>();

  const addTag = (
    keyword: string, 
    category: ContinuityKeyword['category'], 
    source: ContinuityKeyword['source'] = 'scene1_prompt',
    confidence = 0.95
  ) => {
    const clean = keyword.trim();
    const keyLower = clean.toLowerCase();
    if (!clean || addedSet.has(keyLower)) return;
    addedSet.add(keyLower);
    suggested.push({
      id: `kw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      keyword: clean,
      category,
      source,
      enabled: true,
      confidence
    });
  };

  // 1. LIGHTING & COLOR PALETTE CONTINUITY
  if (lowerPrompt.includes('golden hour') || lowerPrompt.includes('sunset') || lowerPrompt.includes('sunrise') || lighting.includes('golden')) {
    addTag('Golden Hour Warm Crest Light', 'lighting', 'scene1_prompt', 0.98);
    addTag('Amber Volumetric Atmospheric Haze', 'lighting', 'scene1_prompt', 0.94);
  } else if (lowerPrompt.includes('twilight') || lowerPrompt.includes('dusk') || lowerPrompt.includes('evening') || lighting.includes('twilight')) {
    addTag('Blue Hour & Deep Amber Contrast', 'lighting', 'scene1_prompt', 0.96);
  } else if (lowerPrompt.includes('morning') || lowerPrompt.includes('dawn') || lowerPrompt.includes('mist')) {
    addTag('Crisp Morning Alpine Mist & Diffuse Sun', 'lighting', 'scene1_prompt', 0.95);
  } else if (lowerPrompt.includes('candle') || lowerPrompt.includes('butter lamp') || lowerPrompt.includes('temple')) {
    addTag('Warm Flickering Butter Lamp Glow', 'lighting', 'scene1_prompt', 0.97);
  } else {
    addTag('Cinematic Natural Key Light & Soft Ambient Fill', 'lighting', 'scene1_prompt', 0.90);
  }

  // 2. OPTICS & CINEMATOGRAPHY CONTINUITY
  if (framing.includes('35mm') || lowerPrompt.includes('35mm')) {
    addTag('35mm Master Prime Lens Focus', 'optics', 'scene1_prompt', 0.98);
  } else if (framing.includes('anamorphic') || lowerPrompt.includes('anamorphic')) {
    addTag('24mm Anamorphic Horizontal Flares', 'optics', 'scene1_prompt', 0.96);
  } else if (framing.includes('close') || framing.includes('portrait')) {
    addTag('50mm T1.5 Shallow Depth of Field', 'optics', 'scene1_prompt', 0.95);
  } else {
    addTag('35mm Photorealistic Optical Geometry', 'optics', 'scene1_prompt', 0.92);
  }
  addTag('Fine 35mm Analog Film Grain Texture', 'optics', 'scene1_prompt', 0.88);

  // 3. WARDROBE & ATTIRE CONTINUITY (From Characters)
  characters.forEach(char => {
    if (char.clothing || char.attire) {
      const clothDesc = char.clothing || char.attire;
      // Take up to first 45 chars of signature clothing
      const conciseCloth = clothDesc.split(/[.,;]/)[0].trim();
      if (conciseCloth.length > 5) {
        addTag(`${char.name}'s ${conciseCloth}`, 'wardrobe', 'character_dna', 0.99);
      }
    }
  });

  // 4. FACIAL & HAIR CONTINUITY (From Characters)
  characters.forEach(char => {
    if (char.hair) {
      const conciseHair = char.hair.split(/[.,;]/)[0].trim();
      if (conciseHair.length > 5) {
        addTag(`${char.name}: ${conciseHair}`, 'facial', 'character_dna', 0.96);
      }
    }
    if (char.eyes) {
      const conciseEyes = char.eyes.split(/[.,;]/)[0].trim();
      if (conciseEyes.length > 5) {
        addTag(`${char.name}: ${conciseEyes}`, 'facial', 'character_dna', 0.94);
      }
    }
    if (char.facialFeatures) {
      const conciseFace = char.facialFeatures.split(/[.,;]/)[0].trim();
      if (conciseFace.length > 5) {
        addTag(`${char.name}: ${conciseFace}`, 'facial', 'character_dna', 0.95);
      }
    }
  });

  // 5. ENVIRONMENT & WORLD THEME CONTINUITY
  if (lowerPrompt.includes('himalaya') || lowerPrompt.includes('mountain') || lowerPrompt.includes('everest') || lowerPrompt.includes('nepal')) {
    addTag('Ancient Himalayan Stone & Slate Textures', 'environment', 'scene1_prompt', 0.96);
    addTag('Wind-Fluttered Silk Prayer Flags', 'environment', 'scene1_prompt', 0.92);
  } else if (lowerPrompt.includes('temple') || lowerPrompt.includes('stupa') || lowerPrompt.includes('durbar') || lowerPrompt.includes('monastery')) {
    addTag('Carved Newari Woodcraft & Red Brick Courtyard', 'environment', 'scene1_prompt', 0.95);
  } else if (lowerPrompt.includes('cyber') || lowerPrompt.includes('futuristic') || lowerPrompt.includes('neon')) {
    addTag('Cybernetic Himalayan Tech-Fusion Aesthetics', 'environment', 'scene1_prompt', 0.95);
  }

  // 6. OVERALL VISUAL STYLE ANCHOR
  if (visualStyle) {
    addTag(`${visualStyle} Master Render`, 'style', 'custom', 0.90);
  }

  return suggested;
}

/**
 * Format active continuity keywords into a standardized Sora-2 prompt prefix
 */
export function formatContinuityKeywordsPrefix(keywords: (ContinuityKeyword | string)[]): string {
  const activeStrings = keywords
    .map(k => typeof k === 'string' ? k : (k.enabled ? k.keyword : ''))
    .filter(Boolean);
  
  if (activeStrings.length === 0) return '';
  return `[Visual-Continuity-Lock: ${activeStrings.join(' | ')}]`;
}

/**
 * Apply continuity keywords to all scenes with sceneIndex > 1 (or all scenes)
 * while strictly maintaining camera movement, duration, framing, and narrative beat.
 */
export function applyContinuityKeywordsToSequence(params: {
  scenes: SequentialSceneNode[];
  keywords: ContinuityKeyword[];
  projectRegistry: DynamicCharacterIdentity[];
}): SequentialSceneNode[] {
  const { scenes, keywords, projectRegistry } = params;
  const activeKeywords = keywords.filter(k => k.enabled);
  const keywordStrings = activeKeywords.map(k => k.keyword);

  return scenes.map((scene, idx) => {
    if (scene.sceneIndex === 1) {
      return {
        ...scene,
        continuityKeywordsApplied: keywordStrings
      };
    }

    const prevScene = idx > 0 ? scenes[idx - 1] : undefined;
    const res = resolveSceneContinuity({
      sceneIndex: scene.sceneIndex,
      userPrompt: scene.userPrompt,
      projectRegistry,
      previousScene: prevScene,
      requestedCharacterIds: scene.activeCharacterIds,
      duration: scene.duration,
      continuityKeywords: activeKeywords
    });

    return {
      ...scene,
      constructedPrompt: res.constructedPrompt,
      exitLatentContext: res.exitLatentContext,
      continuityKeywordsApplied: res.appliedKeywords,
      characterTokensInjected: res.activeCharacters.map(c => c.anchorToken),
      // Preserve cinematography and timing
      cameraMovement: scene.cameraMovement,
      framing: scene.framing,
      lightingAtmosphere: scene.lightingAtmosphere,
      duration: scene.duration
    };
  });
}

/**
 * Quick-Swap a locked character in a specific scene with another character from the gallery
 * while strictly maintaining the scene's motion, camera movement, framing, lighting, duration, and transition context.
 */
export function quickSwapSceneCharacter(params: {
  scene: SequentialSceneNode;
  sceneIndex: number;
  previousScene?: SequentialSceneNode;
  oldCharacterId: string;
  newCharacterId: string;
  projectRegistry: DynamicCharacterIdentity[];
}): {
  updatedScene: SequentialSceneNode;
  constructedPrompt: string;
  replacedCharacterName: string;
  targetCharacterName: string;
} {
  const { scene, sceneIndex, previousScene, oldCharacterId, newCharacterId, projectRegistry } = params;
  
  // Replace oldCharacterId with newCharacterId in activeCharacterIds
  let updatedActiveIds = scene.activeCharacterIds.map(id => id === oldCharacterId ? newCharacterId : id);
  if (!updatedActiveIds.includes(newCharacterId)) {
    updatedActiveIds.push(newCharacterId);
  }
  // Deduplicate
  updatedActiveIds = Array.from(new Set(updatedActiveIds));
  
  // Get old character name to replace any textual mentions
  const oldChar = projectRegistry.find(c => c.id === oldCharacterId);
  const newChar = projectRegistry.find(c => c.id === newCharacterId);
  
  let newUserPrompt = scene.userPrompt;
  if (oldChar && newChar && oldChar.name !== newChar.name) {
    const escapedOldName = oldChar.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedOldName}\\b`, 'gi');
    newUserPrompt = newUserPrompt.replace(regex, newChar.name);
  }

  // Resolve continuity with updated character mapping while keeping camera, motion, lighting, duration intact
  const res = resolveSceneContinuity({
    sceneIndex,
    userPrompt: newUserPrompt,
    projectRegistry,
    previousScene,
    requestedCharacterIds: updatedActiveIds,
    duration: scene.duration
  });

  const updatedScene: SequentialSceneNode = {
    ...scene,
    userPrompt: newUserPrompt,
    activeCharacterIds: updatedActiveIds,
    constructedPrompt: res.constructedPrompt,
    exitLatentContext: res.exitLatentContext,
    characterTokensInjected: res.activeCharacters.map(c => c.anchorToken),
    // Explicitly preserve motion and cinematography settings
    cameraMovement: scene.cameraMovement,
    framing: scene.framing,
    lightingAtmosphere: scene.lightingAtmosphere,
    duration: scene.duration,
  };

  return {
    updatedScene,
    constructedPrompt: res.constructedPrompt,
    replacedCharacterName: oldChar?.name || oldCharacterId,
    targetCharacterName: newChar?.name || newCharacterId
  };
}

/**
 * Trigger client-side JSON download of the complete character and scene sequence configuration
 */
export function downloadSceneSequenceProjectJSON(
  projectData: ExportedSceneSequenceProject,
  filename?: string
): void {
  const jsonStr = JSON.stringify(projectData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `nepalai_sora_sequence_project_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface Gpt4oSceneContextAnalysis {
  success: boolean;
  modelUsed: string;
  extractedEntities: {
    genre: string;
    environment: string;
    lighting: string;
    atmosphere: string;
    keyObjects: string[];
    cameraLanguage: string;
  };
  characterDescriptions: Array<{
    name: string;
    role: string;
    visualDescriptors: string;
    anchorToken: string;
  }>;
  lockedParameters: Array<{
    key: string;
    value: string;
    sourceSceneIndex: number;
  }>;
  suggestedTitle: string;
  continuityAwarePrompt: string;
  suggestedDuration: '4' | '8' | '12';
  framing: string;
  cameraMovement: string;
  subtitles: {
    en: string;
    ne: string;
  };
  narrativeProgressionRationale?: string;
}

/**
 * Prompt Context Analyzer with GPT-4o:
 * Intercepts current scene's prompt & full sequence history, extracts core entities
 * and returns a continuity-locked prompt adhering to Scene 1 visual parameters without random element injection.
 */
export async function analyzeSceneContextWithGpt4o(params: {
  currentScenePrompt: string;
  sceneIndex: number;
  previousScenes: Array<{
    sceneIndex: number;
    title: string;
    prompt: string;
    exitLatentContext?: string;
  }>;
  lockedCharacters?: DynamicCharacterIdentity[];
  targetBeatType?: string;
}): Promise<Gpt4oSceneContextAnalysis> {
  try {
    const response = await fetch('/api/ai/analyze-scene-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentScenePrompt: params.currentScenePrompt,
        sceneIndex: params.sceneIndex,
        previousScenes: params.previousScenes,
        lockedCharacters: (params.lockedCharacters || []).map(c => ({
          name: c.name,
          role: c.roleOrArchetype,
          visualDescriptors: c.visualDescription,
          anchorToken: c.anchorToken
        })),
        targetBeatType: params.targetBeatType || 'continuation'
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.error || 'Continuity analysis failed');
  } catch (err: any) {
    console.warn('GPT-4o Prompt Context Analyzer falling back to local semantic extractor:', err?.message);

    // High fidelity local fallback
    const primaryChar = params.lockedCharacters?.[0] || null;
    const ctx = extractSceneContextFromPrompt(params.currentScenePrompt || params.previousScenes[0]?.prompt || '', primaryChar);
    const scene1Node: SequentialSceneNode = {
      id: 'local-fallback',
      sceneIndex: Math.max(1, params.sceneIndex - 1),
      title: params.previousScenes[0]?.title || 'Scene 1: Master Hero Establishing Shot',
      userPrompt: params.previousScenes[0]?.prompt || params.currentScenePrompt,
      constructedPrompt: params.previousScenes[0]?.prompt || params.currentScenePrompt,
      activeCharacterIds: primaryChar ? [primaryChar.id] : [],
      duration: '8',
      framing: ctx.cameraStyle,
      cameraMovement: 'Smooth Steadicam Forward Tracking',
      lightingAtmosphere: ctx.lighting,
      exitLatentContext: `${ctx.subjectName} proceeds smoothly into the next beat.`,
      status: 'idle',
      subtitleEn: `The journey continues inside the ${ctx.environment}.`,
      subtitleNe: `कथा निरन्तर अगाडि बढ्छ।`
    };

    const pred = predictNextSceneBeat(scene1Node, primaryChar ? [primaryChar] : [], params.lockedCharacters || []);

    return {
      success: true,
      modelUsed: 'local-semantic-engine',
      extractedEntities: {
        genre: ctx.genre,
        environment: ctx.environment,
        lighting: ctx.lighting,
        atmosphere: ctx.atmosphere,
        keyObjects: ctx.keyObjects,
        cameraLanguage: ctx.cameraStyle
      },
      characterDescriptions: (params.lockedCharacters || []).map(c => ({
        name: c.name,
        role: c.roleOrArchetype,
        visualDescriptors: c.visualDescription,
        anchorToken: c.anchorToken
      })),
      lockedParameters: [
        { key: 'Scene 1 Subject DNA', value: primaryChar?.visualDescription || ctx.subjectName, sourceSceneIndex: 1 },
        { key: 'Environment Lock', value: ctx.environment, sourceSceneIndex: 1 },
        { key: 'Atmosphere & Light', value: ctx.lighting, sourceSceneIndex: 1 }
      ],
      suggestedTitle: pred.nextTitle,
      continuityAwarePrompt: pred.nextPrompt,
      suggestedDuration: pred.recommendedDuration,
      framing: pred.framing,
      cameraMovement: pred.cameraMovement,
      subtitles: {
        en: pred.nextSubtitleEn,
        ne: pred.nextSubtitleNe
      },
      narrativeProgressionRationale: 'Local semantic progression locking Scene 1 context and preventing random element injection.'
    };
  }
}

