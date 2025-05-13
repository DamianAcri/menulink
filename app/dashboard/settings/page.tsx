"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

export default function ConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("es");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [restaurant, setRestaurant] = useState<any>(null);
  const [reservationMode, setReservationMode] = useState("form");
  const [savingSettings, setSavingSettings] = useState(false);
  const [enableLanguageSelector, setEnableLanguageSelector] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const { t } = useTranslation();
  
  // Nuevos estados para la configuración de reservas
  const [maxPartySize, setMaxPartySize] = useState(10);
  
  // Función para cambiar el idioma
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
    i18n.changeLanguage(e.target.value);
    localStorage.setItem('lang', e.target.value);
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
      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.access_token) {
        throw new Error("No hay sesión de usuario");
      }
      
      // Llamar a nuestra API serverless para eliminar el usuario por completo
      const response = await fetch('/api/user/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      // Verificar primero si la respuesta es ok antes de intentar parsear el JSON
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        
        // Si la respuesta es JSON, intentar extraer el mensaje de error
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error del servidor: ${response.status}`);
        } else {
          // Si no es JSON, usar el texto de la respuesta
          const errorText = await response.text();
          throw new Error(`Error del servidor: ${response.status} - ${errorText || 'Sin detalles'}`);
        }
      }
      
      // Cerrar sesión y redirigir
      await supabase.auth.signOut();
      
      // Mostrar mensaje de éxito
      alert("Tu cuenta ha sido eliminada completamente.");
      router.push('/');
      
    } catch (error) {
      console.error("Error al eliminar cuenta:", error);
      alert("Hubo un problema al eliminar la cuenta. Por favor, contacta con soporte.\n" + 
        (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  // Cargar datos del restaurante y configuración de reservas
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }
        
        // Buscar el restaurante del usuario
        const { data: restaurantData, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error al cargar datos del restaurante:', error);
          return;
        }
        
        // Actualizar el estado
        setRestaurant(restaurantData);
        setReservationMode(restaurantData.reservation_mode || 'form');
        setLanguage(restaurantData.language || 'en');
        setEnableLanguageSelector(!!restaurantData.enable_language_selector);
        setEmailNotifications(
          typeof restaurantData.email_notifications === 'boolean'
            ? restaurantData.email_notifications
            : true
        );
        i18n.changeLanguage(restaurantData.language || 'en');
        localStorage.setItem('lang', restaurantData.language || 'en');
        
        // Cargar configuración de reservas
        if (restaurantData.id) {
          // Cargar el tamaño máximo de grupo
          const { data: slotData } = await supabase
            .from('reservation_time_slots')
            .select('max_party_size')
            .eq('restaurant_id', restaurantData.id)
            .limit(1)
            .single();
          
          if (slotData?.max_party_size) {
            setMaxPartySize(slotData.max_party_size);
          }
        }
        
      } catch (error) {
        console.error('Error al cargar la página de configuración:', error);
      }
    };
    
    fetchRestaurantData();
  }, [router]);

  // Función para guardar configuración
  const handleSaveSettings = async () => {
    if (!restaurant) return;
    
    setSavingSettings(true);
    
    try {
      // Actualizar configuración general
      const { error } = await supabase
        .from('restaurants')
        .update({
          reservation_mode: reservationMode,
          language: language,
          enable_language_selector: enableLanguageSelector,
          email_notifications: emailNotifications
        })
        .eq('id', restaurant.id);
      
      if (error) throw error;
      
      // Actualizar tamaño máximo de grupo en todos los slots
      // Cambiar el método para actualizar cada slot en lugar de filtrar por restaurant_id 
      // (que no funciona en PATCH con la política de seguridad actual)
      const { data: allSlots, error: fetchError } = await supabase
        .from('reservation_time_slots')
        .select('id')
        .eq('restaurant_id', restaurant.id);
        
      if (fetchError) throw fetchError;
      
      // Actualizar cada slot individualmente por ID
      for (const slot of allSlots || []) {
        await supabase
          .from('reservation_time_slots')
          .update({ max_party_size: maxPartySize })
          .eq('id', slot.id);
      }
      
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSavingSettings(false);
    }
  };

  // Función para ir a la página de gestión completa de reservas
  const goToReservationsPage = () => {
    router.push('/dashboard/reservations');
  };

  // Inicializar preferencias cuando el componente se monta
  useState(() => {
    // Verificar preferencia de modo oscuro guardada
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  });

  // Nombres de los días de la semana
  const dayNames = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">{t('settings_title', 'Configuración')}</h1>
      
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('general_preferences', 'Preferencias Generales')}</h2>
        </div>
        
        <div className="px-4 py-5 sm:p-6 space-y-6">
          {/* Selección de idioma */}
          <div>
            <label htmlFor="language" className="block text-md font-medium text-gray-900">{t('dashboard_language', 'Idioma del dashboard')}</label>
            <select
              id="language"
              name="language"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t('dashboard_language_help', 'Este idioma se usará en todo el panel de administración y, si no activas el selector público, también en la web pública.')}
            </p>
          </div>
          {/* Selector de idioma público */}
          <div className="flex items-center mt-4">
            <input
              id="enable-language-selector"
              name="enable-language-selector"
              type="checkbox"
              checked={enableLanguageSelector}
              onChange={e => setEnableLanguageSelector(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enable-language-selector" className="ml-2 block text-sm text-gray-900">
              {t('enable_public_language_selector', 'Permitir a los clientes elegir idioma en la web pública')}
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t('public_language_selector_help', 'Si activas esta opción, aparecerá un pequeño selector de idioma en la web pública (abajo a la izquierda). Si no, la web pública usará el idioma del dashboard.')}
          </p>
          
          {/* Configuración del formulario de reservas */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2">Sistema de Reservas</h3>
            <p className="text-sm text-gray-500 mb-4">
              Decide cómo quieres gestionar las reservas de tu restaurante
            </p>
            <div className="space-y-2 mb-6">
              <div className="flex items-center">
                <input
                  id="reservation-enabled"
                  name="reservation-mode"
                  type="radio"
                  checked={reservationMode === 'form'}
                  onChange={() => setReservationMode('form')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="reservation-enabled" className="ml-3 block text-sm font-medium text-gray-700">
                  Activar - Mostrar el formulario de reservas a los clientes
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="reservation-disabled"
                  name="reservation-mode"
                  type="radio"
                  checked={reservationMode === 'disabled'}
                  onChange={() => setReservationMode('disabled')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="reservation-disabled" className="ml-3 block text-sm font-medium text-gray-700">
                  Desactivar - Ocultar el formulario de reservas
                </label>
              </div>
            </div>
            {reservationMode === 'form' && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Configuración básica de reservas</h4>
                <div className="mb-4">
                  <label htmlFor="max-party-size" className="block text-sm font-medium text-gray-700 mb-1">
                    Tamaño máximo de grupo
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id="max-party-size"
                      min="1"
                      max="50"
                      value={maxPartySize}
                      onChange={(e) => setMaxPartySize(parseInt(e.target.value) || 1)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-20 sm:text-sm border-gray-300 rounded-md"
                    />
                    <span className="ml-2 text-sm text-gray-500">personas</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Este es el número máximo de personas que un cliente puede seleccionar al hacer una reserva
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Para gestionar las franjas horarias de reservas, ve a la página de Reservas.
                  </p>
                  <button 
                    type="button"
                    onClick={goToReservationsPage}
                    className="button-primary"
                  >
                    Gestionar horarios
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Notificaciones por email al restaurante */}
          <div className="flex items-center mt-4">
            <input
              id="email-notifications"
              name="email-notifications"
              type="checkbox"
              checked={emailNotifications}
              onChange={e => setEmailNotifications(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900">
              Recibir notificaciones por email de nuevas reservas
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mt-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Seguridad</h2>
        </div>
        
        <div className="px-4 py-5 sm:p-6 space-y-6">
          {/* Cambiar contraseña */}
          <div>
            <h3 className="text-md font-medium text-gray-900">Cambiar contraseña</h3>
            <p className="text-sm text-gray-500 mb-4">Actualiza tu contraseña para mayor seguridad</p>
            <button
              type="button"
              onClick={handleChangePassword}
              className="button-primary"
            >
              Cambiar contraseña
            </button>
          </div>
          
          {/* Eliminar cuenta */}
          <div>
            <h3 className="text-md font-medium text-gray-900">Eliminar cuenta</h3>
            <p className="text-sm text-gray-500 mb-4">Eliminar permanentemente tu cuenta y todos tus datos</p>
            
            {!deleteConfirmOpen ? (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="button-primary"
              >
                Eliminar cuenta
              </button>
            ) : (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-sm font-medium text-red-600 mb-2">
                  Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Para confirmar, escribe &quot;ELIMINAR&quot; en el campo a continuación:
                </p>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md mr-4"
                    placeholder="ELIMINAR"
                  />
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== "ELIMINAR" || loading}
                    className={`button-primary ${deleteInput === "ELIMINAR" ? '' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    {loading ? "Eliminando..." : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setDeleteInput("");
                    }}
                    className="button-outline ml-3"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mt-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Privacidad</h2>
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
            <label htmlFor="cookies" className="ml-2 block text-sm text-gray-900">
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
            <label htmlFor="analytics" className="ml-2 block text-sm text-gray-900">
              Permitir análisis anónimo de uso
            </label>
          </div>
          
          <div>
            <a href="/privacy-policy" className="text-blue-600 hover:text-blue-800 text-sm">
              Ver política de privacidad completa
            </a>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="button-primary"
        >
          {savingSettings ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}