import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import pt from './locales/pt.json';
import es from './locales/es.json';
import en from './locales/en.json';

// Detect browser language manually
const getBrowserLang = (): string => {
  const stored = localStorage.getItem('i18nextLng');
  if (stored && ['pt', 'es', 'en'].includes(stored)) return stored;
  
  const nav = navigator.language?.substring(0, 2) || 'pt';
  if (['pt', 'es', 'en'].includes(nav)) return nav;
  return 'pt';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      es: { translation: es },
      en: { translation: en },
    },
    lng: getBrowserLang(),
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
  });

// Persist language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;
