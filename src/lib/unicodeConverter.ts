/**
 * Nepali & Hindi Romanized to Devanagari Unicode Transliteration Engine
 * studio.nepalai.tech / HamroAI
 */

// Phonetic mapping dictionary for vowels (independent)
const VOWELS: Record<string, string> = {
  a: 'अ',
  aa: 'आ',
  A: 'आ',
  i: 'इ',
  ee: 'ई',
  I: 'ई',
  u: 'उ',
  oo: 'ऊ',
  U: 'ऊ',
  ri: 'ऋ',
  e: 'ए',
  E: 'ए',
  ai: 'ऐ',
  o: 'ओ',
  O: 'ओ',
  au: 'औ',
  am: 'अं',
  ah: 'अः',
};

// Matras (dependent vowels attached to consonants)
const MATRAS: Record<string, string> = {
  a: '',
  aa: 'ा',
  A: 'ा',
  i: 'ि',
  ee: 'ी',
  I: 'ी',
  u: 'ु',
  oo: 'ू',
  U: 'ू',
  ri: 'ृ',
  e: 'े',
  E: 'े',
  ai: 'ै',
  o: 'ो',
  O: 'ो',
  au: 'ौ',
  am: 'ं',
  ah: 'ः',
};

// Consonants without inherent 'a' (with virama)
const CONSONANTS: Record<string, string> = {
  k: 'क्',
  kh: 'ख्',
  g: 'ग्',
  gh: 'घ्',
  ng: 'ङ्',
  ch: 'च्',
  chh: 'छ्',
  j: 'ज्',
  jh: 'झ्',
  ny: 'ञ्',
  T: 'ट्',
  Th: 'ठ्',
  D: 'ड्',
  Dh: 'ढ्',
  N: 'ण्',
  t: 'त्',
  th: 'थ्',
  d: 'द्',
  dh: 'ध्',
  n: 'न्',
  p: 'प्',
  ph: 'फ्',
  f: 'फ्',
  b: 'ब्',
  bh: 'भ्',
  m: 'म्',
  y: 'य्',
  r: 'र्',
  l: 'ल्',
  w: 'व्',
  v: 'व्',
  sh: 'श्',
  Sh: 'ष्',
  s: 'स्',
  h: 'ह्',
  ksh: 'क्ष्',
  tr: 'त्र्',
  gy: 'ज्ञ्',
  shr: 'श्र्',
};

// Common word substitutions for high-fidelity natural Nepali / Hindi transliteration
const COMMON_WORDS_NE: Record<string, string> = {
  namaste: 'नमस्ते',
  namaskar: 'नमस्कार',
  nepal: 'नेपाल',
  nepali: 'नेपाली',
  mero: 'मेरो',
  timro: 'तिम्रो',
  tapai: 'तपाईं',
  tapaiko: 'तपाईंको',
  hajur: 'हजुर',
  k: 'के',
  ke: 'के',
  cha: 'छ',
  chha: 'छ',
  chaina: 'छैन',
  ho: 'हो',
  haina: 'होइन',
  dhanyabad: 'धन्यवाद',
  dhanyawaad: 'धन्यवाद',
  subhaprabhat: 'शुभप्रभात',
  subhadin: 'शुभदिन',
  subharatri: 'शुभरात्री',
  ramro: 'राम्रो',
  dherai: 'धेरै',
  sanchai: 'सञ्चै',
  thik: 'ठीक',
  thaha: 'थाहा',
  bhanus: 'भन्नुहोस्',
  garnus: 'गर्नुहोस्',
  lai: 'लाई',
  ko: 'को',
  ma: 'म',
  le: 'ले',
  bata: 'बाट',
  sangai: 'सँगै',
  pani: 'पनि',
  kina: 'किन',
  kasari: 'कसरी',
  kahile: 'कहिले',
  kaha: 'कहाँ',
  kun: 'कुन',
  kati: 'कति',
};

const COMMON_WORDS_HI: Record<string, string> = {
  namaste: 'नमस्ते',
  namaskar: 'नमस्कार',
  bharat: 'भारत',
  hindi: 'हिंदी',
  mera: 'मेरा',
  meri: 'मेरी',
  aap: 'आप',
  aapka: 'आपका',
  tum: 'तुम',
  kya: 'क्या',
  hai: 'है',
  hain: 'हैं',
  nahi: 'नहीं',
  nahin: 'नहीं',
  dhanyawad: 'धन्यवाद',
  shukriya: 'शुक्रिया',
  kaise: 'कैसे',
  kaisi: 'कैसी',
  kaisa: 'कैसा',
  achha: 'अच्छा',
  accha: 'अच्छा',
  bahut: 'बहुत',
  thik: 'ठीक',
  bataiye: 'बताइए',
  kijiye: 'कीजिए',
  ko: 'को',
  me: 'में',
  mein: 'में',
  se: 'से',
  bhi: 'भी',
  kyon: 'क्यों',
  kyu: 'क्यों',
  kyun: 'क्यों',
  kab: 'कब',
  kahan: 'कहाँ',
  kitna: 'कितना',
};

/**
 * Phonetic conversion of a single romanized token into Devanagari
 */
export function transliterateWord(word: string, language: 'ne' | 'hi' = 'ne'): string {
  if (!word) return '';
  
  // Check exact common words first
  const lower = word.toLowerCase();
  const dict = language === 'hi' ? COMMON_WORDS_HI : COMMON_WORDS_NE;
  if (dict[lower]) {
    return dict[lower];
  }

  let result = '';
  let i = 0;
  const len = word.length;

  while (i < len) {
    // Check 3-char consonant clusters
    const three = word.substring(i, i + 3).toLowerCase();
    if (CONSONANTS[three]) {
      const base = CONSONANTS[three];
      i += 3;
      // check if followed by vowel
      const nextTwo = word.substring(i, i + 2).toLowerCase();
      const nextOne = word.substring(i, i + 1).toLowerCase();

      if (MATRAS[nextTwo]) {
        result += base.slice(0, -1) + MATRAS[nextTwo];
        i += 2;
      } else if (MATRAS[nextOne] !== undefined) {
        result += base.slice(0, -1) + MATRAS[nextOne];
        i += 1;
      } else {
        // standalone consonant with inherent 'a'
        result += base.slice(0, -1);
      }
      continue;
    }

    // Check 2-char consonant clusters
    const two = word.substring(i, i + 2).toLowerCase();
    if (CONSONANTS[two]) {
      const base = CONSONANTS[two];
      i += 2;
      const nextTwo = word.substring(i, i + 2).toLowerCase();
      const nextOne = word.substring(i, i + 1).toLowerCase();

      if (MATRAS[nextTwo]) {
        result += base.slice(0, -1) + MATRAS[nextTwo];
        i += 2;
      } else if (MATRAS[nextOne] !== undefined) {
        result += base.slice(0, -1) + MATRAS[nextOne];
        i += 1;
      } else {
        result += base.slice(0, -1);
      }
      continue;
    }

    // Check 1-char consonant
    const one = word.substring(i, i + 1).toLowerCase();
    if (CONSONANTS[one]) {
      const base = CONSONANTS[one];
      i += 1;
      const nextTwo = word.substring(i, i + 2).toLowerCase();
      const nextOne = word.substring(i, i + 1).toLowerCase();

      if (MATRAS[nextTwo]) {
        result += base.slice(0, -1) + MATRAS[nextTwo];
        i += 2;
      } else if (MATRAS[nextOne] !== undefined) {
        result += base.slice(0, -1) + MATRAS[nextOne];
        i += 1;
      } else {
        result += base.slice(0, -1);
      }
      continue;
    }

    // Check independent vowels
    const vowelTwo = word.substring(i, i + 2).toLowerCase();
    if (VOWELS[vowelTwo]) {
      result += VOWELS[vowelTwo];
      i += 2;
      continue;
    }

    const vowelOne = word.substring(i, i + 1).toLowerCase();
    if (VOWELS[vowelOne]) {
      result += VOWELS[vowelOne];
      i += 1;
      continue;
    }

    // Fallback: keep existing character (punctuation, numbers, special characters)
    result += word[i];
    i += 1;
  }

  return result;
}

/**
 * Transliterates an entire text paragraph or sentence
 */
export function transliterateDevanagari(text: string, language: 'ne' | 'hi' = 'ne'): string {
  if (!text) return '';

  // Process word by word preserving whitespace and punctuation
  return text.replace(/[a-zA-Z]+/g, (match) => {
    return transliterateWord(match, language);
  });
}

/**
 * Quick Devanagari virtual pad symbols
 */
export const DEVANAGARI_SYMBOLS = [
  { label: '।', name: 'पूर्णविराम (Full Stop)' },
  { label: '्', name: 'ह्लन्त (Virama)' },
  { label: 'ं', name: 'अनुस्वार (Anusvara)' },
  { label: 'ँ', name: 'चन्द्रबिन्दु (Chandrabindu)' },
  { label: 'ः', name: 'विसर्ग (Visarga)' },
  { label: 'ॐ', name: 'ओम् (Om)' },
  { label: '₹', name: 'रुपैयाँ (Rupee Symbol)' },
  { label: 'ज्ञ', name: 'ज्ञ (Gya)' },
  { label: 'त्र', name: 'त्र (Tra)' },
  { label: 'क्ष', name: 'क्ष (Ksha)' },
  { label: 'श्र', name: 'श्र (Shra)' },
  { label: '०', name: '० (0)' },
  { label: '१', name: '१ (1)' },
  { label: '२', name: '२ (2)' },
  { label: '३', name: '३ (3)' },
  { label: '४', name: '४ (4)' },
  { label: '५', name: '५ (5)' },
  { label: '६', name: '६ (6)' },
  { label: '७', name: '७ (7)' },
  { label: '८', name: '८ (8)' },
  { label: '९', name: '९ (9)' },
];
