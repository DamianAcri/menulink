"use client";

import { useRef, useEffect, useState } from 'react';

type ContactInfo = {
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
};

type OpeningHour = {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
};

type Restaurant = {
  contact?: ContactInfo;
  opening_hours?: OpeningHour[];
  [key: string]: unknown;
};

type ContactSectionProps = {
  restaurant: Restaurant;
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
};

// Nombres de los días de la semana
const dayNames = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

// Función para formatear horas desde formato 24h a 12h
function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  
  try {
    // Extraer horas y minutos
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Formato AM/PM
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return timeStr;
  }
}

export default function ContactSection({ restaurant, themeColors }: ContactSectionProps) {
  const contact = restaurant.contact || {};
  const openingHours = restaurant.opening_hours || [];
  
  // Estado para controlar las animaciones al hacer scroll
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    // Configurar el observer para detectar elementos en el viewport
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id) {
          setVisibleSections((prev) => new Set([...prev, entry.target.id]));
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    // Observar todos los elementos guardados
    elementsRef.current.forEach((element) => {
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Función para registrar elementos para animación
  const registerElement = (id: string, element: HTMLElement | null) => {
    if (element && !elementsRef.current.has(id)) {
      elementsRef.current.set(id, element);
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    }
  };
  
  // Verificar si hay alguna información de contacto
  const hasContactInfo = Boolean(
    contact.address ||
    contact.phone ||
    contact.email ||
    contact.whatsapp ||
    (contact.latitude && contact.longitude) ||
    openingHours.length > 0
  );

  if (!hasContactInfo) return null;

  // Crear string de dirección completa
  const fullAddress = [
    contact.address,
    contact.city,
    contact.postal_code,
    contact.country
  ].filter(Boolean).join(', ');

  // Formatear horarios para mostrarlos organizados
  const formatOpeningHours = () => {
    if (!openingHours.length) return null;

    // Ordenar por día de la semana
    const sortedHours = [...openingHours].sort((a, b) => a.day_of_week - b.day_of_week);
    
    // Determinar día actual
    const today = new Date().getDay();

    return (
      <div className="space-y-1.5 w-full">
        {sortedHours.map((dayHour, idx) => {
          const isToday = dayHour.day_of_week === today;
          return (
            <div 
              key={dayHour.day_of_week} 
              className={`flex justify-between items-center py-2.5 px-4 rounded-lg ${
                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'border-l-2' : ''} transition-colors`}
              style={{ 
                borderLeftColor: isToday ? themeColors.primary : 'transparent'
              }}
            >
              <span className={`${isToday ? 'font-semibold' : ''} flex items-center`}>
                {dayNames[dayHour.day_of_week]}
                {isToday && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 uppercase tracking-wide">Hoy</span>}
              </span>
              <span className="font-mono text-sm">
                {dayHour.is_closed ? (
                  <span className="text-red-500">Cerrado</span>
                ) : (
                  `${formatTime(dayHour.opens_at)} - ${formatTime(dayHour.closes_at)}`
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="py-16" id="contacto" ref={(el) => registerElement('contact-section', el)}>
      {/* Título de sección con línea decorativa */}
      <div className="flex items-center gap-2 justify-center mb-10">
        <div className="w-8 h-px bg-gray-300"></div>
        <h2 className="text-gray-500 uppercase text-sm tracking-widest">Contacto</h2>
        <div className="w-8 h-px bg-gray-300"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column: Contact Details */}
        <div id="contact-details" ref={(el) => registerElement('contact-details', el)} className={`transition-all duration-700 ${visibleSections.has('contact-details') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="space-y-4">
            {fullAddress && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <span className="p-2 rounded-full" style={{ color: themeColors.primary }}>
                  {/* icono dirección */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </span>
                <div>
                  <div className="font-semibold text-base" style={{ color: themeColors.secondary }}>Dirección</div>
                  <div className="text-gray-600 text-sm">{fullAddress}</div>
                  {contact.latitude && contact.longitude && (
                    <a href={`https://maps.google.com/?q=${contact.latitude},${contact.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: `${themeColors.primary}10`, color: themeColors.primary }}>Ver en Google Maps</a>
                  )}
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <span className="p-2 rounded-full" style={{ color: themeColors.primary }}>
                  {/* icono teléfono */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                </span>
                <div>
                  <div className="font-semibold text-base" style={{ color: themeColors.secondary }}>Teléfono</div>
                  <a href={`tel:${contact.phone}`} className="text-gray-600 text-sm hover:text-gray-900 transition-colors">{contact.phone}</a>
                </div>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <span className="p-2 rounded-full" style={{ color: themeColors.primary }}>
                  {/* icono email */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </span>
                <div>
                  <div className="font-semibold text-base" style={{ color: themeColors.secondary }}>Email</div>
                  <a href={`mailto:${contact.email}`} className="text-gray-600 text-sm hover:text-gray-900 transition-colors">{contact.email}</a>
                </div>
              </div>
            )}
            {contact.whatsapp && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <span className="p-2 rounded-full" style={{ color: themeColors.primary }}>
                  {/* icono whatsapp */}
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </span>
                <div>
                  <div className="font-semibold text-base" style={{ color: themeColors.secondary }}>WhatsApp</div>
                  <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 text-sm hover:text-gray-900 transition-colors">{contact.whatsapp}</a>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Right column: Opening Hours */}
        {openingHours.length > 0 && (
          <div id="opening-hours" ref={(el) => registerElement('opening-hours', el)} className={`transition-all duration-700 delay-200 ${visibleSections.has('opening-hours') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-2 rounded-full" style={{ color: themeColors.primary }}>
                  {/* icono reloj */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </span>
                <div className="font-semibold" style={{ color: themeColors.secondary }}>Horarios de Apertura</div>
              </div>
              <div className="flex flex-col gap-2">
                {formatOpeningHours()}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}