"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type ReservationSectionProps = {
  restaurantId: string;
  restaurantName: string;
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
};

export default function ReservationSection({ restaurantId, restaurantName, themeColors }: ReservationSectionProps) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    party_size: 2,
    reservation_date: '',
    reservation_time: '',
    special_requests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [reservationMode, setReservationMode] = useState<'form' | 'external'>('form');
  const [timeSlots, setTimeSlots] = useState<any>({});
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [maxPartySize, setMaxPartySize] = useState<number>(12);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Cargar modo de reserva y franjas al montar
  useEffect(() => {
    async function fetchConfig() {
      setLoadingConfig(true);
      try {
        // Obtener el modo de reserva del restaurante
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('reservation_mode')
          .eq('id', restaurantId)
          .maybeSingle();
        
        if (restaurantError) throw restaurantError;
        setReservationMode((restaurant?.reservation_mode || 'form') as 'form' | 'external');
        
        // Obtener slots de reserva
        const { data: slots, error: slotsError } = await supabase
          .from('reservation_time_slots')
          .select('*')
          .eq('restaurant_id', restaurantId);
        
        if (slotsError) throw slotsError;

        // Procesar los slots de reserva
        if (slots && Array.isArray(slots)) {
          const grouped: any = {sunday:[],monday:[],tuesday:[],wednesday:[],thursday:[],friday:[],saturday:[]};
          slots.forEach(slot => {
            const day = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][slot.day_of_week];
            grouped[day].push(slot);
          });
          setTimeSlots(grouped);
        } else {
          setTimeSlots({sunday:[],monday:[],tuesday:[],wednesday:[],thursday:[],friday:[],saturday:[]});
        }
      } catch (error) {
        console.error('Error cargando configuración:', error);
        setTimeSlots({sunday:[],monday:[],tuesday:[],wednesday:[],thursday:[],friday:[],saturday:[]});
      } finally {
        setLoadingConfig(false);
      }
    }
    
    if (restaurantId) {
      fetchConfig();
    }
  }, [restaurantId]);

  // Actualizar horas/franjas disponibles cuando cambia la fecha
  useEffect(() => {
    if (!formData.reservation_date || !timeSlots) {
      setAvailableTimes([]);
      return;
    }
    
    try {
      const date = new Date(formData.reservation_date);
      const day = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][date.getDay()];
      const slots = (timeSlots[day] || []).filter((slot: any) => slot.is_active);
      
      // Ordenar las horas
      const times = slots.map((slot: any) => slot.start_time);
      setAvailableTimes(times.sort());
      
      // Establecer el tamaño máximo de grupo
      if (slots.length > 0) {
        setMaxPartySize(Math.max(...slots.map((s: any) => s.max_party_size || 10)));
        
        // Si no hay hora seleccionada y hay horas disponibles, seleccionar la primera
        if (!formData.reservation_time && times.length > 0) {
          setFormData(prev => ({ ...prev, reservation_time: times[0] }));
        } else if (!times.includes(formData.reservation_time)) {
          // Si la hora seleccionada ya no está disponible, limpiarla
          setFormData(prev => ({ ...prev, reservation_time: times[0] || '' }));
        }
      } else {
        setMaxPartySize(10);
      }
    } catch (error) {
      console.error('Error al procesar franjas horarias:', error);
      setAvailableTimes([]);
    }
  }, [formData.reservation_date, timeSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Evitar múltiples envíos
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmissionStatus('idle');
    setErrorMessage('');

    try {
      // Validaciones básicas
      if (!formData.customer_name || !formData.customer_email || !formData.customer_phone || 
          !formData.reservation_date || !formData.reservation_time) {
        throw new Error("Por favor, completa todos los campos obligatorios.");
      }

      // Validar que la hora seleccionada está en una franja válida
      const date = new Date(formData.reservation_date);
      const day = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][date.getDay()];
      const slots = (timeSlots[day] || []).filter((slot: any) => slot.is_active);
      
      const selectedSlot = slots.find((slot: any) =>
        formData.reservation_time === slot.start_time
      );
      
      if (!selectedSlot) {
        throw new Error('La hora seleccionada no está disponible para reservas.');
      }
      
      if (formData.party_size > selectedSlot.max_party_size) {
        throw new Error(`El máximo de personas por reserva en esta franja es ${selectedSlot.max_party_size}.`);
      }
      
      // Validar límite de reservas por franja
      const { error: countError, count } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('reservation_date', formData.reservation_date)
        .eq('reservation_time', formData.reservation_time);
      
      if (countError) {
        throw new Error('Error al comprobar disponibilidad. Inténtalo de nuevo.');
      }
      
      if (count !== null && count >= selectedSlot.max_reservations) {
        throw new Error('No quedan plazas disponibles en esta franja horaria.');
      }

      console.log("Creando reserva para restaurante ID:", restaurantId);
      
      // Insertar la reserva
      const { error: insertError } = await supabase
        .from('reservations')
        .insert([
          {
            restaurant_id: restaurantId,
            customer_name: formData.customer_name,
            customer_email: formData.customer_email,
            customer_phone: formData.customer_phone,
            party_size: formData.party_size,
            reservation_date: formData.reservation_date,
            reservation_time: formData.reservation_time,
            special_requests: formData.special_requests,
            status: 'pending',
            time_slot_id: selectedSlot.id
          }
        ]);
      
      if (insertError) throw insertError;

      // Añadir cliente al CRM si no existe
      try {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .eq('email', formData.customer_email)
          .maybeSingle();
        
        if (!existingCustomer) {
          const nameParts = formData.customer_name.trim().split(' ');
          const first_name = nameParts[0];
          const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '-';
          
          await supabase.from('customers').insert({
            restaurant_id: restaurantId,
            first_name,
            last_name,
            email: formData.customer_email,
            phone: formData.customer_phone || null,
          });
        }
      } catch (crmError) {
        console.error("Error al añadir cliente al CRM:", crmError);
        // No interrumpimos el flujo si falla la creación del cliente
      }

      // Éxito
      setSubmissionStatus('success');
      
      // Resetear el formulario
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        party_size: 2,
        reservation_date: '',
        reservation_time: '',
        special_requests: ''
      });
    } catch (error: unknown) {
      console.error('Error al crear la reserva:', error);
      setSubmissionStatus('error');
      setErrorMessage((error as Error).message || 'Ha ocurrido un error al procesar tu reserva. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtener la fecha actual formateada para el input date min
  const today = new Date().toISOString().split('T')[0];

  // Si el modo es external, solo mostrar instrucciones
  if (!loadingConfig && reservationMode === 'external') {
    return (
      <section className="py-16" id="reserva">
        <div className="flex items-center gap-4 justify-center mb-10">
          <div className="flex-1 h-px bg-gray-200" />
          <h2 className="text-gray-700 text-xl font-bold flex items-center gap-4">
            <span className="tracking-tight">Reserva tu mesa</span>
          </h2>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-100 text-center">
          <h3 className="text-lg font-semibold mb-4">Reserva por mensaje o llamada</h3>
          <p className="text-gray-600 mb-4">Este restaurante solo acepta reservas por teléfono o mensaje directo. Por favor, contacta usando los datos de contacto.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16" id="reserva">
      {/* Título de sección con línea decorativa */}
      <div className="flex items-center gap-4 justify-center mb-10">
        <div className="flex-1 h-px bg-gray-200" />
        <h2 className="text-gray-700 text-xl font-bold flex items-center gap-4">
          <span className="tracking-tight">Reserva tu mesa</span>
        </h2>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-100">
        {submissionStatus === 'success' ? (
          <div className="text-center py-8">
            <svg 
              className="w-16 h-16 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth={1.5} 
              viewBox="0 0 24 24" 
              style={{ color: themeColors.primary }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <h3 className="text-2xl font-bold mb-2">¡Reserva recibida!</h3>
            <p className="text-gray-600 mb-6">
              Hemos recibido tu solicitud de reserva para {restaurantName}. <br />
              <span className="font-semibold">Tu reserva está pendiente de confirmación.</span> El restaurante debe aceptarla y recibirás un correo con la confirmación o información adicional.
            </p>
            <button
              className="px-6 py-2 rounded-full font-medium"
              style={{ backgroundColor: themeColors.primary, color: 'white' }}
              onClick={() => setSubmissionStatus('idle')}
            >
              Hacer otra reserva
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {submissionStatus === 'error' && errorMessage && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
                <p className="text-red-600 text-sm">{errorMessage}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none focus:ring-opacity-50`}
                  style={{
                    "--tw-ring-color": themeColors.primary
                  } as React.CSSProperties}
                />
              </div>
              
              <div>
                <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="customer_email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  id="customer_phone"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="party_size" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de personas *
                </label>
                <select
                  id="party_size"
                  name="party_size"
                  value={formData.party_size}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                >
                  {maxPartySize > 0 && [...Array(maxPartySize)].map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {idx + 1} {idx + 1 === 1 ? 'persona' : 'personas'}
                    </option>
                  ))}
                  {maxPartySize > 0 && <option value={maxPartySize + 10}>Más de {maxPartySize} personas</option>}
                </select>
              </div>
              
              <div>
                <label htmlFor="reservation_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  id="reservation_date"
                  name="reservation_date"
                  value={formData.reservation_date}
                  onChange={handleInputChange}
                  min={today}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="reservation_time" className="block text-sm font-medium text-gray-700 mb-1">
                  Hora *
                </label>
                <select
                  id="reservation_time"
                  name="reservation_time"
                  value={formData.reservation_time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  disabled={availableTimes.length === 0}
                >
                  {availableTimes.length === 0 ? (
                    <option value="">Seleccione una fecha primero</option>
                  ) : (
                    availableTimes.map((time, index) => (
                      <option key={index} value={time}>{time}</option>
                    ))
                  )}
                </select>
                {availableTimes.length === 0 && formData.reservation_date && (
                  <p className="text-red-500 text-xs mt-1">No hay horarios disponibles para esta fecha</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="special_requests" className="block text-sm font-medium text-gray-700 mb-1">
                Peticiones especiales
              </label>
              <textarea
                id="special_requests"
                name="special_requests"
                value={formData.special_requests}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
              />
            </div>
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting || availableTimes.length === 0 || !formData.reservation_date || !formData.reservation_time}
                className={`px-8 py-3 rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 ${
                  isSubmitting || availableTimes.length === 0 || !formData.reservation_date || !formData.reservation_time
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
                style={{ backgroundColor: themeColors.primary, color: 'white' }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Solicitar reserva
                  </span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}