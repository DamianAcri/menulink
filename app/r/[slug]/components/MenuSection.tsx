"use client";

import Image from 'next/image';
import { useRef, useEffect, useState } from 'react';

type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_featured: boolean;
  is_available: boolean;
  display_order: number;
};

type MenuCategory = {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  menu_items: MenuItem[];
};

type MenuSectionProps = {
  categories: MenuCategory[];
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
};

export default function MenuSection({ categories, themeColors }: MenuSectionProps) {
  // Estado para controlar las animaciones al hacer scroll
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    // Configurar el observer para detectar elementos en el viewport
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id) {
          setVisibleItems((prev) => new Set([...prev, entry.target.id]));
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

  if (!categories || categories.length === 0) return null;

  // Ordenar categorías por display_order
  const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);

  // Get featured items across all categories
  const featuredItems = sortedCategories.flatMap(cat => 
    cat.menu_items
      ?.filter(item => item.is_featured && item.is_available !== false)
      .sort((a, b) => a.display_order - b.display_order) || []
  );

  return (
    <section className="py-16">
      {/* Título de sección con línea decorativa */}
      <div className="flex items-center gap-4 justify-center mb-10">
        <div className="flex-1 h-px bg-gray-200" />
        <h2 className="text-gray-700 text-xl font-bold flex items-center gap-4">
          <span className="tracking-tight">Nuestro Menú</span>
        </h2>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      
      {/* Botón de reserva */}
      <div className="flex justify-center mb-10">
        <a 
          href="#reserva" 
          className="px-6 py-3 text-white rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
          style={{ backgroundColor: themeColors.primary }}
          onClick={(e) => {
            e.preventDefault();
            const reservationSection = document.getElementById('reserva');
            if (reservationSection) {
              reservationSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Reservar mesa
        </a>
      </div>

      {/* Platos destacados (si existen) */}
      {featuredItems.length > 0 && (
        <div className="mb-16" id="destacados" ref={(el) => registerElement('featured-section', el)}>
          <div className={`flex items-center gap-4 mb-8 transition-all duration-700 ${
            visibleItems.has('featured-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="h-px flex-grow bg-gray-200"></div>
            <h3 
              className="text-xl font-medium px-4 py-2 rounded-full bg-gray-50" 
              style={{ color: themeColors.secondary }}
            >
              Destacados
            </h3>
            <div className="h-px flex-grow bg-gray-200"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {featuredItems.map((item, idx) => (
              <div 
                key={item.id}
                id={`featured-${item.id}`}
                ref={(el) => registerElement(`featured-${item.id}`, el)}
                className={`group relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl 
                          border border-gray-100 hover:border-gray-200 transition-all duration-500
                          transform ${
                            visibleItems.has(`featured-${item.id}`) 
                              ? 'opacity-100 translate-y-0' 
                              : 'opacity-0 translate-y-8'
                          }`}
                style={{ transitionDelay: `${Math.min(idx * 150, 1000)}ms` }}
              >
                {item.image_url ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div 
                      className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-80"
                    />
                    <div className="absolute bottom-0 left-0 p-5 w-full">
                      <div className="flex justify-between items-end">
                        <h4 className="text-white text-2xl font-bold leading-tight">{item.name}</h4>
                        <span 
                          className="font-bold text-white bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full text-lg"
                        >
                          {typeof item.price === 'number' ? 
                            `${item.price.toFixed(2)}€` : 
                            item.price}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xl font-bold">{item.name}</h4>
                      <span 
                        className="font-bold text-lg px-3 py-1 rounded-full" 
                        style={{ 
                          backgroundColor: `${themeColors.primary}15`,
                          color: themeColors.primary 
                        }}
                      >
                        {typeof item.price === 'number' ? 
                          `${item.price.toFixed(2)}€` : 
                          item.price}
                      </span>
                    </div>
                  </div>
                )}
                {item.description && (
                  <div className="p-5 pt-3">
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorías y sus platos */}
      {sortedCategories.map((category, categoryIndex) => {
        // Si no hay platos en esta categoría, no mostrar
        if (!category.menu_items || category.menu_items.length === 0) return null;

        // Ordenar platos por display_order y filtrar los que no están disponibles
        const sortedItems = [...category.menu_items]
          .filter(item => item.is_available !== false)
          .sort((a, b) => a.display_order - b.display_order);

        if (sortedItems.length === 0) return null;

        const categoryId = `category-${category.id}`;

        return (
          <div key={category.id} className={`mb-16 ${categoryIndex > 0 ? 'mt-16' : ''}`}
            id={categoryId}
            ref={(el) => registerElement(categoryId, el)}>
            {/* Título de categoría con línea decorativa */}
            <div className="flex items-center gap-4 justify-center mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <h3 className="text-gray-700 text-base font-semibold flex items-center gap-4" style={{ color: themeColors.secondary }}>{category.name}</h3>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            
            {category.description && (
              <p className={`text-center text-gray-500 mb-8 max-w-2xl mx-auto transition-opacity duration-700 delay-200 ${
                visibleItems.has(categoryId) ? 'opacity-100' : 'opacity-0'
              }`}>
                {category.description}
              </p>
            )}
            
            <div className="space-y-6">
              {sortedItems.map((item, idx) => {
                const itemId = `${categoryId}-item-${item.id}`;
                return (
                  <div key={item.id} id={itemId} ref={(el) => registerElement(itemId, el)}
                    className={`bg-white rounded-xl p-4 shadow-md flex flex-col gap-2 transition-all duration-500 border border-gray-100 hover:border-gray-200 ${visibleItems.has(itemId) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${Math.min(idx * 100, 800)}ms` }}>
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-lg text-gray-900">{item.name}</h4>
                      <span className="font-bold text-base px-3 py-1 rounded-full bg-gray-50" style={{ color: themeColors.primary }}>{typeof item.price === 'number' ? `${item.price.toFixed(2)}€` : item.price}</span>
                    </div>
                    {item.description && (
                      <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}