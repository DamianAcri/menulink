"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Interfaces para tipos de datos
interface ContactInfo {
  id?: string;
  restaurant_id: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  whatsapp: string;
  email: string;
  updated_at?: string;  // Fecha de última modificación
}

interface OpeningHour {
  id?: string;
  restaurant_id: string;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
}

const DAYS_OF_WEEK = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default function ContactPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState({ type: "", message: "" });

  // Estados para formularios
  const [contactForm, setContactForm] = useState<ContactInfo>({
    restaurant_id: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    phone: '',
    whatsapp: '',
    email: '',
  });

  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
  
  // Cargar datos al iniciar
  useEffect(() => {
    const fetchContactData = async () => {
      try {
        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Obtener el restaurante del usuario
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (restaurantError || !restaurant) {
          console.error("Error fetching restaurant:", restaurantError);
          setLoading(false);
          return;
        }

        setRestaurantId(restaurant.id);

        // Buscar la información de contacto existente
        const { data: contactData, error: contactError } = await supabase
          .from('contact_info')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .single();

        if (contactError && contactError.code !== 'PGRST116') { // No encontrado
          console.error("Error fetching contact info:", contactError);
        } else if (contactData) {
          // Si existe información de contacto, cargarla en el formulario
          setContactForm(contactData);
        } else {
          // Si no existe, inicializar con el ID del restaurante
          setContactForm(prev => ({ ...prev, restaurant_id: restaurant.id }));
        }

        // Cargar horarios de apertura
        const { data: hoursData, error: hoursError } = await supabase
          .from('opening_hours')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('day_of_week', { ascending: true });

        if (hoursError) {
          console.error("Error fetching opening hours:", hoursError);
        } else if (hoursData && hoursData.length > 0) {
          // Si existen horarios, cargarlos
          setOpeningHours(hoursData);
        } else {
          // Si no existen, inicializar con horarios predeterminados para cada día
          const defaultHours = DAYS_OF_WEEK.map((_, index) => ({
            restaurant_id: restaurant.id,
            day_of_week: index,
            opens_at: "09:00",
            closes_at: "18:00",
            is_closed: index === 0, // Cerrado los domingos por defecto
          }));
          setOpeningHours(defaultHours);
        }
      } catch (error) {
        console.error("Error in contact page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactData();
  }, []);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContactForm({ ...contactForm, [name]: value });
  };

  const handleHoursChange = (index: number, field: keyof OpeningHour, value: unknown) => {
    const updatedHours = [...openingHours];
    updatedHours[index] = { ...updatedHours[index], [field]: value };
    setOpeningHours(updatedHours);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) {
      setSaveMessage({ type: "error", message: "No hay restaurante configurado." });
      return;
    }
  
    setSaving(true);
    setSaveMessage({ type: "", message: "" });
  
    try {
      // Guardar información de contacto: update o insert explícitos
      console.log('Datos de contacto previos:', JSON.stringify(contactForm, null, 2));
      let savedContact: ContactInfo;
      if (contactForm.id) {
        // Actualizar contacto existente
        const updatePayload = {
          address: contactForm.address,
          city: contactForm.city,
          postal_code: contactForm.postal_code,
          country: contactForm.country,
          phone: contactForm.phone,
          whatsapp: contactForm.whatsapp,
          email: contactForm.email,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
          .from('contact_info')
          .update(updatePayload)
          .eq('id', contactForm.id)
          .eq('restaurant_id', restaurantId)
          .select()
          .single();
        if (error) {
          console.error('Error al actualizar contacto:', error);
          setSaveMessage({ type: 'error', message: `Error al actualizar: ${error.message}` });
          setSaving(false);
          return;
        }
        savedContact = data;
      } else {
        // Insertar nuevo contacto
        const insertPayload = {
          restaurant_id: restaurantId,
          address: contactForm.address,
          city: contactForm.city,
          postal_code: contactForm.postal_code,
          country: contactForm.country,
          phone: contactForm.phone,
          whatsapp: contactForm.whatsapp,
          email: contactForm.email,
        };
        const { data, error } = await supabase
          .from('contact_info')
          .insert([insertPayload])
          .select()
          .single();
        if (error) {
          console.error('Error al insertar contacto:', error);
          setSaveMessage({ type: 'error', message: `Error al insertar: ${error.message}` });
          setSaving(false);
          return;
        }
        savedContact = data;
      }
      console.log('Contacto guardado:', savedContact);
      setContactForm(savedContact);
      // Guardar horarios de apertura - creamos una copia para realizar actualizaciones
      
      // Verificar horarios
      const updatedOpeningHours = [...openingHours];
      for (let i = 0; i < updatedOpeningHours.length; i++) {
        const hour = updatedOpeningHours[i];
        const hourData = {
          restaurant_id: restaurantId,
          day_of_week: hour.day_of_week,
          opens_at: hour.opens_at,
          closes_at: hour.closes_at,
          is_closed: hour.is_closed
        };
        
        if (hour.id) {
          const updateRes = await supabase
            .from('opening_hours')
            .update(hourData)
            .eq('id', hour.id)
            .select();
            
          if (updateRes.error) throw updateRes.error;
          
          // Actualizar el ID en caso de que haya cambiado
          if (updateRes.data && updateRes.data.length > 0) {
            updatedOpeningHours[i] = updateRes.data[0];
          }
        } else {
          const insertRes = await supabase
            .from('opening_hours')
            .insert(hourData)
            .select();
            
          if (insertRes.error) throw insertRes.error;
          if (insertRes.data && insertRes.data.length > 0) {
            // Actualizar el objeto con el ID asignado
            updatedOpeningHours[i] = insertRes.data[0];
          }
        }
      }
      
      // Actualizar el estado local con los horarios actualizados
      setOpeningHours(updatedOpeningHours);
  
      // Confirmar que todo se ha guardado correctamente
      setSaveMessage({
        type: "success",
        message: "Toda la información se ha guardado correctamente",
      });
      
      setTimeout(() => {
        setSaveMessage({ type: "", message: "" });
      }, 3000);
    } catch (error: unknown) {
      console.error("Error al guardar información:", error);
      setSaveMessage({
        type: "error",
        message: `Error al guardar: ${(error as Error).message || "Ocurrió un problema"}`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si no hay restaurante configurado, mostrar mensaje
  if (!restaurantId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">
          Necesitas completar la configuración de tu restaurante
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Antes de configurar la información de contacto, completa la información básica de tu restaurante.
        </p>
        <button
          onClick={() => window.location.href = "/dashboard"}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Ir al dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl">
            Información de Contacto
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configura la dirección, teléfono y horarios de tu negocio.
          </p>
        </div>
      </div>

      {saveMessage.message && (
        <div
          className={`p-4 mb-6 rounded-md ${
            saveMessage.type === "success"
              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          }`}
        >
          {saveMessage.message}
        </div>
      )}

      <form onSubmit={handleSaveContact} className="space-y-8">
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
            Ubicación y Contacto
          </h3>

          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
            <div className="sm:col-span-3">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dirección
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={contactForm.address}
                  onChange={handleContactChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Calle, número..."
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ciudad
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="city"
                  id="city"
                  value={contactForm.city}
                  onChange={handleContactChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Ciudad"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Código Postal
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="postal_code"
                  id="postal_code"
                  value={contactForm.postal_code}
                  onChange={handleContactChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Código postal"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                País
              </label>
              <div className="mt-1">
                <select
                  id="country"
                  name="country"
                  value={contactForm.country}
                  onChange={handleContactChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                >
                  <option value="">Seleccionar país...</option>
                  <option value="España">España</option>
                  <option value="México">México</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Chile">Chile</option>
                  <option value="Perú">Perú</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="Venezuela">Venezuela</option>
                  <option value="Uruguay">Uruguay</option>
                  <option value="Paraguay">Paraguay</option>
                  <option value="Bolivia">Bolivia</option>
                  <option value="Costa Rica">Costa Rica</option>
                  <option value="Panamá">Panamá</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Teléfono
              </label>
              <div className="mt-1">
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={contactForm.phone}
                  onChange={handleContactChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="+34 123456789"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Incluye el código de país (ej: +34 para España)
              </p>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                WhatsApp
              </label>
              <div className="mt-1">
                <input
                  type="tel"
                  name="whatsapp"
                  id="whatsapp"
                  value={contactForm.whatsapp}
                  onChange={handleContactChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="+34 123456789"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Si es diferente al teléfono principal
              </p>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email de contacto
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="contacto@turestaurante.com"
                />
              </div>
            </div>

            {/* Mapa con ubicación - Implementación futura
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ubicación en el mapa
              </label>
              <div className="mt-1 aspect-w-16 aspect-h-9 rounded-md bg-gray-200 dark:bg-gray-600 min-h-[200px]">
                {/* Aquí iría el componente de mapa */}
            {/*</div>
            </div>
            */}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
            Horarios de Apertura
          </h3>

          <div className="space-y-4">
            {openingHours.map((hour, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-2">
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {DAYS_OF_WEEK[hour.day_of_week]}
                  </span>
                </div>
                
                <div className="sm:col-span-9 flex items-center">
                  <div className="flex items-center">
                    <input
                      id={`closed-${index}`}
                      name={`closed-${index}`}
                      type="checkbox"
                      checked={hour.is_closed}
                      onChange={(e) => handleHoursChange(index, 'is_closed', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`closed-${index}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Cerrado
                    </label>
                  </div>
                  
                  {!hour.is_closed && (
                    <div className="ml-6 flex items-center space-x-2">
                      <div className="flex-1">
                        <label htmlFor={`opens-${index}`} className="block text-xs text-gray-500 dark:text-gray-400">
                          Abre
                        </label>
                        <input
                          type="time"
                          id={`opens-${index}`}
                          value={hour.opens_at}
                          onChange={(e) => handleHoursChange(index, 'opens_at', e.target.value)}
                          className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor={`closes-${index}`} className="block text-xs text-gray-500 dark:text-gray-400">
                          Cierra
                        </label>
                        <input
                          type="time"
                          id={`closes-${index}`}
                          value={hour.closes_at}
                          onChange={(e) => handleHoursChange(index, 'closes_at', e.target.value)}
                          className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => window.location.href = "/dashboard"}
            className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}