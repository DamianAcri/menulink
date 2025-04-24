import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Configuración mejorada con opciones de almacenamiento y manejo de errores
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    // Añadir cabeceras personalizadas puede ayudar con problemas de CORS
    headers: { 'x-application-name': 'menulink' },
  },
});

// Función de ayuda para diagnóstico de permisos
export async function checkStoragePermissions() {
  try {
    // Verificar la sesión de usuario actual
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Sesión activa:', !!session);
    
    if (session) {
      console.log('Usuario ID:', session.user.id);
      console.log('Email:', session.user.email);
      
      // Intentar listar buckets para verificar permisos
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error al verificar permisos de storage:', error);
        return { success: false, error };
      }
      
      console.log('Buckets disponibles:', data);
      return { success: true, buckets: data };
    } else {
      console.error('No hay sesión activa');
      return { success: false, error: 'No hay sesión activa' };
    }
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    return { success: false, error };
  }
}