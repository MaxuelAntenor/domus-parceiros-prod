import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import ptBR from "./pt-BR.json";
import en from "./en.json";
import es from "./es.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { "pt-BR": { translation: ptBR }, en: { translation: en }, es: { translation: es } },
    fallbackLng: "pt-BR",
    detection: { order: ["querystring", "localStorage", "navigator"], lookupQuerystring: "lang", caches: ["localStorage"] },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
