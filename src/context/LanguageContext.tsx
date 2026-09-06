import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'ne' | 'hi' | 'en';

export interface LanguageMeta {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
  shortCode: string;
}

export const SUPPORTED_LANGUAGES: Record<AppLanguage, LanguageMeta> = {
  ne: {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    flag: '🇳🇵',
    shortCode: 'NE',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    shortCode: 'HI',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🌐',
    shortCode: 'EN',
  },
};

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  langMeta: LanguageMeta;
  t: (key: string, fallback?: string) => string;
}

// Global dictionary for key studio terms across the app
const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  ne: {
    'nav.landing': 'गृहपृष्ठ',
    'nav.hamro_ai': 'हाम्रो AI',
    'nav.video_studio': 'भिडियो स्टुडियो',
    'nav.image_studio': 'तस्वीर इन्जिन',
    'nav.sora_studio': 'सोरा-२ भिडियो',
    'nav.tts_studio': 'नेपाली आवाज',
    'nav.dashboard': 'ड्यासबोर्ड',
    'nav.refer_earn': 'साथी बोलाउनुहोस् र कमाउनुहोस्',
    'nav.templates': 'भाइरल टेम्प्लेट्स',
    'nav.tour': 'स्टुडियो गाइड',
    'btn.upgrade': 'अपग्रेड',
    'btn.signin': 'साइन इन',
    'btn.signout': 'साइन आउट',
    'btn.start_free': 'निःशुल्क सुरु गर्नुहोस्',
    'btn.use_template': 'टेम्प्लेट प्रयोग गर्नुहोस्',
    'btn.preview_storyboard': 'स्टोरीबोर्ड हेर्नुहोस्',
    'refer.title': 'साथी बोलाउनुहोस् र क्रेडिट कमाउनुहोस्',
    'refer.subtitle': 'तपाईंको रेफरल लिङ्क सेयर गर्नुहोस् र प्रत्येक साथी साइनअपमा +५० तथा पहिलो भिडियोमा +१५० क्रेडिट पाउनुहोस्!',
  },
  hi: {
    'nav.landing': 'होम',
    'nav.hamro_ai': 'हमरो AI',
    'nav.video_studio': 'वीडियो स्टूडियो',
    'nav.image_studio': 'इमेज इंजन',
    'nav.sora_studio': 'सोरा-२ वीडियो',
    'nav.tts_studio': 'आवाज डबिंग',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.refer_earn': 'रेफर करें और कमाएं',
    'nav.templates': 'वायरल टेम्पलेट्स',
    'nav.tour': 'स्टूडियो गाइड',
    'btn.upgrade': 'अपग्रेड करें',
    'btn.signin': 'साइन इन',
    'btn.signout': 'साइन आउट',
    'btn.start_free': 'फ्री शुरू करें',
    'btn.use_template': 'टेम्पलेट का उपयोग करें',
    'btn.preview_storyboard': 'स्टोरीबोर्ड देखें',
    'refer.title': 'रेफर करें और क्रेडिट्स कमाएं',
    'refer.subtitle': 'अपना रेफरल लिंक शेयर करें और हर दोस्त के साइनअप पर +50 तथा पहले वीडियो पर +150 क्रेडिट्स पाएं!',
  },
  en: {
    'nav.landing': 'Home',
    'nav.hamro_ai': 'HamroAI',
    'nav.video_studio': 'Video Studio',
    'nav.image_studio': 'Image Engine',
    'nav.sora_studio': 'Sora-2 Video',
    'nav.tts_studio': 'Voiceover',
    'nav.dashboard': 'Dashboard',
    'nav.refer_earn': 'Refer & Earn',
    'nav.templates': 'Viral Templates',
    'nav.tour': 'Studio Tour',
    'btn.upgrade': 'Upgrade',
    'btn.signin': 'Sign In',
    'btn.signout': 'Sign Out',
    'btn.start_free': 'Start Free',
    'btn.use_template': 'Use Template',
    'btn.preview_storyboard': 'Preview Storyboard',
    'refer.title': 'Refer Friends & Earn Credits',
    'refer.subtitle': 'Share your link and earn +50 credits per signup, plus +150 bonus credits on their first render!',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('nepalai_preferred_language') || localStorage.getItem('hamroai_preferred_language');
    if (saved === 'ne' || saved === 'hi' || saved === 'en') {
      return saved as AppLanguage;
    }
    return 'en';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('nepalai_preferred_language', lang);
    localStorage.setItem('hamroai_preferred_language', lang);
    // Also trigger custom event for any independent components
    window.dispatchEvent(new CustomEvent('nepalai_language_changed', { detail: { language: lang } }));
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nepalai_preferred_language' && e.newValue) {
        if (e.newValue === 'ne' || e.newValue === 'hi' || e.newValue === 'en') {
          setLanguageState(e.newValue as AppLanguage);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const t = (key: string, fallback?: string): string => {
    return TRANSLATIONS[language]?.[key] || fallback || key;
  };

  const langMeta = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, langMeta, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
