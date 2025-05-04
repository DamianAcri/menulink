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
  ingredients?: string;
  allergens?: string[] | string;
  spice_level?: number;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  discount_percentage?: string;
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
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
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

  // Modal de detalle de plato
  const renderModal = () => {
    if (!modalItem) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setModalItem(null)}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
          <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={() => setModalItem(null)}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {modalItem.image_url && (
            <div className="mb-4 w-full aspect-[16/9] relative rounded-md overflow-hidden">
              <Image src={modalItem.image_url} alt={modalItem.name} fill className="object-cover" />
            </div>
          )}
          <h2 className="text-2xl font-bold mb-2" style={{ color: themeColors.primary }}>{modalItem.name}</h2>
          {modalItem.description && <p className="mb-2 text-gray-600 dark:text-gray-300">{modalItem.description}</p>}
          {modalItem.ingredients && <p className="mb-2 text-sm"><span className="font-semibold">Ingredientes:</span> {modalItem.ingredients}</p>}
          {modalItem.allergens && (
            <p className="mb-2 text-sm">
              <span className="font-semibold">Alérgenos:</span> {
                Array.isArray(modalItem.allergens)
                  ? modalItem.allergens.join(', ')
                  : typeof modalItem.allergens === 'string' && modalItem.allergens.includes(',')
                    ? modalItem.allergens.split(',').map(a => a.trim()).join(', ')
                    : modalItem.allergens
              }
            </p>
          )}
          {modalItem.spice_level ? (
            <div className="mb-2 flex items-center text-sm">
              <span className="font-semibold mr-2">Picante:</span>
              {[1,2,3,4,5].map(star => (
                <span key={star} className={star <= (modalItem.spice_level || 0) ? 'text-red-500' : 'text-gray-300'}>★</span>
              ))}
              <span className="ml-2">{modalItem.spice_level}/5</span>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 mb-2">
            {modalItem.is_vegetarian && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Vegetariano</span>}
            {modalItem.is_vegan && <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">Vegano</span>}
            {modalItem.is_gluten_free && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Sin gluten</span>}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-lg font-bold" style={{ color: themeColors.primary }}>{modalItem.price?.toFixed ? modalItem.price.toFixed(2) : modalItem.price}€</span>
            {modalItem.discount_percentage && modalItem.discount_percentage !== '0' && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{modalItem.discount_percentage}% dto.</span>
            )}
            {modalItem.is_featured && (
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded ml-2">Destacado</span>
            )}
          </div>
        </div>
      </div>
    );
  };

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
                onClick={() => setModalItem(item)}
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
                    className={`bg-white rounded-xl p-4 shadow-md flex flex-col gap-2 transition-all duration-500 border border-gray-100 hover:border-gray-200 ${visibleItems.has(itemId) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} cursor-pointer`}
                    style={{ transitionDelay: `${Math.min(idx * 100, 800)}ms` }}
                    onClick={() => setModalItem(item)}>
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-lg text-gray-900">{item.name}</h4>
                      <span className="font-bold text-base px-3 py-1 rounded-full bg-gray-50" style={{ color: themeColors.primary }}>{typeof item.price === 'number' ? `${item.price.toFixed(2)}€` : item.price}</span>
                    </div>
                    {item.image_url && (
                      <div className="w-full aspect-[16/9] relative rounded-md overflow-hidden mb-2">
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                      </div>
                    )}
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
      {renderModal()}
    </section>
  );
}