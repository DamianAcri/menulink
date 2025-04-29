"use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';

// Definición de plataformas de delivery
const DELIVERY_PLATFORMS = {
  ubereats: {
    name: 'Uber Eats',
    icon: '/delivery/ubereats.svg'
  },
  deliveroo: {
    name: 'Deliveroo',
    icon: '/delivery/deliveroo.svg'
  },
  justeat: {
    name: 'Just Eat',
    icon: '/delivery/justeat.svg'
  },
  glovo: {
    name: 'Glovo',
    icon: '/delivery/glovo.svg'
  },
  delivery: {
    name: 'Delivery',
    icon: '/delivery/delivery.svg'
  }
};

type DeliveryLinksProps = {
  delivery_links?: Record<string, string>;
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
};

export default function DeliveryLinks({ delivery_links = {}, themeColors }: DeliveryLinksProps) {
  const [visibleLinks, setVisibleLinks] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Añade animación de entrada con un ligero retraso para cada botón
    const timer = setTimeout(() => {
      Object.keys(delivery_links).forEach((platform, index) => {
        setTimeout(() => {
          setVisibleLinks(prev => new Set([...prev, platform]));
        }, index * 150);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [delivery_links]);

  // No renderizar nada si no hay enlaces
  if (!delivery_links || Object.keys(delivery_links).length === 0) {
    return null;
  }

  // No renderizar durante SSR
  if (!mounted) {
    return null;
  }

  // Utilidad para determinar si un color es "claro" o "oscuro"
  function isColorLight(hex: string) {
    // Elimina el # si está presente
    hex = hex.replace('#', '');
    // Convierte a RGB
    const r = parseInt(hex.substring(0,2), 16);
    const g = parseInt(hex.substring(2,4), 16);
    const b = parseInt(hex.substring(4,6), 16);
    // Luminancia relativa
    const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
    return luminance > 0.7;
  }

  return (
    <div className="py-8 w-full">
      <h2 className="text-center font-bold text-lg mb-6" style={{ color: themeColors.primary }}>
        Pedir a domicilio
      </h2>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto px-4">
        {Object.entries(delivery_links).map(([platform, url], index) => {
          // Verifica si la plataforma es válida
          const platformInfo = DELIVERY_PLATFORMS[platform as keyof typeof DELIVERY_PLATFORMS];
          if (!platformInfo) return null;
          
          const isVisible = visibleLinks.has(platform);
          // Determina el color de texto según el fondo
          const textColor = isColorLight(themeColors.primary) ? '#1f2937' : '#fff';
          
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3.5 rounded-xl 
                        font-medium text-center shadow-lg transition-all duration-300 
                        transform hover:scale-105 hover:shadow-xl
                        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ 
                backgroundColor: themeColors.primary,
                color: textColor,
                transitionDelay: `${index * 0.15}s`
              }}
            >
              <div className="relative w-5 h-5">
                <Image
                  src={platformInfo.icon}
                  alt={platformInfo.name}
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-semibold">{platformInfo.name}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}