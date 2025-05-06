import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Ejemplo de recursos, puedes expandirlos o moverlos a archivos JSON después
const resources = {
  es: {
    translation: {
      bienvenido: 'Bienvenido',
      seleccionar_idioma: 'Selecciona tu idioma',
      guardar: 'Guardar',
      cancelar: 'Cancelar',
      espanol: 'Español',
      ingles: 'Inglés',
      frances: 'Francés',
    },
  },
  en: {
    translation: {
      bienvenido: 'Welcome',
      seleccionar_idioma: 'Select your language',
      guardar: 'Save',
      cancelar: 'Cancel',
      espanol: 'Spanish',
      ingles: 'English',
      frances: 'French',
    },
  },
  fr: {
    translation: {
      bienvenido: 'Bienvenue',
      seleccionar_idioma: 'Choisissez votre langue',
      guardar: 'Enregistrer',
      cancelar: 'Annuler',
      espanol: 'Espagnol',
      ingles: 'Anglais',
      frances: 'Français',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'fr'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
