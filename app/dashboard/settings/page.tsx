"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("es");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [restaurant, setRestaurant] = useState<any>(null);
  const [reservationMode, setReservationMode] = useState("form");
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Nuevos estados para la configuración de reservas
  const [maxPartySize, setMaxPartySize] = useState(10);
  const [timeSlots, setTimeSlots] = useState<{day: number, slots: {start: string, end: string, maxCapacity: number}[]}[]>([]);
  const [selectedDay, setSelectedDay] = useState(1); // Lunes por defecto
  
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
          reservation_mode: reservationMode
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

  // Obtener slots para el día seleccionado
  const selectedDaySlots = timeSlots.find(day => day.day === selectedDay)?.slots || [];
  
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
          
          {/* Configuración del formulario de reservas */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Sistema de Reservas</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
                <label htmlFor="reservation-enabled" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                <label htmlFor="reservation-disabled" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Desactivar - Ocultar el formulario de reservas
                </label>
              </div>
            </div>
            
            {reservationMode === 'form' && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Configuración básica de reservas</h4>
                
                <div className="mb-4">
                  <label htmlFor="max-party-size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-20 sm:text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">personas</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Este es el número máximo de personas que un cliente puede seleccionar al hacer una reserva
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Para gestionar los horarios disponibles, ir a la página de reservas
                  </p>
                  <button 
                    type="button"
                    onClick={goToReservationsPage}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Gestionar horarios
                  </button>
                </div>
              </div>
            )}
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
                  Para confirmar, escribe &quot;ELIMINAR&quot; en el campo a continuación:
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
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {savingSettings ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}