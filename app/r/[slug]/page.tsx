import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import SocialLinks from './components/SocialLinks';
import DeliveryLinks from './components/DeliveryLinks';
import MenuSection from './components/MenuSection';
import ContactSection from './components/ContactSection';
import Header from './components/Header';
import ReservationSection from './components/ReservationSection';

// Generamos metadata estática para evitar errores
export const metadata: Metadata = {
  title: 'Menú Digital | MenuLink',
  description: 'Visualiza el menú y la información de contacto del restaurante',
};

// Track page views
async function trackPageView(restaurantId: string) {
  try {
    await supabase
      .from('page_views')
      .insert({
        restaurant_id: restaurantId,
        viewed_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

// Tipo para los parámetros
type RestaurantPageProps = {
  params: Promise<{ slug: string }>
}

export default async function RestaurantPage(props: RestaurantPageProps) {
  try {
    // Acceder a params de manera asíncrona siguiendo las recomendaciones de Next.js 15
    const { slug } = await props.params;
    
    // Utilizar la propiedad de manera segura
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        menu_categories(
          id,
          name,
          description,
          display_order,
          menu_items(
            id,
            name,
            description,
            price,
            image_url,
            is_featured,
            is_available,
            display_order
          )
        ),
        social_links(
          id,
          platform,
          url,
          display_order
        ),
        delivery_links(
          id,
          platform,
          url,
          display_order
        )
      `)
      .eq('slug', slug)
      .single();

    // Para desarrollo, mostrar información de diagnóstico
    if (process.env.NODE_ENV === 'development' && !restaurant) {
      console.error('Error de Supabase:', error);
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Restaurante no encontrado</h1>
            
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 mb-4">
              <p className="font-mono text-sm">Slug buscado: <strong>{slug}</strong></p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold mb-2">Posibles causas:</h2>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li>El restaurante no existe en la base de datos</li>
                  <li>El slug está mal escrito o usa otro formato</li>
                  <li>Problemas con la conexión a Supabase</li>
                </ul>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h2 className="font-semibold mb-2">Error de Supabase:</h2>
                <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto text-xs">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Si no existe el restaurante, mostrar 404
    if (!restaurant) {
      notFound();
    }

    // Actualizamos la metadata para la página actual
    if (restaurant) {
      metadata.title = `${restaurant.name} | MenuLink`;
      metadata.description = restaurant.description || `Menú digital de ${restaurant.name}`;
    }

    // Obtener información de contacto del restaurante
    const { data: contactInfo } = await supabase
      .from('contact_info')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .single();

    // Obtener horarios de apertura
    const { data: openingHours } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('day_of_week', { ascending: true });

    // Combinar la información de contacto y horarios con el objeto del restaurante
    const restaurantWithDetails = {
      ...restaurant,
      contact: contactInfo || {},
      opening_hours: openingHours || []
    };

    // Track this page view
    await trackPageView(restaurant.id);

    // Extraer los colores personalizados del restaurante o usar colores por defecto
    const themeColors = {
      primary: restaurant.theme_color || '#3b82f6',
      secondary: restaurant.secondary_color || '#1E40AF',
      background: '#ffffff',
      text: '#1f2937',
    };

    // Configurar la fuente personalizada
    const fontFamily = restaurant.font_family || 'Inter, sans-serif';

    return (
      <main className="min-h-screen" style={{ background: '#fff', color: themeColors.text, fontFamily }}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header: Logo + Nombre + Descripción + Botón */}
          <Header
            name={restaurant.name}
            description={restaurant.description}
            logo_url={restaurant.logo_url}
            cover_url={restaurant.cover_url}
            themeColors={themeColors}
          />
          {/* Sección de menús */}
          <MenuSection 
            categories={restaurant.menu_categories} 
            themeColors={themeColors} 
          />
          {/* Sección de reservas */}
          <ReservationSection
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            themeColors={themeColors}
          />
          {/* Sección de contacto */}
          <ContactSection 
            restaurant={restaurantWithDetails} 
            themeColors={themeColors} 
          />
        </div>
        
        {/* Footer */}
        <footer className="text-xs text-gray-400 text-center py-6">
          <p>Creado con <a href="/" className="hover:underline font-medium" style={{ color: themeColors.primary }}>MenuLink</a></p>
        </footer>
      </main>
    );
  } catch (error) {
    console.error('Error al cargar la página del restaurante:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h1 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Error al cargar el restaurante</h1>
          <p className="text-gray-700 dark:text-gray-300">Lo sentimos, ha ocurrido un error al cargar esta página.</p>
        </div>
      </div>
    );
  }
}