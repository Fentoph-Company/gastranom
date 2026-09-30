import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('gastronom_lang') || 'uz';
  });

  useEffect(() => {
    localStorage.setItem('gastronom_lang', lang);
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] || translations.uz[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
