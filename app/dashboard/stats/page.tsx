"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Line, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import CountUp from 'react-countup';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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

// Nuevo: Tipos para clicks y platos
interface ButtonClick {
  id: string; // uuid
  restaurant_id: string; // uuid
  button_type: string;
  clicked_at: string;
  device_type?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  user_session_id?: string | null;
  menu_item_id?: string | null; // uuid
  delivery_link_id?: string | null; // uuid
  social_link_id?: string | null; // uuid
}

// Stats components
const StatsCard = ({ title, value, icon }: { title: string; value: React.ReactNode; icon: React.ReactNode }) => (
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
  const [buttonClicks, setButtonClicks] = useState<ButtonClick[]>([]);
  const [buttonClicksLoading, setButtonClicksLoading] = useState(true);
  const [buttonClicksError, setButtonClicksError] = useState<string | null>(null);

  // Nuevo: obtener nombres de platos y botones
  const [menuItems, setMenuItems] = useState<{ id: string; name: string; category_id: string }[]>([]);
  const [menuCategories, setMenuCategories] = useState<{ id: string; name: string }[]>([]);
  const [deliveryLinks, setDeliveryLinks] = useState<{ id: string; platform: string }[]>([]);
  const [socialLinks, setSocialLinks] = useState<{ id: string; platform: string }[]>([]);

  // Timeout para la carga (máx 10s)
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    // Resetear el timeout cuando cambia el estado de carga
    setTimedOut(false);
    
    // Solo establecer un timeout si actualmente estamos cargando datos
    let timeout: NodeJS.Timeout;
    if (loading || reservationsLoading || buttonClicksLoading) {
      timeout = setTimeout(() => setTimedOut(true), 10000);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [loading, reservationsLoading, buttonClicksLoading]);

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

  // Fetch button clicks
  const fetchButtonClicks = useCallback(async () => {
    try {
      setButtonClicksLoading(true);
      // Obtener usuario y restaurante
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      const { data: userRestaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id);
      if (restaurantsError) throw restaurantsError;
      if (!userRestaurants || userRestaurants.length === 0) {
        setButtonClicks([]);
        return;
      }
      // Rango de fechas
      const now = new Date();
      let startDate: Date;
      switch (timeRange) {
        case 'day': startDate = new Date(now.getTime() - 24*60*60*1000); break;
        case 'week': startDate = new Date(now.getTime() - 7*24*60*60*1000); break;
        case 'month': startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
        case 'year': startDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
        default: startDate = new Date(now.getTime() - 7*24*60*60*1000);
      }
      const formattedStartDate = startDate.toISOString();
      const restaurantIds = userRestaurants.map(r => r.id);
      // Query button_clicks
      const { data, error } = await supabase
        .from('button_clicks')
        .select('*')
        .in('restaurant_id', restaurantIds)
        .gte('clicked_at', formattedStartDate)
        .order('clicked_at', { ascending: true });
      if (error) throw error;
      setButtonClicks(data || []);
      setButtonClicksError(null);
    } catch (err: unknown) {
      setButtonClicksError((err as Error).message || 'Error loading button clicks');
      setButtonClicks([]);
    } finally {
      setButtonClicksLoading(false);
    }
  }, [timeRange]);

  // Cargar nombres de platos y botones al cargar clicks
  useEffect(() => {
    const fetchExtraData = async () => {
      try {
        // Obtener usuario y restaurante
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setMenuItems([]);
          setMenuCategories([]);
          setDeliveryLinks([]);
          setSocialLinks([]);
          return;
        }
        const { data: userRestaurants } = await supabase
          .from('restaurants')
          .select('id')
          .eq('user_id', user.id);
        if (!userRestaurants || userRestaurants.length === 0) {
          setMenuItems([]);
          setMenuCategories([]);
          setDeliveryLinks([]);
          setSocialLinks([]);
          return;
        }
        const restaurantIds = userRestaurants.map(r => r.id);
        // Categorías
        const { data: categories, error: catError } = await supabase
          .from('menu_categories')
          .select('id, name')
          .in('restaurant_id', restaurantIds);
        if (catError) {
          setMenuItems([]);
          setMenuCategories([]);
          setDeliveryLinks([]);
          setSocialLinks([]);
          console.error('Error cargando categorías:', catError);
          return;
        }
        setMenuCategories(categories || []);
        const categoryIds = categories?.map((c: { id: string }) => c.id) || [];
        // Platos solo si hay categorías
        if (categoryIds.length === 0) {
          setMenuItems([]);
        } else {
          // Selecciona columnas válidas
          const { data: itemsData, error: itemsError } = await supabase
            .from('menu_items')
            .select('id, name, category_id')
            .in('category_id', categoryIds);
          if (itemsError) {
            setMenuItems([]);
            console.error('Error cargando platos:', itemsError);
          } else {
            setMenuItems(itemsData || []);
          }
        }
        // Delivery
        const { data: delivery, error: deliveryError } = await supabase
          .from('delivery_links')
          .select('id, platform')
          .in('restaurant_id', restaurantIds);
        if (deliveryError) {
          setDeliveryLinks([]);
          console.error('Error cargando delivery_links:', deliveryError);
        } else {
          setDeliveryLinks(delivery || []);
        }
        // Social
        const { data: social, error: socialError } = await supabase
          .from('social_links')
          .select('id, platform')
          .in('restaurant_id', restaurantIds);
        if (socialError) {
          setSocialLinks([]);
          console.error('Error cargando social_links:', socialError);
        } else {
          setSocialLinks(social || []);
        }
      } catch (err) {
        setMenuItems([]);
        setMenuCategories([]);
        setDeliveryLinks([]);
        setSocialLinks([]);
        setButtonClicksError('Error cargando datos extra para rankings');
        console.error('Error general en fetchExtraData:', err);
      }
    };
    fetchExtraData();
  }, [buttonClicksLoading]);
  
  // Añadir useEffect para cargar datos cuando cambie timeRange o al inicio
  useEffect(() => {
    fetchPageViews();
    fetchReservations();
    fetchButtonClicks();
  }, [fetchPageViews, fetchReservations, fetchButtonClicks, timeRange]);

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

  // Procesar clicks por tipo de botón
  const processClicksByType = () => {
    const clicksByType: Record<string, number> = {};
    buttonClicks.forEach(click => {
      const type = click.button_type || 'Otro';
      clicksByType[type] = (clicksByType[type] || 0) + 1;
    });
    return clicksByType;
  };

  // Ranking de platos más clicados (si existe tracking)
  const menuItemRanking = useMemo(() => {
    const clicksByItem: Record<string, number> = {};
    buttonClicks.forEach((click) => {
      if (click.button_type === 'menu_item' && click.menu_item_id) {
        clicksByItem[click.menu_item_id] = (clicksByItem[click.menu_item_id] || 0) + 1;
      }
    });
    // Map to array with name
    return Object.entries(clicksByItem)
      .map(([id, count]) => {
        const item = menuItems.find((i) => i.id === id);
        return { id, name: item ? item.name : 'Desconocido', count };
      })
      .sort((a, b) => b.count - a.count);
  }, [buttonClicks, menuItems]);

  // Ranking de botones de delivery/social más clicados
  const buttonRanking = useMemo(() => {
    // Agrupa por delivery_link_id y social_link_id
    const platformClicks: Record<string, { platform: string; count: number }> = {};
    buttonClicks.forEach((click) => {
      if (click.button_type === 'delivery' && click.delivery_link_id) {
        const delivery = deliveryLinks.find((d) => d.id === click.delivery_link_id);
        const platform = delivery?.platform || `Delivery (${click.delivery_link_id.slice(0, 6)})`;
        if (!platformClicks[platform]) platformClicks[platform] = { platform, count: 0 };
        platformClicks[platform].count++;
      } else if (click.button_type === 'social' && click.social_link_id) {
        const social = socialLinks.find((s) => s.id === click.social_link_id);
        const platform = social?.platform || `Social (${click.social_link_id.slice(0, 6)})`;
        if (!platformClicks[platform]) platformClicks[platform] = { platform, count: 0 };
        platformClicks[platform].count++;
      }
    });
    return Object.values(platformClicks).sort((a, b) => b.count - a.count);
  }, [buttonClicks, deliveryLinks, socialLinks]);

  // Procesar clicks por categoría de menú
  const menuCategoryRanking = useMemo(() => {
    const categoriesMap = new Map<string, { id: string; name: string; count: number }>();
    buttonClicks.forEach((click) => {
      if (click.button_type === 'menu_item' && click.menu_item_id) {
        const menuItem = menuItems.find((item) => item.id === click.menu_item_id);
        if (menuItem) {
          const categoryId = menuItem.category_id;
          if (categoryId) {
            if (!categoriesMap.has(categoryId)) {
              const category = menuCategories.find((cat) => cat.id === categoryId);
              categoriesMap.set(categoryId, {
                id: categoryId,
                name: category ? category.name : 'Sin categoría',
                count: 1,
              });
            } else {
              const current = categoriesMap.get(categoryId);
              if (current) {
                categoriesMap.set(categoryId, { ...current, count: current.count + 1 });
              }
            }
          }
        }
      }
    });
    return Array.from(categoriesMap.values()).sort((a, b) => b.count - a.count);
  }, [buttonClicks, menuItems, menuCategories]);

  // Calcular estadísticas de dispositivos
  const deviceStats = useMemo(() => {
    const stats: Record<string, number> = {
      'mobile': 0,
      'tablet': 0,
      'desktop': 0,
      'unknown': 0
    };
    
    pageViews.forEach(view => {
      if (view.user_agent) {
        if (view.user_agent.includes('Mobile')) stats.mobile++;
        else if (view.user_agent.includes('Tablet')) stats.tablet++;
        else stats.desktop++;
      } else {
        stats.unknown++;
      }
    });
    
    return stats;
  }, [pageViews]);

  // Dispositivos como datos para gráfico
  const deviceChartData = {
    labels: ['Móvil', 'Tablet', 'Escritorio', 'Desconocido'],
    datasets: [
      {
        data: [deviceStats.mobile, deviceStats.tablet, deviceStats.desktop, deviceStats.unknown],
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)', // Móvil - azul
          'rgba(16, 185, 129, 0.6)', // Tablet - verde
          'rgba(245, 158, 11, 0.6)', // Escritorio - ámbar
          'rgba(156, 163, 175, 0.6)', // Desconocido - gris
        ],
        borderWidth: 1,
      }
    ]
  };

  // Mejorar el procesamiento de fuentes de tráfico
  const trafficSourcesDetail = useMemo(() => {
    const sources: Record<string, number> = {
      'direct': 0,
      'google': 0,
      'instagram': 0,
      'facebook': 0,
      'other_social': 0,
      'other': 0,
    };
    
    pageViews.forEach(view => {
      const referrer = view.referrer || '';
      
      if (!referrer) {
        sources.direct++;
      } else if (referrer.includes('google')) {
        sources.google++;
      } else if (referrer.includes('instagram')) {
        sources.instagram++;
      } else if (referrer.includes('facebook') || referrer.includes('fb.com')) {
        sources.facebook++;
      } else if (
        referrer.includes('twitter') || 
        referrer.includes('linkedin') || 
        referrer.includes('tiktok') ||
        referrer.includes('youtube')
      ) {
        sources.other_social++;
      } else {
        sources.other++;
      }
    });
    
    return sources;
  }, [pageViews]);

  // Fuentes de tráfico como datos para gráfico
  const trafficSourcesChartData = {
    labels: ['Directo', 'Google', 'Instagram', 'Facebook', 'Otras redes', 'Otros'],
    datasets: [
      {
        data: [
          trafficSourcesDetail.direct,
          trafficSourcesDetail.google,
          trafficSourcesDetail.instagram,
          trafficSourcesDetail.facebook,
          trafficSourcesDetail.other_social,
          trafficSourcesDetail.other
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)',   // Azul - directo
          'rgba(239, 68, 68, 0.6)',    // Rojo - google
          'rgba(217, 70, 149, 0.6)',   // Rosa - instagram
          'rgba(79, 70, 229, 0.6)',    // Indigo - facebook
          'rgba(139, 92, 246, 0.6)',   // Púrpura - otras redes
          'rgba(156, 163, 175, 0.6)',  // Gris - otros
        ],
        borderWidth: 1,
      }
    ]
  };

  // Calcular tasa de conversión
  const conversionStats = useMemo(() => {
    if (pageViews.length === 0) {
      return { 
        rate: 0, 
        reservations: 0, 
        views: 0,
        previousRate: 0,
        change: 0
      };
    }

    // Periodo actual
    const reservationsCount = reservations.length;
    const viewsCount = pageViews.length;
    const currentRate = viewsCount > 0 ? (reservationsCount / viewsCount) * 100 : 0;
    
    // Calcular periodo anterior
    const now = new Date();
    let startCurrentPeriod: Date;
    let startPreviousPeriod: Date;
    let endPreviousPeriod: Date;
    
    switch (timeRange) {
      case 'day':
        startCurrentPeriod = new Date(now.getTime() - 24*60*60*1000);
        endPreviousPeriod = new Date(startCurrentPeriod.getTime());
        startPreviousPeriod = new Date(startCurrentPeriod.getTime() - 24*60*60*1000);
        break;
      case 'week':
        startCurrentPeriod = new Date(now.getTime() - 7*24*60*60*1000);
        endPreviousPeriod = new Date(startCurrentPeriod.getTime());
        startPreviousPeriod = new Date(startCurrentPeriod.getTime() - 7*24*60*60*1000);
        break;
      case 'month':
        startCurrentPeriod = new Date(now);
        startCurrentPeriod.setMonth(startCurrentPeriod.getMonth() - 1);
        endPreviousPeriod = new Date(startCurrentPeriod.getTime());
        startPreviousPeriod = new Date(startCurrentPeriod);
        startPreviousPeriod.setMonth(startPreviousPeriod.getMonth() - 1);
        break;
      case 'year':
        startCurrentPeriod = new Date(now);
        startCurrentPeriod.setFullYear(startCurrentPeriod.getFullYear() - 1);
        endPreviousPeriod = new Date(startCurrentPeriod.getTime());
        startPreviousPeriod = new Date(startCurrentPeriod);
        startPreviousPeriod.setFullYear(startPreviousPeriod.getFullYear() - 1);
        break;
      default:
        startCurrentPeriod = new Date(now.getTime() - 7*24*60*60*1000);
        endPreviousPeriod = new Date(startCurrentPeriod.getTime());
        startPreviousPeriod = new Date(startCurrentPeriod.getTime() - 7*24*60*60*1000);
    }

    // Filtrar datos del periodo anterior
    const previousPeriodReservations = reservations.filter(r => {
      const date = new Date(r.created_at);
      return date >= startPreviousPeriod && date < endPreviousPeriod;
    });
    
    const previousPeriodViews = pageViews.filter(v => {
      const date = new Date(v.viewed_at);
      return date >= startPreviousPeriod && date < endPreviousPeriod;
    });
    
    const previousRate = previousPeriodViews.length > 0 ? 
      (previousPeriodReservations.length / previousPeriodViews.length) * 100 : 0;
    
    const rateChange = previousRate > 0 ? 
      ((currentRate - previousRate) / previousRate) * 100 : 0;

    return {
      rate: currentRate,
      reservations: reservationsCount,
      views: viewsCount,
      previousRate: previousRate,
      change: rateChange
    };
  }, [pageViews, reservations, timeRange]);

  // Crear datos para gráficos de barras horizontales
  const createHorizontalBarData = (data: { name: string, count: number }[]) => {
    return {
      labels: data.map(item => item.name),
      datasets: [{
        label: 'Clicks',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }]
    };
  };

  // Transformar los rankings a formato para gráficos
  const menuItemRankingFormatted = menuItemRanking.map(item => ({
    name: item.name,
    count: item.count
  }));

  const buttonRankingFormatted = buttonRanking.map(btn => ({
    name: btn.platform,
    count: btn.count
  }));

  // Opciones para gráficos de barras horizontales
  const horizontalBarOptions = {
    indexAxis: 'y' as const,
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            return `Clicks: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  // Generate data for menu items horizontal bar chart
  const popularMenuItemsChart = {
    labels: menuItemRanking.map(item => item.name),
    datasets: [{
      label: 'Clicks',
      data: menuItemRanking.map(item => item.count),
      backgroundColor: 'rgba(139, 92, 246, 0.7)', // Púrpura
      borderColor: 'rgb(139, 92, 246)',
      borderWidth: 1
    }]
  };

  // Generate data for delivery/social platforms horizontal bar chart
  const popularPlatformsChart = {
    labels: buttonRanking.map(btn => btn.platform),
    datasets: [{
      label: 'Clicks',
      data: buttonRanking.map(btn => btn.count),
      backgroundColor: 'rgba(16, 185, 129, 0.7)', // Verde
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 1
    }]
  };

  // Generate data for menu categories bar chart
  const menuCategoriesChart = {
    labels: menuCategoryRanking.map(cat => cat.name),
    datasets: [{
      label: 'Clicks',
      data: menuCategoryRanking.map(cat => cat.count),
      backgroundColor: 'rgba(245, 158, 11, 0.7)', // Ámbar
      borderColor: 'rgb(245, 158, 11)',
      borderWidth: 1
    }]
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

  // Generate data for menu items bar chart
  const menuItemsBarChartData = useMemo(() => {
    return {
      labels: menuItemRanking.map(item => item.name),
      datasets: [
        {
          label: 'Clicks',
          data: menuItemRanking.map(item => item.count),
          backgroundColor: 'rgba(139, 92, 246, 0.7)', // Purple
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 1,
        }
      ]
    };
  }, [menuItemRanking]);

  // Generate data for social links bar chart
  const socialLinksBarChartData = useMemo(() => {
    const socialData = buttonRanking
      .filter(btn => socialLinks.some(s => s.platform === btn.platform))
      .slice(0, 5);
    
    return {
      labels: socialData.map(item => item.platform),
      datasets: [
        {
          label: 'Clicks',
          data: socialData.map(item => item.count),
          backgroundColor: 'rgba(59, 130, 246, 0.7)', // Blue
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        }
      ]
    };
  }, [buttonRanking, socialLinks]);

  // Generate data for delivery links bar chart
  const deliveryLinksBarChartData = useMemo(() => {
    const deliveryData = buttonRanking
      .filter(btn => deliveryLinks.some(d => d.platform === btn.platform))
      .slice(0, 5);
    
    return {
      labels: deliveryData.map(item => item.platform),
      datasets: [
        {
          label: 'Clicks',
          data: deliveryData.map(item => item.count),
          backgroundColor: 'rgba(16, 185, 129, 0.7)', // Green
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        }
      ]
    };
  }, [buttonRanking, deliveryLinks]);

  // Common chart options
  const barChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            return `Clicks: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0 // Ensure whole numbers
        }
      }
    }
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

              {(loading || reservationsLoading || buttonClicksLoading) && !timedOut && (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-4 text-gray-500">Cargando estadísticas...</span>
                </div>
              )}
              {timedOut && (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="mb-2 text-2xl">⚠️</div>
                  <div className="text-gray-700 dark:text-gray-200 mb-2">La carga está tardando demasiado.</div>
                  <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded shadow">Reintentar</button>
                </div>
              )}

              {!loading && pageViews.length === 0 && (
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
              )}

              {!loading && pageViews.length > 0 && (
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

                  {/* Tasa de conversión y comparativa */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tasa de conversión</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Tasa actual</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{conversionStats.rate.toFixed(1)}%</div>
                        <div className="mt-2 text-xs">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded ${
                            conversionStats.change > 0 
                              ? 'text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-400' 
                              : conversionStats.change < 0 
                                ? 'text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-400' 
                                : 'text-gray-800 bg-gray-100 dark:text-gray-200 dark:bg-gray-700'
                          }`}>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d={conversionStats.change > 0 
                                  ? "M5 10l7-7m0 0l7 7m-7-7v18" 
                                  : conversionStats.change < 0 
                                    ? "M19 14l-7 7m0 0l-7-7m7 7V3" 
                                    : "M5 12h14"} 
                              />
                            </svg>
                            {conversionStats.change !== 0 ? `${Math.abs(conversionStats.change).toFixed(1)}%` : 'Sin cambios'}
                            {conversionStats.change !== 0 ? (conversionStats.change > 0 ? ' más' : ' menos') : ''}
                          </span>
                          <span className="ml-1 text-gray-500 dark:text-gray-400">vs. periodo anterior</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/20 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Reservas</div>
                        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{conversionStats.reservations}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/20 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Visitas</div>
                        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{conversionStats.views}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/20 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Tasa anterior</div>
                        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{conversionStats.previousRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Visitas por día</h3>
                      <div className="h-80">
                        <Line data={lineChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Fuentes de tráfico detalladas</h3>
                      <div className="h-80">
                        <Pie data={trafficSourcesChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                      </div>
                    </div>
                  </div>

                  {/* Segmentación por dispositivo */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Segmentación por dispositivo</h3>
                      <div className="h-80">
                        <Pie data={deviceChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Clicks por categoría del menú</h3>
                      <div className="h-80">
                        <Bar data={menuCategoriesChart} options={horizontalBarOptions} />
                      </div>
                    </div>
                  </div>

                  {/* Platos más populares (gráfico de barras horizontal) */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Platos más populares</h3>
                    {menuItemRanking.length === 0 ? (
                      <div className="text-gray-500 dark:text-gray-400 text-center py-10">
                        No hay datos de platos para mostrar
                      </div>
                    ) : (
                      <div className="h-64">
                        <Bar 
                          data={popularMenuItemsChart} 
                          options={horizontalBarOptions} 
                        />
                      </div>
                    )}
                  </div>

                  {/* Botones de delivery/redes más usados (gráfico de barras horizontal) */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Botones de delivery/redes más usados</h3>
                    {buttonRanking.length === 0 ? (
                      <div className="text-gray-500 dark:text-gray-400 text-center py-10">
                        No hay datos suficientes
                      </div>
                    ) : (
                      <div className="h-64">
                        <Bar 
                          data={popularPlatformsChart} 
                          options={horizontalBarOptions} 
                        />
                      </div>
                    )}
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

              {(loading || reservationsLoading || buttonClicksLoading) && !timedOut && (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-4 text-gray-500">Cargando estadísticas...</span>
                </div>
              )}
              {timedOut && (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="mb-2 text-2xl">⚠️</div>
                  <div className="text-gray-700 dark:text-gray-200 mb-2">La carga está tardando demasiado.</div>
                  <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded shadow">Reintentar</button>
                </div>
              )}

              {!reservationsLoading && reservations.length === 0 && (
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
              )}

              {!reservationsLoading && reservations.length > 0 && (
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