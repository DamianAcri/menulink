"use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

// Interface to match the database structure for delivery_links
interface DeliveryLink {
  id: string;
  restaurant_id: string;
  platform: string;
  url: string;
  display_order: number;
  created_at?: string;
}

type DeliveryLinksProps = {
  links?: DeliveryLink[];
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  restaurantId: string; // Añadir el ID del restaurante como prop
  layoutName?: string; // Nombre del layout para tracking
};

function getDeviceType() {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Opera Mini/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
}

export default function DeliveryLinks({ links = [], themeColors, restaurantId, layoutName = 'unknown' }: DeliveryLinksProps) {
  const [visibleLinks, setVisibleLinks] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Añade animación de entrada con un ligero retraso para cada botón
    const timer = setTimeout(() => {
      links.forEach((link, index) => {
        setTimeout(() => {
          setVisibleLinks(prev => new Set([...prev, link.id]));
        }, index * 150);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [links]);

  // No renderizar nada si no hay enlaces
  if (!links || links.length === 0) {
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

  // Registrar el click en delivery
  const trackClick = async (_platform: string, linkId: string) => {
    try {
      const sessionId = localStorage.getItem('menulink_session_id') || 'unknown';
      
      console.log('Tracking delivery click:', {
        platform: 'delivery',
        linkId,
        restaurantId,
        sessionId,
        layoutName
      });
      
      const { data, error } = await supabase.from('button_clicks').insert({
        restaurant_id: restaurantId,
        button_type: 'delivery',
        delivery_link_id: linkId,
        clicked_at: new Date().toISOString(),
        device_type: getDeviceType(),
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        layout_name: layoutName,
        user_session_id: sessionId,
        utm_source: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') || null : null,
        utm_medium: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_medium') || null : null,
        utm_campaign: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_campaign') || null : null
      }).select();
      
      if (error) {
        console.error('Supabase error tracking click:', error);
      } else {
        console.log('Click tracked successfully:', data);
      }
    } catch (e) {
      // No mostrar error al usuario
      console.error('Error al registrar click:', e);
    }
  };

  // Sort links by display_order
  const sortedLinks = [...links].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="py-8 w-full">
      <h2 className="text-center font-bold text-lg mb-6" style={{ color: themeColors.primary }}>
        Pedir a domicilio
      </h2>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto px-4">
        {sortedLinks.map((link, index) => {
          // Verifica si la plataforma es válida
          const platformInfo = DELIVERY_PLATFORMS[link.platform as keyof typeof DELIVERY_PLATFORMS];
          if (!platformInfo) return null;
          
          const isVisible = visibleLinks.has(link.id);
          // Determina el color de texto según el fondo
          const textColor = isColorLight(themeColors.primary) ? '#1f2937' : '#fff';
          
          return (
            <a
              key={link.id}
              href={link.url}
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
              onClick={() => trackClick(link.platform, link.id)}
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