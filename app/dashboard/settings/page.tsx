"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState("es");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  
  // Función para cambiar el idioma
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
    // Implementar la lógica para cambiar el idioma
  };
  
  // Función para cambiar contraseña
  const handleChangePassword = () => {
    router.push('/auth/reset-password');
  };
  
  // Función para eliminar cuenta
  const handleDeleteAccount = async () => {
    if (deleteInput !== "ELIMINAR") {
      return;
    }
    setLoading(true);
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("No hay sesión de usuario");
        return;
      }
      // Buscar restaurante asociado al usuario
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (restaurantError) throw restaurantError;
      if (restaurant && restaurant.id) {
        // Eliminar datos relacionados (contact_info, social_links, delivery_links, menu_categories, menu_items, opening_hours, page_views)
        await supabase.from('contact_info').delete().eq('restaurant_id', restaurant.id);
        await supabase.from('social_links').delete().eq('restaurant_id', restaurant.id);
        await supabase.from('delivery_links').delete().eq('restaurant_id', restaurant.id);
        await supabase.from('opening_hours').delete().eq('restaurant_id', restaurant.id);
        await supabase.from('page_views').delete().eq('restaurant_id', restaurant.id);
        // Eliminar categorías y platos
        const { data: categories } = await supabase.from('menu_categories').select('id').eq('restaurant_id', restaurant.id);
        if (categories && categories.length > 0) {
          const categoryIds = categories.map((cat: any) => cat.id);
          await supabase.from('menu_items').delete().in('category_id', categoryIds);
          await supabase.from('menu_categories').delete().eq('restaurant_id', restaurant.id);
        }
        // Eliminar restaurante
        await supabase.from('restaurants').delete().eq('id', restaurant.id);
      }
      // Eliminar la cuenta de autenticación
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error("Error al eliminar cuenta:", error, JSON.stringify(error), error instanceof Error ? error.message : "");
      alert("Hubo un problema al eliminar la cuenta. Por favor, contacta con soporte.\n" + (error instanceof Error ? error.message : JSON.stringify(error)));
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };
  
  // Inicializar preferencias cuando el componente se monta
  useState(() => {
    // Verificar preferencia de modo oscuro guardada
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Configuración</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Preferencias Generales</h2>
        </div>
        
        <div className="px-4 py-5 sm:p-6 space-y-6">
          {/* Selección de idioma */}
          <div>
            <label htmlFor="language" className="block text-md font-medium text-gray-900 dark:text-white">Idioma</label>
            <select
              id="language"
              name="language"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg mt-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Seguridad</h2>
        </div>
        
        <div className="px-4 py-5 sm:p-6 space-y-6">
          {/* Cambiar contraseña */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white">Cambiar contraseña</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Actualiza tu contraseña para mayor seguridad</p>
            <button
              type="button"
              onClick={handleChangePassword}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cambiar contraseña
            </button>
          </div>
          
          {/* Eliminar cuenta */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white">Eliminar cuenta</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Eliminar permanentemente tu cuenta y todos tus datos</p>
            
            {!deleteConfirmOpen ? (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Eliminar cuenta
              </button>
            ) : (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <p className="text-sm font-medium text-red-600 mb-2">
                  Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Para confirmar, escribe "ELIMINAR" en el campo a continuación:
                </p>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white mr-4"
                    placeholder="ELIMINAR"
                  />
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== "ELIMINAR" || loading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${deleteInput === "ELIMINAR" ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                  >
                    {loading ? "Eliminando..." : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setDeleteInput("");
                    }}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg mt-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Privacidad</h2>
        </div>
        
        <div className="px-4 py-5 sm:p-6 space-y-6">
          {/* Opciones de privacidad */}
          <div className="flex items-center">
            <input
              id="cookies"
              name="cookies"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              defaultChecked
            />
            <label htmlFor="cookies" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Permitir cookies para mejorar la experiencia
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="analytics"
              name="analytics"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              defaultChecked
            />
            <label htmlFor="analytics" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Permitir análisis anónimo de uso
            </label>
          </div>
          
          <div>
            <a href="/privacy-policy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
              Ver política de privacidad completa
            </a>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}