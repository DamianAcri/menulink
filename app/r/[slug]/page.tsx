import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MenuSection from './components/MenuSection';
import ContactSection from './components/ContactSection';
import Header from './components/Header';
import ReservationSection from './components/ReservationSection';
import Link from 'next/link';
import MinimalistLayout from './layouts/MinimalistLayout';
import TraditionalLayout from './layouts/TraditionalLayout';
import VisualLayout from './layouts/VisualLayout';
import Navigation from './components/Navigation';
import DeliveryLinks from './components/DeliveryLinks';
import SocialLinks from './components/SocialLinks';

export const metadata: Metadata = {
  title: 'Menú Digital | MenuLink',
  description: 'Visualiza el menú y la información de contacto del restaurante',
};

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

type RestaurantPageProps = {
  params: Promise<{ slug: string }>
}

// Define los tipos para los datos anidados
interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  is_featured: boolean;
  is_available: boolean;
  display_order: number;
  ingredients?: string | null;
  allergens?: string[] | null;
  spice_level?: number | null;
  is_vegetarian?: boolean | null;
  is_vegan?: boolean | null;
  is_gluten_free?: boolean | null;
  discount_percentage?: string | null;
}
interface MenuCategory {
  id: string;
  name: string;
  description?: string | null;
  display_order: number;
  menu_items: MenuItem[];
}

export default async function RestaurantPage(props: RestaurantPageProps) {
  try {
    const { slug } = await props.params;
    
    // Comprobar valores de conexión (sin mostrar claves completas por seguridad)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    console.log('Supabase URL configurada:', supabaseUrl ? 'Sí' : 'No');
    console.log('Slug recibido:', slug);

    // Primera prueba: comprobar si podemos hacer una consulta básica
    const testQuery = await supabase.from('restaurants').select('count').limit(1);
    console.log('Test de conexión básica:', testQuery.error ? 'Error' : 'OK');
    
    if (testQuery.error) {
      console.error('Error de conexión básica:', testQuery.error);
    }

    // Realizar la consulta principal con el slug
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
            display_order,
            ingredients,
            allergens,
            spice_level,
            is_vegetarian,
            is_vegan,
            is_gluten_free,
            discount_percentage
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
      .maybeSingle();
    
    console.log('Resultado de la consulta:', {
      encontrado: !!restaurant,
      error: error ? error.message : null
    });

    // Si no encontramos el restaurante, mostrar error o redirigir a 404
    if (!restaurant) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error de Supabase:', error || 'No se encontró el restaurante');
        
        // Intentar una búsqueda simple para ver si hay restaurantes disponibles
        const { data: allRestaurants, error: listError } = await supabase
          .from('restaurants')
          .select('slug, name')
          .limit(5);
        
        console.log('Restaurantes encontrados en la base de datos:', 
          allRestaurants ? allRestaurants.length : 0);
        
        if (listError) {
          console.error('Error al listar restaurantes:', listError);
        } else if (allRestaurants && allRestaurants.length > 0) {
          console.log('Algunos slugs disponibles:', allRestaurants.map(r => r.slug).join(', '));
        }

        return (
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Restaurante no encontrado</h1>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 mb-4">
                <p className="font-mono text-sm">Slug buscado: <strong>{slug}</strong></p>
                <p className="font-mono text-sm mt-2">URL de Supabase configurada: <strong>{supabaseUrl ? 'Sí' : 'No'}</strong></p>
                {testQuery.error && (
                  <p className="font-mono text-sm text-red-600 mt-2">Error de conexión: {testQuery.error.message}</p>
                )}
                {allRestaurants && allRestaurants.length > 0 && (
                  <div className="mt-4">
                    <p className="font-mono text-sm">Slugs disponibles en la base de datos:</p>
                    <ul className="list-disc pl-5 mt-1">
                      {allRestaurants.map(r => (
                        <li key={r.slug} className="font-mono text-xs">
                          {r.slug} ({r.name})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold mb-2">Posibles causas:</h2>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    <li>El restaurante no existe en la base de datos</li>
                    <li>El slug está mal escrito o usa otro formato</li>
                    <li>Problemas con la conexión a Supabase</li>
                    <li>Variables de entorno no configuradas correctamente</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      }
      notFound();
    }

    metadata.title = `${restaurant.name} | MenuLink`;
    metadata.description = restaurant.description || `Menú digital de ${restaurant.name}`;

    const { data: contactInfo } = await supabase
      .from('contact_info')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .maybeSingle();

    const { data: openingHours } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('day_of_week', { ascending: true });

    const restaurantWithDetails = {
      ...restaurant,
      contact: contactInfo || {},
      opening_hours: openingHours || []
    };

    // Normalizar datos para evitar errores en la UI
    if (restaurant && restaurant.menu_categories) {
      restaurant.menu_categories = (restaurant.menu_categories as MenuCategory[]).map((cat) => ({
        ...cat,
        menu_items: Array.isArray(cat.menu_items) ? cat.menu_items.map((item) => ({
          ...item,
          allergens: Array.isArray(item?.allergens)
            ? item.allergens
            : typeof item?.allergens === 'string' && (item.allergens as string).includes(',')
              ? (item.allergens as string).split(',').map((a: string) => a.trim()).filter(Boolean)
              : item.allergens ? [item.allergens as string] : [],
        })) : [],
      }));
    }

    await trackPageView(restaurant.id);

    const themeColors = {
      primary: restaurant.theme_color || '#3b82f6',
      secondary: restaurant.secondary_color || '#1E40AF',
      background: '#ffffff',
      text: '#1f2937',
    };

    const fontFamily = restaurant.font_family || 'Inter, sans-serif';

    const bucket = 'menulink';

    const coverUrl = restaurant.cover_image_url?.startsWith('http')
      ? restaurant.cover_image_url
      : restaurant.cover_image_url
        ? `${supabaseUrl}/storage/v1/object/public/${bucket}/${restaurant.cover_image_url}`
        : undefined;

    const logoUrl = restaurant.logo_url?.startsWith('http')
      ? restaurant.logo_url
      : restaurant.logo_url
        ? `${supabaseUrl}/storage/v1/object/public/${bucket}/${restaurant.logo_url}`
        : undefined;
    
    // Determine which template to use based on theme_type number
    let templateType = 'traditional';
    
    // Convert the numeric theme_type to string template name
    // (1 = traditional, 2 = minimalist, 3 = visual)
    switch (restaurant.theme_type) {
      case 2:
        templateType = 'minimalist';
        break;
      case 3:
        templateType = 'visual';
        break;
      case 1:
      default:
        templateType = 'traditional';
        break;
    }

    // Check if reservations are enabled based on the reservation_mode
    // If reservation_mode is 'disabled' or 'none', then reservations are disabled
    const showReservationForm = restaurant.reservation_mode !== 'disabled' && restaurant.reservation_mode !== 'none';

    // Common props for all layouts
    const layoutProps = {
      restaurant: restaurantWithDetails,
      coverUrl,
      logoUrl,
      themeColors,
      fontFamily,
      showReservationForm,
      enableLanguageSelector: !!restaurant.enable_language_selector,
      defaultLanguage: restaurant.language || 'en',
    };

    // Render the appropriate template based on templateType
    switch (templateType) {
      case 'minimalist':
        return <MinimalistLayout {...layoutProps} />;
      case 'visual':
        return <VisualLayout {...layoutProps} />;
      case 'traditional':
      default:
        return <TraditionalLayout {...layoutProps} />;
    }
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
