"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

type HeaderProps = {
  name: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
};

export default function Header({ name, description, logo_url, cover_image_url, themeColors }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setImageLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <header className={`w-full flex flex-col items-center justify-center transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {cover_image_url && (
        <div className="w-full max-w-3xl h-48 md:h-64 relative mb-4 rounded-xl overflow-hidden" style={{ minHeight: 160 }}>
          <Image
            src={cover_image_url}
            alt={`Imagen de portada de ${name}`}
            fill
            className="object-cover"
            priority
            onLoad={() => setImageLoaded(true)}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        </div>
      )}

      {logo_url && (
        <div className="relative w-16 h-16 mb-3 rounded-full overflow-hidden border-2 border-white shadow bg-white flex items-center justify-center z-10" style={{ marginTop: cover_image_url ? '-2.5rem' : 0 }}>
          <Image
            src={logo_url}
            alt={`Logo de ${name}`}
            fill
            className="object-contain"
            priority
          />
        </div>
      )}

      <h1 className="text-4xl font-extrabold text-center" style={{ color: themeColors.primary }}>{name}</h1>
      {description && (
        <p className="text-gray-400 text-sm text-center mt-2 mb-6 max-w-md">{description}</p>
      )}
      <a
        href="#delivery"
        className="bg-primary text-white px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all text-lg font-semibold mb-2"
        style={{ backgroundColor: themeColors.primary }}
      >
        Pedir a domicilio
      </a>
    </header>
  );
}