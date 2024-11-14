import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';

import translation_en from "./en.json";
import translation_ja from "./ja.json";

// import message_en from "./message.en.json";
// import message_ja from "./message.ja.json";
//
// import login_en from "./login.en.json";
// import login_ja from "./login.ja.json";
//
// import ecm_en from "./ecm.en.json";
// import edit_document_en from "./edit_document.en.json";

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
    en: {
        translation: translation_en,
        login: login_en,
        ecm: ecm_en,
        edit_document : edit_document_en
    },
    ja: {
        translation: translation_ja,
        login: login_ja
    }
};

// var defaultLanguage = localStorage.getItem("lang");
// if(defaultLanguage==null) defaultLanguage="en";

i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .use(LanguageDetector)
    .init({
        resources,
        //lng: "en", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
        // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
        // if you're using a language detector, do not define the lng option

        interpolation: {
            escapeValue: false // react already safes from xss
        },
        fallbackLng: "en"
    });

// i18n.addResources('en', 'message', message_en);
// i18n.addResources('ja', 'message', message_ja);
// i18n.addResources('en', 'ecm', ecm_en);
// i18n.addResources('en', 'edit_document_en', ecm_en);

//i18n.addResources('en', 'login', login_en);
//i18n.addResources('ja', 'login', login_ja);

export default i18n;