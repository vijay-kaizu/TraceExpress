import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translation_en from './en.json';
import translation_ja from './ja.json';

const resources = {
    en: {
        translation: translation_en,
    },
    ja: {
        translation: translation_ja,
    },
};

i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
        resources,
        interpolation: {
            escapeValue: false,
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'ja'],
        detection: {
            order: ['navigator', 'cookie', 'localStorage', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage', 'cookie'],
        },
    });

export default i18n;
