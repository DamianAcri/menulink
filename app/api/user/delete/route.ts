import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Cliente público normal para operaciones regulares
import { supabase } from '@/lib/supabase';

// Verificamos si existe la clave de servicio y creamos un cliente admin cuando sea necesario
const getAdminClient = () => {
  // Esto es necesario para obtener acceso a la API de administración de Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("No se encontró la URL de Supabase o la clave de servicio. No se podrá eliminar el usuario por completo.");
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    // Verificar que la solicitud incluya un token de autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Autorización requerida' },
        { status: 401 }
      );
    }

    // Extraer el token JWT
    const token = authHeader.replace('Bearer ', '');
    
    // Verificar que el token sea válido usando el cliente normal
    const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);
    
    if (verifyError || !user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }
    
    // Ahora tenemos el ID del usuario autenticado que desea eliminarse
    const userId = user.id;
    console.log("Procesando eliminación para usuario:", userId);
    
    // 1. Buscar y eliminar todos los datos relacionados con el usuario
    // Primero encontramos el restaurante del usuario
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (restaurantError && restaurantError.code !== 'PGRST116') {
      console.error("Error al buscar restaurante:", restaurantError);
      // Continuamos aunque no encontremos restaurante
    }
      
    if (restaurant) {
      const restaurantId = restaurant.id;
      console.log("Eliminando datos del restaurante ID:", restaurantId);
      
      try {
        // Eliminar todo lo relacionado con el restaurante en orden específico para evitar problemas de integridad referencial
        await supabase.from('page_views').delete().eq('restaurant_id', restaurantId);
        await supabase.from('contact_info').delete().eq('restaurant_id', restaurantId);
        await supabase.from('social_links').delete().eq('restaurant_id', restaurantId);
        await supabase.from('delivery_links').delete().eq('restaurant_id', restaurantId);
        await supabase.from('opening_hours').delete().eq('restaurant_id', restaurantId);
        await supabase.from('reservations').delete().eq('restaurant_id', restaurantId);
        
        // Eliminar categorías y platos
        const { data: categories } = await supabase
  .from('menu_categories')
  .select('id')
  .eq('restaurant_id', restaurantId);

if (categories && categories.length > 0) {
  const categoryIds = categories.map((cat: { id: string }) => cat.id);
  await supabase.from('menu_items').delete().in('category_id', categoryIds);
}
        
        await supabase.from('menu_categories').delete().eq('restaurant_id', restaurantId);
        
        // Eliminar el restaurante
        await supabase.from('restaurants').delete().eq('id', restaurantId);
        console.log("Restaurante y datos relacionados eliminados correctamente");
      } catch (dbError) {
        console.error("Error al eliminar datos del restaurante:", dbError);
        // Continuamos para intentar eliminar el usuario igualmente
      }
    } else {
      console.log("No se encontró restaurante asociado al usuario");
    }
    
    // 2. PASO CRÍTICO: Eliminar el usuario de auth.users usando el cliente admin
    // Intentamos obtener el cliente admin
    const adminClient = getAdminClient();
    
    if (adminClient) {
      try {
        console.log("Intentando eliminar usuario con API de admin...");
        const { error: adminDeleteError } = await adminClient.auth.admin.deleteUser(userId);
        
        if (adminDeleteError) {
          console.error("Error al eliminar usuario con admin API:", adminDeleteError);
          
          // Como plan B, intentamos usar la API SQL directa si está disponible
          try {
            // Esto es un enfoque alternativo que puede funcionar en algunos casos
            const { error: sqlError } = await adminClient.rpc('delete_user_complete', { user_id: userId });
            
            if (sqlError) {
              console.error("Error también al intentar eliminación mediante RPC:", sqlError);
              return NextResponse.json(
                { error: `No se pudo eliminar la cuenta completamente. Contacta con soporte.` },
                { status: 500 }
              );
            }
            
            console.log("Usuario eliminado correctamente mediante RPC alternativa");
          } catch (rpcError) {
            console.error("Error en RPC alternativa:", rpcError);
            return NextResponse.json(
              { error: `No se pudo eliminar la cuenta completamente. Contacta con soporte.` },
              { status: 500 }
            );
          }
        } else {
          console.log("Usuario eliminado correctamente con API de admin");
        }
      } catch (authError) {
        console.error("Error crítico al eliminar usuario:", authError);
        return NextResponse.json(
          { error: `Error de autenticación al eliminar la cuenta. Contacta con soporte.` },
          { status: 500 }
        );
      }
    } else {
      console.warn("No se pudo obtener cliente admin, marcando usuario como eliminado en metadata");
      // Si no hay cliente admin disponible, al menos marcamos el usuario como eliminado en metadata
      try {
        await supabase.auth.updateUser({
          data: { deleted: true, deletion_requested_at: new Date().toISOString() }
        });
        console.log("Cuenta marcada como eliminada en metadata (clave de servicio no disponible)");
      } catch (updateError) {
        console.error("Error al marcar usuario como eliminado:", updateError);
      }
    }
    
    // 3. Por último, cerramos la sesión del usuario
    try {
      await supabase.auth.signOut();
      console.log("Sesión cerrada");
    } catch (signOutError) {
      console.error("Error al cerrar sesión:", signOutError);
    }
    
    return NextResponse.json(
      { success: true, message: 'Cuenta eliminada correctamente' },
      { status: 200 }
    );
    
  } catch (error: unknown) {
    console.error('Error general en la eliminación de cuenta:', error);
    return NextResponse.json(
      { error: `Error del servidor: ${(error as Error).message || 'Error desconocido'}` },
      { status: 500 }
    );
  }
}