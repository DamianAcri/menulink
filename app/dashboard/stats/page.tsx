"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Define type for page view data from database
interface PageView {
  id: string;
  restaurant_id: string;
  viewed_at: string;
  referrer: string | null;
  user_agent: string | null;
  ip_address: string | null;
}

// Define type for reservation data
interface Reservation {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_email: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

// Stats components
const StatsCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0 text-blue-500 dark:text-blue-400">
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
            <dd>
              <div className="text-lg font-medium text-gray-900 dark:text-white">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

export default function StatsPage() {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [error, setError] = useState<string | null>(null);
  const [reservationsError, setReservationsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'views' | 'reservations'>('views');

  const fetchPageViews = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected time range
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      // Format date for Supabase query
      const formattedStartDate = startDate.toISOString();
      
      // Query pageviews from Supabase
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .gte('viewed_at', formattedStartDate)
        .order('viewed_at', { ascending: true });

      if (error) {
        throw error;
      }

      setPageViews(data || []);
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching page views:', err);
      setError((err as Error).message || 'Error loading statistics data');
      setPageViews([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const fetchReservations = useCallback(async () => {
    try {
      setReservationsLoading(true);
      
      // Get user's restaurants
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      const { data: userRestaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id);
      
      if (restaurantsError) throw restaurantsError;
      
      if (!userRestaurants || userRestaurants.length === 0) {
        setReservations([]);
        return;
      }
      
      // Calculate date range based on selected time range
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      // Format date for Supabase query
      const formattedStartDate = startDate.toISOString();
      
      const restaurantIds = userRestaurants.map(r => r.id);
      
      // Query reservations from Supabase
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .in('restaurant_id', restaurantIds)
        .gte('created_at', formattedStartDate)
        .order('created_at', { ascending: true });

      if (reservationsError) throw reservationsError;

      setReservations(reservationsData || []);
      setReservationsError(null);
    } catch (err: unknown) {
      console.error('Error fetching reservations:', err);
      setReservationsError((err as Error).message || 'Error loading reservations data');
      setReservations([]);
    } finally {
      setReservationsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchPageViews();
    fetchReservations();
  }, [timeRange, fetchPageViews, fetchReservations]);

  // Process data for visualization
  const processViewsByDate = () => {
    const viewsByDate: Record<string, number> = {};
    
    pageViews.forEach(view => {
      // Format date for grouping (YYYY-MM-DD)
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      
      if (viewsByDate[date]) {
        viewsByDate[date]++;
      } else {
        viewsByDate[date] = 1;
      }
    });
    
    return viewsByDate;
  };

  const processViewsByReferrer = () => {
    const viewsByReferrer: Record<string, number> = {};
    
    pageViews.forEach(view => {
      const referrer = view.referrer || 'Direct';
      
      if (viewsByReferrer[referrer]) {
        viewsByReferrer[referrer]++;
      } else {
        viewsByReferrer[referrer] = 1;
      }
    });
    
    return viewsByReferrer;
  };

  // Process reservation data for visualization
  const processReservationsByDate = () => {
    const reservationsByDate: Record<string, number> = {};
    
    reservations.forEach(reservation => {
      // Format date for grouping (YYYY-MM-DD)
      const date = reservation.reservation_date;
      
      if (reservationsByDate[date]) {
        reservationsByDate[date]++;
      } else {
        reservationsByDate[date] = 1;
      }
    });
    
    return reservationsByDate;
  };

  const processReservationsByStatus = () => {
    const reservationsByStatus: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0
    };
    
    reservations.forEach(reservation => {
      reservationsByStatus[reservation.status]++;
    });
    
    return reservationsByStatus;
  };

  // Prepare chart data
  const viewsByDateData = processViewsByDate();
  const viewsByReferrerData = processViewsByReferrer();
  const reservationsByDateData = processReservationsByDate();
  const reservationsByStatusData = processReservationsByStatus();

  // Data for line chart
  const lineChartData = {
    labels: Object.keys(viewsByDateData),
    datasets: [
      {
        label: 'Page Views',
        data: Object.values(viewsByDateData),
        fill: false,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        tension: 0.1
      }
    ]
  };

  // Data for pie chart
  const pieChartData = {
    labels: Object.keys(viewsByReferrerData),
    datasets: [
      {
        data: Object.values(viewsByReferrerData),
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(139, 92, 246, 0.6)',
          'rgba(236, 72, 153, 0.6)',
          'rgba(75, 85, 99, 0.6)',
        ],
        borderWidth: 1,
      }
    ]
  };

  // Data for reservations chart
  const reservationsLineChartData = {
    labels: Object.keys(reservationsByDateData),
    datasets: [
      {
        label: 'Reservas',
        data: Object.values(reservationsByDateData),
        fill: false,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        tension: 0.1
      }
    ]
  };

  // Data for reservations status pie chart
  const reservationsStatusPieChartData = {
    labels: ['Pendientes', 'Confirmadas', 'Canceladas', 'Completadas'],
    datasets: [
      {
        data: [
          reservationsByStatusData.pending,
          reservationsByStatusData.confirmed,
          reservationsByStatusData.cancelled,
          reservationsByStatusData.completed
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.6)',  // Amber for pending
          'rgba(16, 185, 129, 0.6)',  // Green for confirmed
          'rgba(239, 68, 68, 0.6)',   // Red for cancelled
          'rgba(59, 130, 246, 0.6)',  // Blue for completed
        ],
        borderWidth: 1,
      }
    ]
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Estadísticas</h1>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px">
              <li className="mr-2">
                <button
                  onClick={() => setActiveTab('views')}
                  className={`inline-flex items-center py-2 px-4 text-sm font-medium ${
                    activeTab === 'views'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Visitas
                </button>
              </li>
              <li className="mr-2">
                <button
                  onClick={() => setActiveTab('reservations')}
                  className={`inline-flex items-center py-2 px-4 text-sm font-medium ${
                    activeTab === 'reservations'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Reservas
                </button>
              </li>
            </ul>
          </div>

          {/* Time range selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Filtrar por periodo</h2>
              <div className="inline-flex rounded-md shadow-sm">
                {(['day', 'week', 'month', 'year'] as const).map(range => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 text-sm font-medium ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                    } border border-gray-300 dark:border-gray-600 ${
                      range === 'day' ? 'rounded-l-md' : range === 'year' ? 'rounded-r-md' : ''
                    }`}
                  >
                    {range === 'day' ? 'Día' : range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visitas tab content */}
          {activeTab === 'views' && (
            <>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                  <p>{error}</p>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : pageViews.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md p-4 my-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-200">
                        No hay datos de visitas para el periodo seleccionado.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Stats overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    <StatsCard 
                      title="Total de visitas" 
                      value={pageViews.length}
                      icon={<svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>} 
                    />
                    
                    <StatsCard 
                      title="Promedio diario" 
                      value={(pageViews.length / Object.keys(viewsByDateData).length || 0).toFixed(1)}
                      icon={<svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>} 
                    />
                    
                    <StatsCard 
                      title="Fuentes de tráfico" 
                      value={Object.keys(viewsByReferrerData).length}
                      icon={<svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>} 
                    />
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Visitas por día</h3>
                      <div className="h-80">
                        <Line data={lineChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Fuentes de tráfico</h3>
                      <div className="h-80">
                        <Pie data={pieChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                      </div>
                    </div>
                  </div>

                  {/* Recent visits table */}
                  <div className="mt-8 bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Visitas recientes</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                        Las últimas 10 visitas a tu página
                      </p>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Fecha
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Referente
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Dispositivo
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {pageViews.slice(-10).reverse().map((view) => {
                              // Extract device info from user agent
                              const userAgentInfo = view.user_agent ? 
                                view.user_agent.includes('Mobile') ? 'Móvil' :
                                view.user_agent.includes('Tablet') ? 'Tablet' : 'Escritorio' 
                                : 'Desconocido';
                              
                              return (
                                <tr key={view.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                    {new Date(view.viewed_at).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {view.referrer || 'Directo'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {userAgentInfo}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Reservations tab content */}
          {activeTab === 'reservations' && (
            <>
              {reservationsError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                  <p>{reservationsError}</p>
                </div>
              )}

              {reservationsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : reservations.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md p-4 my-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-200">
                        No hay datos de reservas para el periodo seleccionado.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Reservations stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                    <StatsCard 
                      title="Total reservas" 
                      value={reservations.length}
                      icon={<svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>} 
                    />
                    
                    <StatsCard 
                      title="Pendientes" 
                      value={reservationsByStatusData.pending}
                      icon={<svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>} 
                    />
                    
                    <StatsCard 
                      title="Confirmadas" 
                      value={reservationsByStatusData.confirmed}
                      icon={<svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>} 
                    />
                    
                    <StatsCard 
                      title="Canceladas" 
                      value={reservationsByStatusData.cancelled}
                      icon={<svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>} 
                    />
                  </div>

                  {/* Reservations charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Reservas por día</h3>
                      <div className="h-80">
                        <Line data={reservationsLineChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Estado de reservas</h3>
                      <div className="h-80">
                        <Pie data={reservationsStatusPieChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                      </div>
                    </div>
                  </div>

                  {/* Recent reservations table */}
                  <div className="mt-8 bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Reservas recientes</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                        Las últimas 10 reservas recibidas
                      </p>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Fecha
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Cliente
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Personas
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Estado
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {reservations.slice(-10).reverse().map((reservation) => {
                              const statusColors = {
                                pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                confirmed: 'bg-green-100 text-green-800 border-green-200',
                                cancelled: 'bg-red-100 text-red-800 border-red-200',
                                completed: 'bg-blue-100 text-blue-800 border-blue-200',
                              };
                              
                              const statusText = {
                                pending: 'Pendiente',
                                confirmed: 'Confirmada',
                                cancelled: 'Cancelada',
                                completed: 'Completada',
                              };
                              
                              return (
                                <tr key={reservation.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {new Date(reservation.reservation_date).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {reservation.reservation_time.substring(0, 5)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {reservation.customer_name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {reservation.customer_email}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {reservation.party_size} {reservation.party_size === 1 ? 'persona' : 'personas'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusColors[reservation.status]}`}>
                                      {statusText[reservation.status]}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}