import { HamroPromptTemplate } from '../types';

export const HAMRO_PROMPT_TEMPLATES: HamroPromptTemplate[] = [
  // 1. Content Writing
  {
    id: 'tmpl_ne_blog_post',
    title: 'Nepali High-Impact Blog Article',
    titleNe: 'उच्च प्रभावकारी नेपाली ब्लग लेख',
    category: 'Content Writing',
    language: 'ne',
    description: 'Generates an SEO-optimized, engaging blog post in natural Nepali with catchy headings and call-to-action.',
    prompt: 'कृपया [विषय: नेपालमा पर्यटन व्यवसाय / प्रविधि विकास / स्वास्थ्य] सम्बन्धी १,००० शब्दको आकर्षक र एसईओ-अनुकूल ब्लग लेख लेख्नुहोस्। यसमा आकर्षक शीर्षक, परिचय, मुख्य उपशीर्षकहरू (बुलेट पोइन्टसहित) र अन्त्यमा प्रेरणादायी निष्कर्ष समावेश गर्नुहोस्।',
  },
  {
    id: 'tmpl_ne_press_release',
    title: 'Official Nepali Press Release',
    titleNe: 'औपचारिक नेपाली प्रेस विज्ञप्ति',
    category: 'Content Writing',
    language: 'ne',
    description: 'Drafts a professional media press release adhering to standard Nepali journalism formatting.',
    prompt: 'हाम्रो संस्था [कम्पनी/संस्थाको नाम] ले [नयाँ उत्पादन वा सेवाको सुरुवात / कार्यक्रम] गर्न लागेको सन्दर्भमा सञ्चारमाध्यमका लागि जारी गरिने औपचारिक प्रेस विज्ञप्तिको ढाँचा तयार गर्नुहोस्। मिति, स्थान, प्रमुख उद्देश्य, प्रमुख व्यक्तिको भनाइ र सम्पर्क विवरण समावेश गर्नुहोस्।',
  },
  {
    id: 'tmpl_hi_editorial',
    title: 'Hindi Thought Leadership Editorial',
    titleHi: 'हिंदी विचारोत्तेजक संपादकीय',
    category: 'Content Writing',
    language: 'hi',
    description: 'Drafts a thoughtful Hindi editorial piece for magazines or news portals.',
    prompt: 'कृपया [विषय: डिजिटल भारत में नवाचार / कृत्रिम बुद्धिमत्ता का भविष्य] पर एक विस्तृत, विचारोत्तेजक और प्रभावशाली संपादकीय लेख तैयार कीजिए। भाषा स्पष्ट, प्रभावशाली और गरिमामयी होनी चाहिए।',
  },

  // 2. Business & Marketing
  {
    id: 'tmpl_ne_social_ad_copy',
    title: 'Viral Facebook / TikTok Ad Copy (Nepali)',
    titleNe: 'फेसबुक र टिकटक विज्ञापन कपी',
    category: 'Business & Marketing',
    language: 'ne',
    description: 'High-converting Nepali ad copy with powerful hook, problem-solution format, and emojis.',
    prompt: 'मेरो उत्पादन/सेवा [उत्पादन वा सेवाको नाम र मुख्य फाइदाहरू] को लागि फेसबुक र टिकटकमा चलाउन ३ वटा फरक शैलीका उच्च रूपान्तरणकारी (High-converting) विज्ञापन कपीहरू तयार गर्नुहोस्। पहिलो ३ सेकेन्डको हुक, मुख्य समस्या, हाम्रो समाधान र बलियो Call to Action (CTA) राख्नुहोस्।',
  },
  {
    id: 'tmpl_ne_business_pitch',
    title: 'Investor Pitch Summary (Nepali & Global)',
    titleNe: 'लगानीकर्ता समक्ष पेस गर्ने व्यापारिक प्रस्ताव',
    category: 'Business & Marketing',
    language: 'all',
    description: 'Synthesizes market opportunity, business model, and growth metrics for angel investors in Nepal.',
    prompt: 'हाम्रो स्टार्टअप [स्टार्टअपको नाम र उद्देश्य] को लागि १-पेजको सशक्त Pitch Summary तयार गर्नुहोस्। यसमा समस्या (Problem), हाम्रो समाधान (Solution), बजारको सम्भाव्यता (TAM/SAM), आम्दानीको मोडेल (Monetization), र प्रतिस्पर्धी लाभ (Moat) स्पष्ट उल्लेख गर्नुहोस्।',
  },
  {
    id: 'tmpl_hi_sales_pitch',
    title: 'Hindi B2B Client Outreach Email',
    titleHi: 'हिंदी व्यावसायिक ईमेल प्रस्ताव',
    category: 'Business & Marketing',
    language: 'hi',
    description: 'Polite and persuasive B2B outreach email in corporate Hindi.',
    prompt: 'एक संभावित कॉर्पोरेट क्लाइंट को हमारी [सॉफ्टवेयर / मार्केटिंग / कन्सल्टिङ सेवा] का परिचय देने और 15 मिनट की परिचयात्मक बैठक तय करने के लिए एक शिष्ट और प्रभावशाली हिंदी ईमेल ड्राफ्ट करें।',
  },

  // 3. Nepali Law & Administration (सरकारी कामकाज र कानून)
  {
    id: 'tmpl_ne_govt_application',
    title: 'Official Government Application (निवेदन ढाँचा)',
    titleNe: 'सरकारी कार्यालयमा दिने निवेदनको ढाँचा',
    category: 'Nepali Law & Govt',
    language: 'ne',
    description: 'Legally compliant standard Nepali administrative application letter (निवेदन) for ward office, ministry or municipality.',
    prompt: 'श्रीमान् वडा अध्यक्षज्यू / प्रमुखज्यू, [कार्यालयको नाम, जस्तै: काठमाडौं महानगरपालिका वडा नं. ४] समक्ष [कामको व्यहोरा: व्यवसाय दर्ता सिफारिस / चारकिल्ला प्रमाणित / सडक मर्मत] का लागि पेश गरिने कानुनी रूपमा शुद्ध औपचारिक निवेदन पत्रको पूर्ण ढाँचा तयार गरिदिनुहोस्।',
  },
  {
    id: 'tmpl_ne_rent_agreement',
    title: 'Property Rental Agreement (घर/कोठा बहाल सम्झौता)',
    titleNe: 'घर/सटर/कोठा बहाल सम्झौता पत्र',
    category: 'Nepali Law & Govt',
    language: 'ne',
    description: 'Comprehensive tenancy contract in Nepali legal terminology with terms, deposit, and conditions.',
    prompt: 'नेपालको मुलुकी देवानी संहिता अनुसार घरधनी र बहालवाला बीच हुने [घर / सटर / फ्ल्याट] भाडा सम्झौता पत्रको कानुनी मस्यौदा तयार गर्नुहोस्। यसमा मासिक भाडादर, धरौटी रकम, मर्मत सम्भारको जिम्मेवारी, बिजुली/पानीको महसुल र सम्झौता रद्द गर्ने सर्तहरू स्पष्ट राख्नुहोस्।',
  },
  {
    id: 'tmpl_ne_rti_request',
    title: 'Right to Information (RTI - सूचनाको हक निवेदन)',
    titleNe: 'सूचनाको हक सम्बन्धी निवेदन',
    category: 'Nepali Law & Govt',
    language: 'ne',
    description: 'Drafts an RTI request under Right to Information Act 2064 of Nepal.',
    prompt: 'नेपालको सूचनाको हक सम्बन्धी ऐन, २०६४ को दफा ३ र ७ बमोजिम [सार्वजनिक निकाय वा मन्त्रालयको नाम] का सूचना अधिकारी समक्ष [माग गरिएको सूचनाको विवरण, जस्तै: सडक बजेट खर्च विवरण] प्राप्त गर्नका लागि कानुनबमोजिमको निवेदनको मस्यौदा तयार गर्नुहोस्।',
  },

  // 4. Creative & Scriptwriting (भिडियो कथा र गीत)
  {
    id: 'tmpl_ne_video_script_scene',
    title: 'Cinematic Short Film / Reel Script with Scenes',
    titleNe: 'दृश्यगत भिडियो तथा रिल स्क्रिप्ट (Timeline Ready)',
    category: 'Creative & Scriptwriting',
    language: 'ne',
    description: 'Generates scene-by-scene script with visual description, Nepali narration, and sound cues ready for Video Studio.',
    prompt: 'कृपया [विषय: काठमाडौंको बिहानी / हिमाली यात्रा / आधुनिक युवाको सपना] बारे ६० सेकेन्डको सिनेमाटिक भिडियोको लागि दृश्यगत स्क्रिप्ट (Scene-by-scene script) तयार गर्नुहोस्। प्रत्येक दृश्यमा: १. Visual Prompt (तस्बिर कस्तो देखिने), २. नेपाली Voiceover Narration, र ३. Sound/Music Cue छुट्ट्याएर लेख्नुहोस्।',
  },
  {
    id: 'tmpl_ne_song_lyrics',
    title: 'Nepali Lok / Modern Song Lyrics (गीतको शब्द)',
    titleNe: 'नेपाली आधुनिक वा लोकदोहोरी गीतको शब्द',
    category: 'Creative & Scriptwriting',
    language: 'ne',
    description: 'Poetic, rhyming lyrics formatted into Sthayi (स्थायी) and Antara (अन्तरा).',
    prompt: 'नेपाली लोक-पप वा आधुनिक शैलीमा [भाव: माया, बिछोड, परदेशीको पीडा वा देशप्रेम] झल्किने गरी एउटा भावुक गीतको शब्द रचना गर्नुहोस्। यसमा १ स्थायी (Chorus) र ३ वटा अन्तरा (Verses) लय मिल्ने गरी राख्नुहोस्।',
  },
  {
    id: 'tmpl_hi_youtube_story',
    title: 'Hindi Mystery / Inspirational Story Script',
    titleHi: 'हिंदी यूट्यूब कहानी एवं वॉइसओवर स्क्रिप्ट',
    category: 'Creative & Scriptwriting',
    language: 'hi',
    description: 'Suspenseful or motivational Hindi story script ideal for YouTube faceless narration.',
    prompt: 'कृपया [थीम: सफलता का रहस्य / एक गाँव का रहस्यमय मंदिर] पर 5 मिनट की यूट्यूब वॉइसओवर स्क्रिप्ट लिखें। इसमें शुरुआत में तीव्र सस्पेंस और अंत में गहरा जीवन संदेश होना चाहिए।',
  },

  // 5. Education & Academic (शिक्षा र परीक्षा तयारी)
  {
    id: 'tmpl_ne_academic_explainer',
    title: 'Complex Concept in Simple Nepali',
    titleNe: 'जटिल अवधारणा सरल नेपालीमा बुझाउने',
    category: 'Education & Academic',
    language: 'ne',
    description: 'Breaks down tough technical, scientific, or financial concepts into everyday Nepali metaphors.',
    prompt: 'कृपया [जटिल विषय: Quantum Computing / Artificial Intelligence / Stock Market Inflation] को अवधारणा कुनै पनि सामान्य विद्यार्थीले बुझ्न सक्ने गरी सरल नेपाली भाषा र गाउँघरको उदाहरण दिएर बुझाइदिनुहोस्।',
  },
  {
    id: 'tmpl_ne_grammar_guide',
    title: 'Nepali Grammar & Shuddha Shanti (शुद्ध नेपाली व्याकरण)',
    titleNe: 'नेपाली वर्णविन्यास र शुद्ध लेखन',
    category: 'Education & Academic',
    language: 'ne',
    description: 'Corrects spelling, hraswa-dirgha (ह्रस्व-दीर्घ) and grammatical structures with clear rules.',
    prompt: 'तलको अनुच्छेदमा भएका ह्रस्व, दीर्घ, पदयोग, पदवियोग र व्याकरण सम्बन्धी अशुद्धिहरू सच्याएर शुद्ध नेपालीमा रूपान्तरण गरिदिनुहोस् र के-के नियम प्रयोग गरियो, संक्षेपमा बुझाइदिनुहोस्:\n\n[यहाँ आफ्नो पाठ राख्नुहोस्]',
  },

  // 6. Coding & Tech (प्रविधि र प्रोग्रामिङ)
  {
    id: 'tmpl_code_react_component',
    title: 'Modern React + Tailwind Component (Full Stack)',
    titleNe: 'मोडर्न रियाक्ट + टेलविन्ड कम्पोनेन्ट',
    category: 'Coding & Tech',
    language: 'all',
    description: 'Generates production-grade TypeScript React component with Lucide icons and responsive Tailwind CSS.',
    prompt: 'Please write a production-ready, highly polished React + TypeScript component using Tailwind CSS and Lucide-React icons for [Feature: Video Timeline Player / Audio Recorder / User Billing Card]. Ensure clean typing, accessible buttons, and responsive design.',
  },
  {
    id: 'tmpl_code_python_automation',
    title: 'Python Script with Error Handling',
    titleNe: 'पाइथन अटोमेसन स्क्रिप्ट',
    category: 'Coding & Tech',
    language: 'all',
    description: 'Complete Python automation or API script with retry logic, logging, and type hints.',
    prompt: 'Write a robust Python 3.11 script that [Task: reads a CSV, calls Azure AI API with retry logic, and saves the generated media files locally]. Include type hints, structured error handling, and helpful terminal log output.',
  },

  // 7. Social Media & Influencer (भाइरल सामाजिक सञ्जाल)
  {
    id: 'tmpl_ne_viral_reel_hook',
    title: '10 Viral Nepali Hook Ideas for TikTok & Reels',
    titleNe: '१० वटा भाइरल नेपाली हुक आइडियाहरू',
    category: 'Social Media',
    language: 'ne',
    description: 'High retention scroll-stopping opening sentences in Nepali for content creators.',
    prompt: '[विषय: अनलाइन पैसा कमाउने तरिका / स्वास्थ्य टिप्स / नेपालको घुम्न लायक ठाउँहरू] का लागि टिकटक र इन्स्टाग्राम रिल्समा दर्शकलाई अड्याउन सक्ने १० वटा अत्यधिक आकर्षक र भाइरल नेपाली हुकहरू (Opening Hooks) तयार गर्नुहोस्।',
  },
  {
    id: 'tmpl_hi_linkedin_post',
    title: 'Bilingual Tech / Career LinkedIn Post',
    titleHi: 'हिंदी एवं इंग्लिश लिंक्डइन विचार पोस्ट',
    category: 'Social Media',
    language: 'all',
    description: 'Professional storytelling post sharing learnings, career growth, or technical breakthroughs.',
    prompt: 'Craft an insightful, engaging LinkedIn post about [Topic: Launching an AI startup in South Asia / Overcoming early product hurdles]. Structure with a strong opening line, concise storytelling body with 3 bulleted insights, and an engaging question at the end.',
  },

  // 8. Translation & Language Conversion (भाषा अनुवाद र रूपान्तरण)
  {
    id: 'tmpl_trans_roman_to_formal_ne',
    title: 'Roman Nepali to Formal Official Nepali (Devanagari)',
    titleNe: 'रोमन नेपालीबाट शुद्ध औपचारिक नेपालीमा रूपान्तरण',
    category: 'Translation',
    language: 'ne',
    description: 'Converts informal Romanized transliteration into beautiful, official Devanagari prose.',
    prompt: 'तल लेखिएको रोमन नेपाली (Romanized Nepali) पाठलाई शुद्ध, व्याकरणसम्मत र औपचारिक देवनागरी नेपालीमा रूपान्तरण गर्नुहोस् र भाव नबिग्रिने गरी सुधार्नुहोस्:\n\n[यहाँ रोमन पाठ टाँस्नुहोस्: e.g. mero company ko naya website aaja bata launch bhayo]',
  },
  {
    id: 'tmpl_trans_en_to_shuddh_hi',
    title: 'English to Natural Fluent Hindi',
    titleHi: 'अंग्रेजी से स्वाभाविक शुद्ध हिंदी अनुवाद',
    category: 'Translation',
    language: 'hi',
    description: 'Translates English technical or business text into natural, idiomatic Hindi.',
    prompt: 'Please translate the following English text into elegant, natural Hindi without robotic word-for-word translation. Preserve technical terms, URLs, and brand names in readable transliteration:\n\n[Insert English text here]',
  },
];
