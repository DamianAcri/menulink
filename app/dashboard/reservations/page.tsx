"use client";

import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { toast } from 'sonner';

type Reservation = {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        console.log("Usuario autenticado en reservas:", user);
        if (!user) return;

        // Buscar el restaurante del usuario actual
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', user.id)
          .single();

        console.log("Restaurant data fetch result:", { restaurantData, restaurantError });

        if (restaurantError && restaurantError.code !== 'PGRST116') {
          console.error("Error fetching restaurant:", restaurantError);
          return;
        }

        // Si no hay restaurante, significa que es la primera vez que el usuario accede
        if (!restaurantData) {
          setIsLoading(false);
          return;
        }

        // Guardar el restaurante encontrado
        setRestaurant(restaurantData);
        
        console.log("ID del restaurante recuperado:", restaurantData.id);
        console.log("Tipo de dato del ID:", typeof restaurantData.id);
        
        // Verificar las políticas RLS activas
        console.log("Verificando políticas RLS activas...");
        try {
          const { data: policies, error: policiesError } = await supabase.rpc('get_policies');
          console.log("Políticas activas:", policies);
          console.log("Error al obtener políticas:", policiesError);
        } catch (e) {
          console.log("Error al verificar políticas RLS:", e);
        }

        // Cargar reservas para este restaurante
        fetchReservations(restaurantData.id);
        
        // Como prueba adicional, hacer una consulta directa a todas las reservas
        try {
          console.log("Haciendo consulta directa a todas las reservas...");
          const { data: allReservations, error: allReservationsError } = await supabase
            .from('reservations')
            .select('*')
            .limit(10);
            
          console.log("Todas las reservas (hasta 10):", allReservations);
          console.log("Error al consultar todas las reservas:", allReservationsError);
        } catch (e) {
          console.log("Error en consulta directa:", e);
        }
        
        // Prueba específica para la reserva que sabemos que existe
        try {
          console.log("Buscando reserva por ID específico...");
          const { data: specificReservation, error: specificError } = await supabase
            .from('reservations')
            .select('*')
            .eq('id', '968ff243-5b14-4cf0-92b9-4e182db78c2d')
            .single();
            
          console.log("Reserva específica:", specificReservation);
          console.log("Error al buscar reserva específica:", specificError);
        } catch (e) {
          console.log("Error en consulta específica:", e);
        }
      } catch (error) {
        console.error("Error en página de reservas:", error);
        toast.error('Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Efecto para suscripción en tiempo real y carga de reservas cuando cambia el restaurante
  useEffect(() => {
    if (!restaurant) return;
    
    // Cargar reservas iniciales
    fetchReservations(restaurant.id);

    // Configurar canal para suscripción a nuevas reservas
    const channel = supabase.channel('public:reservations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          console.log('Nueva reserva detectada:', payload);
          
          // Obtener datos de la nueva reserva
          const newReservation = payload.new as Reservation;
          
          // Mostrar notificación
          toast.success(
            <div>
              <p className="font-bold">¡Nueva reserva recibida!</p>
              <p>Cliente: {newReservation.customer_name}</p>
              <p>Fecha: {formatDate(newReservation.reservation_date)} a las {newReservation.reservation_time.substring(0, 5)}</p>
            </div>,
            { duration: 6000 }
          );
          
          // Recargar lista de reservas
          fetchReservations(restaurant.id);
        }
      )
      .subscribe();

    console.log('Canal de suscripción configurado para restaurante:', restaurant.id);

    // Limpiar suscripción al desmontar
    return () => {
      console.log('Limpiando suscripción');
      supabase.removeChannel(channel);
    };
  }, [restaurant]);

  // Efecto separado para actualizar cuando cambian los filtros
  useEffect(() => {
    if (restaurant) {
      fetchReservations(restaurant.id);
    }
  }, [statusFilter, dateFilter]);

  const fetchReservations = async (restaurantId: string) => {
    if (!restaurantId) return;
    
    setIsLoading(true);
    try {
      console.log("Consultando reservas para restaurante ID:", restaurantId);
      
      // Obtener la sesión actual para usar el token de autenticación
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Sesión actual:", session ? "Autenticado" : "No autenticado");
      
      // Asegurarse de que estamos trabajando con una instancia de cliente con la autenticación correcta
      const supabaseWithAuth = session ? supabase : supabase;
      
      // Depurar las políticas de RLS para la tabla de reservas
      console.log("Intentando acceder a tabla de reservas con las siguientes credenciales:");
      console.log("- Usuario autenticado: ", !!session?.user);
      console.log("- Usuario ID: ", session?.user?.id);
      
      // Consulta explícita con información completa
      const { data, error } = await supabaseWithAuth
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId);
      
      console.log("Consulta SQL aproximada:", 
        `SELECT * FROM reservations WHERE restaurant_id = '${restaurantId}'`);
      
      console.log("Resultado de consulta de reservas (raw):", data);
      console.log("Error de consulta de reservas:", error);
      
      // Si hay un error, intentar una consulta alternativa usando RPC si existe
      if (error || !data || data.length === 0) {
        console.log("Intentando consulta alternativa con RPC...");
        try {
          const { data: rpcData, error: rpcError } = await supabaseWithAuth.rpc(
            'get_restaurant_reservations',
            { restaurant_id_param: restaurantId }
          );
          
          console.log("Resultado de RPC:", rpcData);
          console.log("Error de RPC:", rpcError);
          
          if (!rpcError && rpcData && rpcData.length > 0) {
            const sortedReservations: Reservation[] = rpcData.sort((a: Reservation, b: Reservation) => {
                const dateCompare = new Date(a.reservation_date).getTime() - 
                                                    new Date(b.reservation_date).getTime();
                if (dateCompare !== 0) return dateCompare;
                return a.reservation_time.localeCompare(b.reservation_time);
            });
            
            console.log("Reservas ordenadas desde RPC:", sortedReservations);
            setReservations(sortedReservations);
            setIsLoading(false);
            return;
          }
        } catch (rpcError) {
          console.log("Error en consulta RPC:", rpcError);
        }
      }
      
      if (error) throw error;
      
      // Ordenamos las reservas en el cliente
      const sortedReservations = (data || []).sort((a, b) => {
        // Primero por fecha
        const dateCompare = new Date(a.reservation_date).getTime() - 
                        new Date(b.reservation_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        
        // Si las fechas son iguales, ordenar por hora
        return a.reservation_time.localeCompare(b.reservation_time);
      });
      
      console.log("Reservas ordenadas:", sortedReservations);
      setReservations(sortedReservations);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setIsLoading(false);
    }
  };

  // Si no hay restaurante configurado, mostrar pantalla de welcome igual que en dashboard
  if (!isLoading && !restaurant) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">
          Necesitas completar la configuración de tu restaurante
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Antes de gestionar reservas, completa la información básica de tu restaurante.
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
    <div className="px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Reservas</h1>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Filtro por estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring focus:outline-none focus:ring-blue-300 text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="completed">Completadas</option>
          </select>
          
          {/* Filtro por fecha */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring focus:outline-none focus:ring-blue-300 text-sm"
          />
          
          {/* Botón para limpiar filtros */}
          <button
            onClick={() => {
              setStatusFilter('all');
              setDateFilter('');
            }}
            className="px-3 py-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <svg 
            className="w-12 h-12 mx-auto text-gray-400 mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reservas</h3>
          <p className="text-gray-500">
            {statusFilter !== 'all' || dateFilter
              ? 'No hay reservas que coincidan con los filtros seleccionados.'
              : 'Aún no tienes reservas. Cuando los clientes hagan reservas aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personas
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(reservation.reservation_date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {reservation.reservation_time.substring(0, 5)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.customer_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {reservation.customer_email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {reservation.customer_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {reservation.party_size} {reservation.party_size === 1 ? 'persona' : 'personas'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(reservation.status)}`}>
                        {getStatusText(reservation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {/* Acciones dependen del estado */}
                      {reservation.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                            className="text-green-600 hover:text-green-900 text-xs font-medium"
                          >
                            Confirmar
                          </button>
                          <button 
                            onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900 text-xs font-medium"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                      {reservation.status === 'confirmed' && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleStatusChange(reservation.id, 'completed')}
                            className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                          >
                            Marcar completada
                          </button>
                          <button 
                            onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900 text-xs font-medium"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                      {(reservation.status === 'cancelled' || reservation.status === 'completed') && (
                        <div>
                          <button 
                            onClick={() => {
                              const confirmMessage = `¿Estás seguro de que deseas eliminar esta reserva?`;
                              if (window.confirm(confirmMessage)) {
                                supabase
                                  .from('reservations')
                                  .delete()
                                  .eq('id', reservation.id)
                                  .then(({ error }) => {
                                    if (error) {
                                      toast.error('Error al eliminar la reserva');
                                      console.error(error);
                                    } else {
                                      toast.success('Reserva eliminada correctamente');
                                      setReservations(prev => prev.filter(r => r.id !== reservation.id));
                                    }
                                  });
                              }
                            }}
                            className="text-gray-600 hover:text-gray-900 text-xs font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).format(date);
  }

  function getStatusText(status: string) {
    switch(status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  }

  function getStatusColor(status: string) {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  async function handleStatusChange(reservationId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', reservationId);

      if (error) throw error;

      // Actualizar localmente
      setReservations(prev => prev.map(res => 
        res.id === reservationId ? { ...res, status: newStatus as any } : res
      ));
      
      toast.success('Estado de reserva actualizado');
      
      // Si la reserva se ha completado, enviar correo de agradecimiento
      if (newStatus === 'completed') {
        try {
          const response = await fetch('/api/email/send-thank-you', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reservationId }),
          });
          
          const data = await response.json();
          
          if (!response.ok && !data.already_sent) {
            console.error('Error al enviar correo de agradecimiento:', data.error);
            toast.error('La reserva se completó pero no se pudo enviar el correo de agradecimiento');
          } else if (data.already_sent) {
            console.log('El correo de agradecimiento ya había sido enviado anteriormente');
          } else {
            console.log('Correo de agradecimiento enviado correctamente', data);
            toast.success('Correo de agradecimiento enviado al cliente');
          }
        } catch (emailError) {
          console.error('Error en la solicitud de envío de correo:', emailError);
        }
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error('Error al actualizar estado de la reserva');
    }
  }
}