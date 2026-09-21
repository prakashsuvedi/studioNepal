/**
 * NepalAI Studio - Sequential Character Continuity & Multi-Scene Evolution Engine
 * 
 * Mathematical, Logical, and Engineering System for:
 * 1. Dynamic character extraction & identity locking from Scene 1 prompt (no forced default character).
 * 2. Sequential character carrying & resolution across Scene 2, Scene 3, Scene N.
 * 3. Dynamic multi-character registry: introducing new characters on Scene 2/3 while preserving previous locks.
 * 4. Latent frame-to-frame narrative continuity & intelligent "Continue Scene" prompt prediction.
 */

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
}): {
  constructedPrompt: string;
  updatedRegistry: DynamicCharacterIdentity[];
  activeCharacters: DynamicCharacterIdentity[];
  newlyIntroducedCharacter: DynamicCharacterIdentity | null;
  exitLatentContext: string;
} {
  const { sceneIndex, userPrompt, projectRegistry, previousScene, requestedCharacterIds, duration = '8' } = params;
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

  // 6. Clean base user prompt of old tokens to prevent duplicate stacking
  const cleanedUserPrompt = userPrompt
    .replace(/\[Subject-Anchor:[^\]]+\]\s*/g, '')
    .replace(/\[Frame 1 Sync:[^\]]+\]\s*/g, '')
    .replace(/\[Continuity Vector[^\]]+\]\s*/g, '')
    .trim();

  // 7. Compose finalized multi-stage prompt for Sora-2
  let constructedPrompt = '';
  if (characterTokens && continuityBridge) {
    constructedPrompt = `${characterTokens}, ${continuityBridge} ${cleanedUserPrompt}`;
  } else if (characterTokens) {
    constructedPrompt = `${characterTokens}, ${cleanedUserPrompt}`;
  } else if (continuityBridge) {
    constructedPrompt = `${continuityBridge} ${cleanedUserPrompt}`;
  } else {
    constructedPrompt = cleanedUserPrompt;
  }

  // 8. Predict Exit Latent Context for this Scene (to feed Scene N+1)
  const charNames = activeCharacters.map(c => c.name).join(' and ') || 'Subject';
  const exitLatentContext = `${charNames} completing scene action at ${duration}s mark, maintaining camera angle, gaze direction, and environmental illumination for seamless match-cut into Scene ${sceneIndex + 1}.`;

  return {
    constructedPrompt: constructedPrompt.trim(),
    updatedRegistry,
    activeCharacters,
    newlyIntroducedCharacter,
    exitLatentContext
  };
}

/**
 * Intelligent Narrative Continuation Predictor:
 * Generates the next logical, cinematic scene beat based on Scene N.
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
  const primaryChar = activeCharacters[0] || allRegistry[0] || { name: 'The protagonist', avatarEmoji: '👤' };
  const promptLower = currentScene.userPrompt.toLowerCase();

  let nextTitle = `Scene ${nextIdx}: Progression & Narrative Beat`;
  let nextPrompt = '';
  let nextSubtitleEn = '';
  let nextSubtitleNe = '';
  let framing = 'Tracking Medium Shot';
  let cameraMovement = 'Smooth Forward Tracking';
  let recommendedDuration: '4' | '8' | '12' = '8';

  // Pattern detection for narrative flow
  if (nextIdx === 2) {
    if (promptLower.includes('mountain') || promptLower.includes('himalaya') || promptLower.includes('valley') || promptLower.includes('everest')) {
      nextTitle = 'Scene 2: Mountain Trail & Village Arrival';
      nextPrompt = `Continuous tracking shot following ${primaryChar.name} descending stone steps into an ancient mountain village as prayer flags flutter in the warm golden light.`;
      nextSubtitleEn = 'Descending through the high mountain passes toward the heart of the village.';
      nextSubtitleNe = 'हिमालको उचाइबाट गाउँको आँगनतर्फ अघि बढ्दै।';
      framing = 'Medium Low-Angle Tracking (35mm)';
      cameraMovement = 'Lateral Steadicam';
      recommendedDuration = '8';
    } else if (promptLower.includes('temple') || promptLower.includes('stupa') || promptLower.includes('kathmandu') || promptLower.includes('monk')) {
      nextTitle = 'Scene 2: Sanctum Encounter & Ritual Action';
      nextPrompt = `${primaryChar.name} enters the stone courtyard of the sacred temple, lighting a row of warm butter lamps as soft aromatic incense smoke rises into the twilight.`;
      nextSubtitleEn = 'Lighting the sacred lamps as evening settles over the ancient courtyard.';
      nextSubtitleNe = 'साँझको शान्त वातावरणमा दीप प्रज्वलन गर्दै।';
      framing = 'Close Character Focus & Over-the-Shoulder';
      cameraMovement = 'Slow Push-In Orbit';
      recommendedDuration = '8';
    } else {
      nextTitle = `Scene 2: Action & Next Beat`;
      nextPrompt = `Direct continuation from Scene 1: ${primaryChar.name} reacts to the environment, stepping forward with purpose as the camera follows in smooth 4k cinematic movement.`;
      nextSubtitleEn = 'The journey continues forward with unwavering determination.';
      nextSubtitleNe = 'यात्रा निरन्तर अगाडि बढ्छ।';
      framing = 'Tracking Medium Shot';
      cameraMovement = 'Dynamic Dolly Forward';
      recommendedDuration = '8';
    }
  } else if (nextIdx === 3) {
    nextTitle = 'Scene 3: Climax Encounter / Shared Horizon';
    nextPrompt = `Dramatic dynamic shot of ${primaryChar.name} reaching the high vantage point overlook as the clouds break, revealing the vast glowing landscape in full cinematic splendor.`;
    nextSubtitleEn = 'At the summit ridge, the horizon reveals its breathtaking secret.';
    nextSubtitleNe = 'शिखरको चुचुरोमा पुगेपछि क्षितिजको अनुपम दृश्य देखिन्छ।';
    framing = 'Wide 24mm Anamorphic Master';
    cameraMovement = 'Sweeping Crane Pull-Back';
    recommendedDuration = '12';
  } else {
    nextTitle = `Scene ${nextIdx}: Resolution & Stinger`;
    nextPrompt = `Epic cinematic pull-back establishing shot of ${primaryChar.name} standing against the glowing twilight sky as the story reaches its resolution, 4k photorealistic cinematic finish.`;
    nextSubtitleEn = 'A timeless story written in the light of the Himalayas.';
    nextSubtitleNe = 'समयको पानामा कोरिएको एउटा अमर यात्रा।';
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
 * Initialize a default 3-scene project workflow from an initial user prompt
 */
export function initializeProjectContinuity(initialPrompt: string, aspectRatio: '16:9' | '9:16' = '16:9'): ProjectContinuityState {
  const { extractedCharacter } = extractCharactersFromPrompt(initialPrompt, 1, []);
  const initialRegistry: DynamicCharacterIdentity[] = extractedCharacter ? [extractedCharacter] : [];

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
    framing: 'Cinematic Wide 35mm Master',
    cameraMovement: 'Smooth Slow Push-In',
    lightingAtmosphere: 'Natural Alpenglow Warm Golden Hour',
    exitLatentContext: scene1Resolution.exitLatentContext,
    status: 'idle',
    subtitleEn: 'In the vast terrain, the journey begins.',
    subtitleNe: 'विशाल भूभागमा, यात्राको थालनी हुन्छ।',
    characterTokensInjected: scene1Resolution.activeCharacters.map(c => c.anchorToken)
  };

  // Predict Scene 2
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
    lightingAtmosphere: 'Warm Sunset Light with Volumetric Mist',
    exitLatentContext: scene2Resolution.exitLatentContext,
    status: 'idle',
    subtitleEn: scene2Prediction.nextSubtitleEn,
    subtitleNe: scene2Prediction.nextSubtitleNe,
    characterTokensInjected: scene2Resolution.activeCharacters.map(c => c.anchorToken)
  };

  // Predict Scene 3
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
    lightingAtmosphere: 'Dramatic Golden Crest Light',
    exitLatentContext: scene3Resolution.exitLatentContext,
    status: 'idle',
    subtitleEn: scene3Prediction.nextSubtitleEn,
    subtitleNe: scene3Prediction.nextSubtitleNe,
    characterTokensInjected: scene3Resolution.activeCharacters.map(c => c.anchorToken)
  };

  return {
    projectId: `proj-${Date.now()}`,
    characters: scene3Resolution.updatedRegistry,
    scenes: [scene1Node, scene2Node, scene3Node],
    worldTheme: 'Himalayan Cinematic Realism',
    visualStyle: 'Photorealistic 4k',
    aspectRatio,
    lastExitLatentContext: scene1Node.exitLatentContext
  };
}
