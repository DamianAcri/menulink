"use client";

import { useState } from 'react';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus('idle');
    setErrorMessage('');

    try {
      console.log("Creando reserva para restaurante ID:", restaurantId);
      
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
            reservation_time: formData.reservation_time,
            special_requests: formData.special_requests,
            status: 'pending'
          }
        ])
        .select();

      console.log("Resultado de crear reserva:", { data, error });

      if (error) throw error;

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
    } catch (error: any) {
      console.error('Error al crear la reserva:', error);
      setSubmissionStatus('error');
      setErrorMessage(error.message || 'Ha ocurrido un error al procesar tu reserva. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtener la fecha actual formateada para el input date min
  const today = new Date().toISOString().split('T')[0];

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
              Hemos recibido tu solicitud de reserva para {restaurantName}. Te contactaremos pronto para confirmarla.
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
            {submissionStatus === 'error' && (
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
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-30 focus:ring-${themeColors.primary.replace('#', '')} focus:outline-none`}
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
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'persona' : 'personas'}</option>
                  ))}
                  <option value={20}>Más de 12 personas</option>
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
                <input
                  type="time"
                  id="reservation_time"
                  name="reservation_time"
                  value={formData.reservation_time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
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
                disabled={isSubmitting}
                className="px-8 py-3 rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-70"
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