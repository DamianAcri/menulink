"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

type HeaderProps = {
  name: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
};

export default function Header({ name, description, logo_url, themeColors }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      // Si después de 2 segundos la imagen no ha cargado, mostrar el contenido de todas formas
      setImageLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <header className={`w-full flex flex-col items-center justify-center py-16 transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Logo centrado y pequeño */}
      {logo_url && (
        <div className="relative w-16 h-16 mb-3 rounded-full overflow-hidden border-2 border-white shadow bg-white flex items-center justify-center">
          <Image
            src={logo_url}
            alt={`Logo de ${name}`}
            fill
            className="object-contain"
            priority
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      )}
      {/* Nombre */}
      <h1 className="text-4xl font-extrabold text-center" style={{ color: themeColors.primary }}>{name}</h1>
      {/* Descripción */}
      {description && (
        <p className="text-gray-400 text-sm text-center mt-2 mb-6 max-w-md">{description}</p>
      )}
      {/* Botón grande "Pedir a domicilio" */}
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
