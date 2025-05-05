"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// 1. Definir tipos estrictos para las franjas y el estado de timeSlots

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface ReservationTimeSlot {
  id?: string;
  restaurant_id?: string;
  day_of_week: number; // 0=Sunday, 1=Monday...
  start_time: string;
  end_time: string;
  max_reservations: number;
  max_party_size: number;
  is_active: boolean;
}

type TimeSlotsState = Record<DayOfWeek, ReservationTimeSlot[]>;

export default function ConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("es");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [reservationMode, setReservationMode] = useState<'form' | 'external'>('form');
  const [timeSlots, setTimeSlots] = useState<TimeSlotsState>({
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

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

  // Inicializar preferencias cuando el componente se monta
  useState(() => {
    // Verificar preferencia de modo oscuro guardada
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  });

  // Cargar configuración actual del restaurante (modo y franjas) con tipado
  useEffect(() => {
    async function fetchReservationConfig() {
      const { data: restaurant } = await supabase.from('restaurants').select('reservation_mode, id').single();
      if (restaurant) setReservationMode((restaurant.reservation_mode || 'form') as 'form' | 'external');
      const { data: slots } = await supabase.from('reservation_time_slots').select('*').eq('restaurant_id', restaurant?.id);
      if (slots) {
        const grouped: TimeSlotsState = {monday:[],tuesday:[],wednesday:[],thursday:[],friday:[],saturday:[],sunday:[]};
        slots.forEach((slot: ReservationTimeSlot) => {
          const day = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][slot.day_of_week] as DayOfWeek;
          grouped[day].push(slot);
        });
        setTimeSlots(grouped);
      }
    }
    fetchReservationConfig();
  }, []);

  // Guardar cambios con tipado y comprobación de usuario
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    // Guardar modo
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setSaveMsg('No hay usuario autenticado.');
      setSaving(false);
      return;
    }
    // Obtener el restaurante del usuario
    const { data: restaurantRow } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();
    if (!restaurantRow) {
      setSaveMsg('No se encontró el restaurante.');
      setSaving(false);
      return;
    }
    await supabase.from('restaurants').update({ reservation_mode: reservationMode }).eq('id', restaurantRow.id);
    // Guardar franjas (borrar y reinsertar por simplicidad)
    await supabase.from('reservation_time_slots').delete().eq('restaurant_id', restaurantRow.id);
    const allSlots: ReservationTimeSlot[] = Object.entries(timeSlots).flatMap(([day, slots]) =>
      slots.map((slot) => ({
        ...slot,
        restaurant_id: restaurantRow.id,
        day_of_week: ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(day as DayOfWeek),
      }))
    );
    if (allSlots.length > 0) await supabase.from('reservation_time_slots').insert(allSlots);
    setSaveMsg('Configuración guardada');
    setSaving(false);
  };

  // Añadir/eliminar/editar franjas con tipado
  const addTimeSlot = (day: DayOfWeek) => {
    const slots = [...timeSlots[day]];
    slots.push({
      start_time: '',
      end_time: '',
      max_reservations: 5,
      max_party_size: 10,
      is_active: true,
      day_of_week: ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(day)
    });
    setTimeSlots({ ...timeSlots, [day]: slots });
  };
  const removeTimeSlot = (day: DayOfWeek, idx: number) => {
    const slots = [...timeSlots[day]];
    slots.splice(idx, 1);
    setTimeSlots({ ...timeSlots, [day]: slots });
  };
  const updateTimeSlotField = (day: DayOfWeek, idx: number, field: keyof ReservationTimeSlot, value: string | number | boolean) => {
    const slots = [...timeSlots[day]];
    slots[idx] = { ...slots[idx], [field]: value };
    setTimeSlots({ ...timeSlots, [day]: slots });
  };

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

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg mt-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Reservas</h2>
        </div>
        <div className="px-4 py-5 sm:p-6 space-y-6">
          {/* Selector de modo de reserva */}
          <div className="space-y-2">
            <h3 className="text-md font-medium text-gray-900 dark:text-white">Modo de reservas</h3>
            <div className="flex gap-4">
              <button type="button" className={`px-4 py-2 rounded-lg border ${reservationMode === 'form' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`} onClick={() => setReservationMode('form')}>Formulario online</button>
              <button type="button" className={`px-4 py-2 rounded-lg border ${reservationMode === 'external' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`} onClick={() => setReservationMode('external')}>Solo mensaje/llamada</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Si eliges solo mensaje/llamada, el formulario de reservas no se mostrará en tu página pública.</p>
          </div>
          {/* Editor de franjas tipo calendly */}
          {reservationMode === 'form' && (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Franjas de reserva</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {(Object.keys(timeSlots) as DayOfWeek[]).map((day) => (
                  <div key={day} className="border dark:border-gray-700 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                      <button type="button" className="text-blue-600 text-xs hover:underline" onClick={() => addTimeSlot(day)}>Añadir franja</button>
                    </div>
                    {timeSlots[day].length === 0 && (<div className="text-xs text-gray-400">No hay franjas para este día</div>)}
                    {timeSlots[day].map((slot, idx) => (
                      <div key={idx} className="flex flex-wrap gap-2 items-center mb-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <input type="time" value={slot.start_time} onChange={e => updateTimeSlotField(day, idx, 'start_time', e.target.value)} className="border px-2 py-1 rounded text-xs" />
                        <span className="text-xs">a</span>
                        <input type="time" value={slot.end_time} onChange={e => updateTimeSlotField(day, idx, 'end_time', e.target.value)} className="border px-2 py-1 rounded text-xs" />
                        <span className="text-xs">Máx. reservas</span>
                        <input type="number" min={1} value={slot.max_reservations} onChange={e => updateTimeSlotField(day, idx, 'max_reservations', parseInt(e.target.value))} className="border px-2 py-1 rounded text-xs w-16" />
                        <span className="text-xs">Máx. personas</span>
                        <input type="number" min={1} value={slot.max_party_size} onChange={e => updateTimeSlotField(day, idx, 'max_party_size', parseInt(e.target.value))} className="border px-2 py-1 rounded text-xs w-16" />
                        <button type="button" className="text-red-500 text-xs ml-2" onClick={() => removeTimeSlot(day, idx)}>Eliminar</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {saveMsg && <div className="text-green-600 text-sm">{saveMsg}</div>}
          <div className="flex justify-end">
            <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
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