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
  showReservationForm?: boolean; // Prop para mostrar/ocultar el formulario
};

type TimeSlot = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_reservations: number;
  max_party_size: number;
  is_active: boolean;
  available_spots: number;
}

export default function ReservationSection({ 
  restaurantId, 
  restaurantName, 
  themeColors, 
  showReservationForm = true 
}: ReservationSectionProps) {
  // Si el formulario está desactivado, no renderizamos nada
  if (!showReservationForm) return null;
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    party_size: 2,
    reservation_date: '',
    special_requests: ''
  });

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedTimeSlotObj, setSelectedTimeSlotObj] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [maxPartySize, setMaxPartySize] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Función para obtener los próximos 30 días
  const getNext30Days = (): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  // Obtener días y horarios disponibles al cargar el componente
  useEffect(() => {
    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        // 1. Obtener todos los slots de horario para este restaurante
        const { data: timeSlots, error: timeSlotsError } = await supabase
          .from('reservation_time_slots')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true);

        if (timeSlotsError) throw timeSlotsError;

        // Obtener el tamaño máximo de grupo de cualquiera de los slots
        if (timeSlots && timeSlots.length > 0) {
          setMaxPartySize(timeSlots[0].max_party_size);
        }

        // 2. Determinar qué días de la semana tienen slots disponibles
        const availableDaysOfWeek = [...new Set(timeSlots?.map(slot => slot.day_of_week) || [])];
        
        // 3. Obtener las próximas 30 fechas
        const next30Days = getNext30Days();
        
        // 4. Filtrar solo las fechas que tienen día de la semana disponible
        const availableDatesList = next30Days.filter(date => 
          availableDaysOfWeek.includes(date.getDay())
        ).map(date => date.toISOString().split('T')[0]);
        
        setAvailableDates(availableDatesList);
        
        // Almacenar los time slots para usarlos más tarde
        if (timeSlots) {
          // Añadir información de disponibilidad a cada slot
          // En un sistema real, verificaríamos cuántas reservas ya existen para cada slot
          const enhancedTimeSlots = timeSlots.map(slot => ({
            ...slot,
            available_spots: slot.max_reservations // Por ahora asumimos disponibilidad completa
          }));
          
          setAvailableTimeSlots(enhancedTimeSlots);
        }
      } catch (error) {
        console.error("Error al cargar disponibilidad:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [restaurantId]);

  // Filtrar slots de tiempo disponibles y actualizar disponibilidad real cuando cambia la fecha seleccionada
  useEffect(() => {
    const updateSlotsAvailability = async () => {
      if (!formData.reservation_date || availableTimeSlots.length === 0) return;
      setIsLoading(true);
      try {
        // Obtener todas las reservas para ese restaurante, fecha y los slots visibles
        const slotIds = availableTimeSlots.map(slot => slot.id);
        const { data: reservations, error } = await supabase
          .from('reservations')
          .select('id, time_slot_id, status')
          .eq('restaurant_id', restaurantId)
          .eq('reservation_date', formData.reservation_date)
          .in('time_slot_id', slotIds)
          .in('status', ['pending', 'confirmed']);
        if (error) throw error;
        // Contar reservas por slot
        const countBySlot: Record<string, number> = {};
        (reservations || []).forEach(r => {
          if (r.time_slot_id) {
            countBySlot[r.time_slot_id] = (countBySlot[r.time_slot_id] || 0) + 1;
          }
        });
        // Actualizar available_spots de cada slot
        const updatedSlots = availableTimeSlots.map(slot => ({
          ...slot,
          available_spots: Math.max(0, slot.max_reservations - (countBySlot[slot.id] || 0))
        }));
        setAvailableTimeSlots(updatedSlots);
      } catch (e) {
        // Si hay error, dejar los slots como estaban
        console.error('Error actualizando disponibilidad de slots:', e);
      } finally {
        setIsLoading(false);
        setSelectedTimeSlot(null);
        setSelectedTimeSlotObj(null);
      }
    };
    updateSlotsAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.reservation_date]);

  // Filtrar slots de tiempo disponibles cuando cambia la fecha seleccionada
  useEffect(() => {
    if (formData.reservation_date) {
      // Convertir la fecha seleccionada a día de la semana (0-6, donde 0 es domingo)
      const selectedDate = new Date(formData.reservation_date);
      const dayOfWeek = selectedDate.getDay();
      
      // Resetear el time slot seleccionado
      setSelectedTimeSlot(null);
      setSelectedTimeSlotObj(null);
    }
  }, [formData.reservation_date]);

  // Filtrar los slots disponibles para el día seleccionado
  const filteredTimeSlots = formData.reservation_date ? availableTimeSlots.filter(slot => {
    const selectedDate = new Date(formData.reservation_date);
    return slot.day_of_week === selectedDate.getDay() && 
           slot.is_active && 
           slot.available_spots > 0 &&
           slot.max_party_size >= formData.party_size;
  }) : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Si cambiamos el tamaño del grupo, debemos verificar que el slot seleccionado lo soporte
    if (name === 'party_size' && selectedTimeSlotObj) {
      const partySize = parseInt(value);
      if (selectedTimeSlotObj.max_party_size < partySize) {
        setSelectedTimeSlot(null);
        setSelectedTimeSlotObj(null);
      }
    }
  };

  const handleTimeSlotSelect = (slotId: string) => {
    setSelectedTimeSlot(slotId);
    const selectedSlot = availableTimeSlots.find(slot => slot.id === slotId) || null;
    setSelectedTimeSlotObj(selectedSlot);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTimeSlotObj) {
      setErrorMessage('Por favor selecciona un horario disponible.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmissionStatus('idle');
    setErrorMessage('');

    try {
      // Crear la reserva con el estado "pendiente" por defecto
      const { data, error } = await supabase
        .from('reservations')
        .insert([
          {
            restaurant_id: restaurantId,
            customer_name: formData.customer_name,
            customer_email: formData.customer_email,
            customer_phone: formData.customer_phone,
            party_size: formData.party_size,
            reservation_date: formData.reservation_date,
            reservation_time: selectedTimeSlotObj.start_time,
            special_requests: formData.special_requests,
            status: 'pending',
            time_slot_id: selectedTimeSlot
          }
        ])
        .select();

      if (error) throw error;

      // Añadir cliente al CRM si no existe
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('email', formData.customer_email)
        .maybeSingle();
      
      if (!existingCustomer) {
        const [first_name, ...rest] = formData.customer_name.trim().split(' ');
        const last_name = rest.join(' ') || '-';
        await supabase.from('customers').insert({
          restaurant_id: restaurantId,
          first_name,
          last_name,
          email: formData.customer_email,
          phone: formData.customer_phone || null,
        });
      }

      // Enviar correo de nueva reserva (al restaurante y cliente)
      if (data && data[0] && data[0].id) {
        try {
          await fetch('/api/email/new-reservation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservationId: data[0].id })
          });
        } catch (err) {
          // No bloquear el flujo si falla el correo
          console.error('Error enviando correo de nueva reserva:', err);
        }
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
        special_requests: ''
      });
      setSelectedTimeSlot(null);
      setSelectedTimeSlotObj(null);
    } catch (error: unknown) {
      console.error('Error al crear la reserva:', error);
      setSubmissionStatus('error');
      setErrorMessage((error as Error).message || 'Ha ocurrido un error al procesar tu reserva. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatear horario para mostrar
  const formatTimeDisplay = (timeString: string) => {
    // Convertir "13:00:00" a "13:00"
    return timeString.substring(0, 5);
  };

  // Verificar si una fecha está disponible
  const isDateAvailable = (dateString: string) => {
    return availableDates.includes(dateString);
  };

  // Obtener la fecha actual formateada para el input date min
  const today = new Date().toISOString().split('T')[0];
  
  // Generar opciones para el selector de número de personas
  const partyOptions = Array.from({ length: maxPartySize }, (_, i) => i + 1);

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
            <h3 className="text-2xl font-bold mb-2">¡Solicitud recibida!</h3>
            <p className="text-gray-600 mb-6">
              Hemos recibido tu solicitud de reserva para {restaurantName}. Te contactaremos pronto para confirmarla.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Recibirás un correo electrónico de confirmación una vez que el restaurante haya revisado tu reserva.
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
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
                <span className="ml-2 text-gray-600">Cargando disponibilidad...</span>
              </div>
            ) : (
              <>
                {submissionStatus === 'error' && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <p className="text-red-600 text-sm">{errorMessage}</p>
                  </div>
                )}
                
                {availableDates.length === 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <p className="text-yellow-700 text-sm">No hay horarios disponibles para reservas. Por favor, contacta directamente con el restaurante.</p>
                  </div>
                )}

                {availableDates.length > 0 && (
                  <>
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-30 focus:outline-none"
                          style={{ 
                            borderColor: 'rgb(209 213 219)',
                            boxShadow: 'none'
                          }}
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
                          {partyOptions.map(num => (
                            <option key={num} value={num}>{num} {num === 1 ? 'persona' : 'personas'}</option>
                          ))}
                        </select>
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
                        <p className="mt-1 text-xs text-gray-500">Solo fechas disponibles pueden ser seleccionadas</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hora *
                        </label>
                        {formData.reservation_date ? (
                          filteredTimeSlots.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {filteredTimeSlots.map(slot => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  className={`text-center py-2 rounded-md text-sm ${
                                    selectedTimeSlot === slot.id
                                      ? 'bg-opacity-100 text-white'
                                      : 'bg-opacity-20 hover:bg-opacity-30 text-gray-800'
                                  }`}
                                  style={{ 
                                    backgroundColor: selectedTimeSlot === slot.id 
                                      ? themeColors.primary 
                                      : `${themeColors.primary}20` 
                                  }}
                                  onClick={() => handleTimeSlotSelect(slot.id)}
                                >
                                  {formatTimeDisplay(slot.start_time)}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500 border border-gray-200">
                              No hay horarios disponibles para la fecha seleccionada
                            </div>
                          )
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500 border border-gray-200">
                            Primero selecciona una fecha
                          </div>
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
                        disabled={isSubmitting || !formData.reservation_date || !selectedTimeSlot}
                        className={`px-8 py-3 rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 ${
                          isSubmitting || !formData.reservation_date || !selectedTimeSlot
                            ? 'opacity-70 cursor-not-allowed'
                            : ''
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            Solicitar reserva
                          </span>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </form>
        )}
      </div>
    </section>
  );
}