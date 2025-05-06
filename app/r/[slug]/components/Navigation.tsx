"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import i18n from '@/lib/i18n';

type Section = {
  id: string;
  label: string;
};

type NavigationProps = {
  sections: Section[];
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  logoUrl?: string;
  restaurantName: string;
  enableLanguageSelector?: boolean;
  defaultLanguage?: string;
};

// Selector de idioma flotante
function FloatingLanguageSelector({ language, onChange, visible }: { language: string, onChange: (lang: string) => void, visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', left: 16, bottom: 16, zIndex: 1000 }} className="bg-white dark:bg-gray-900 rounded-full shadow-lg px-3 py-2 flex items-center gap-2 border border-gray-200 dark:border-gray-700">
      <button onClick={() => onChange('es')} className={`text-xl ${language === 'es' ? '' : 'opacity-60'}`}>🇪🇸</button>
      <button onClick={() => onChange('en')} className={`text-xl ${language === 'en' ? '' : 'opacity-60'}`}>🇬🇧</button>
      <button onClick={() => onChange('fr')} className={`text-xl ${language === 'fr' ? '' : 'opacity-60'}`}>🇫🇷</button>
    </div>
  );
}

export default function Navigation({ sections, themeColors, logoUrl, restaurantName, enableLanguageSelector = false, defaultLanguage = 'en' }: NavigationProps) {
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [language, setLanguage] = useState(defaultLanguage);

  // Detectar scroll para cambiar el estilo de la navegación
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 80);
      
      // Determinar qué sección está visible
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id)
      })).filter(item => item.element);
      
      // Encontrar la sección activa basada en la posición de scroll
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Determinar sección inicial
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sections]);

  useEffect(() => {
    // Inicializar idioma desde localStorage o prop
    const savedLang = localStorage.getItem('lang');
    const lang = savedLang || defaultLanguage;
    setLanguage(lang);
    i18n.changeLanguage(lang);
  }, [defaultLanguage]);

  const handleLangChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <>
      <div 
        className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-md ${
          isScrolled ? 'py-3 shadow-md bg-white/90' : 'py-4 bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo y nombre del restaurante */}
            <div className="flex items-center">
              {logoUrl && (
                <a 
                  href="#top" 
                  className="flex-shrink-0 mr-3"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className={`relative ${isScrolled ? 'w-8 h-8' : 'w-10 h-10'} overflow-hidden rounded-md transition-all duration-300`}>
                    <Image 
                      src={logoUrl} 
                      alt={restaurantName} 
                      className="object-cover w-full h-full" 
                      layout="fill"
                    />
                  </div>
                </a>
              )}
              <a 
                href="#top"
                className={`font-medium transition-all duration-300 ${
                  isScrolled ? 'text-lg' : 'text-xl'
                }`}
                style={{ color: themeColors.primary }}
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {restaurantName}
              </a>
            </div>
            
            {/* Links de navegación */}
            <nav className="hidden md:flex space-x-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeSection === section.id 
                      ? 'bg-white/50 shadow-sm' 
                      : 'hover:bg-white/30'
                  }`}
                  style={{ 
                    color: activeSection === section.id ? themeColors.primary : themeColors.text
                  }}
                >
                  {section.label}
                </a>
              ))}
            </nav>
            
            {/* Menú móvil */}
            <div className="md:hidden">
              <div className="px-2 flex items-center space-x-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      activeSection === section.id ? 'w-3 bg-primary' : 'bg-gray-300'
                    }`}
                    style={{ 
                      backgroundColor: activeSection === section.id ? themeColors.primary : undefined
                    }}
                    aria-label={section.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <FloatingLanguageSelector language={language} onChange={handleLangChange} visible={!!enableLanguageSelector} />
    </>
  );
}