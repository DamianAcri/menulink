"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from '@supabase/supabase-js';
import i18n from '@/lib/i18n';
import { Toaster, toast } from "sonner";
import { Bell, User as UserIcon, ChevronDown, Search, User2, Menu as MenuIcon } from "lucide-react";
import { format } from 'date-fns';

// Contexto para controlar el toast de nueva reserva y evitar duplicados
interface ReservationToastContextType {
  lastCreatedReservationId: string | null;
  setLastCreatedReservationId: (id: string | null) => void;
}
const ReservationToastContext = createContext<ReservationToastContextType>({
  lastCreatedReservationId: null,
  setLastCreatedReservationId: () => {},
});

export function useReservationToast() {
  return useContext(ReservationToastContext);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentLang, setCurrentLang] = useState('es');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [lastCreatedReservationId, setLastCreatedReservationId] = useState<string | null>(null);

  useEffect(() => {
    // Solo en cliente: sincronizar idioma con localStorage
    if (typeof window !== 'undefined') {
      const lang = localStorage.getItem('lang') || 'es';
      setCurrentLang(lang);
    }
  }, []);

  useEffect(() => {
    i18n.changeLanguage(currentLang);
  }, [currentLang]);

  useEffect(() => {
    // Escuchar cambios en localStorage para actualizar el idioma en caliente
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lang' && e.newValue) {
        setCurrentLang(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirigir al login si no hay usuario autenticado
        router.push("/auth/login");
        return;
      }
      
      setUser(session.user as User);
      
      // Verificar si el usuario es nuevo y si no está en la ruta de onboarding
      const isNewUser = session.user?.user_metadata?.is_new_user === true;
      const hasRestaurant = await checkUserHasRestaurant(session.user.id);
      
      if (isNewUser && !hasRestaurant && !pathname.includes('/dashboard/onboarding')) {
        // Si el usuario es nuevo, no tiene restaurante y no está en la ruta de onboarding,
        // redirigirlo al onboarding
        router.push("/dashboard/onboarding");
        return;
      }
      
      setLoading(false);
    };
    
    checkUser();
  }, [router, pathname]);
  
  // Función para verificar si el usuario ya tiene un restaurante configurado
  const checkUserHasRestaurant = async (userId: string) => {
    const { data } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    return !!data;
  };

  // Verificar si un enlace está activo
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Cargar notificaciones al cargar el dashboard o cambiar restaurante
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!restaurant) return;
      setRestaurantId(restaurant.id);
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });
      setNotifications(notifs || []);
      setUnreadCount((notifs || []).filter(n => !n.is_read).length);
    };
    fetchNotifications();
  }, [user]);

  // Marcar como leídas al abrir el panel
  useEffect(() => {
    if (notifPanelOpen && unreadCount > 0 && restaurantId) {
      const markAllRead = async () => {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('restaurant_id', restaurantId)
          .eq('is_read', false);
        setNotifications((prev) => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      };
      markAllRead();
    }
  }, [notifPanelOpen, unreadCount, restaurantId]);

  useEffect(() => {
    // Suscripción global a nuevas reservas para mostrar toast y guardar notificación
    let channel: any = null;
    async function subscribeToReservations() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, name")
        .eq("user_id", session.user.id)
        .single();
      if (!restaurant) return;
      setRestaurantId(restaurant.id);
      channel = supabase
        .channel("dashboard-global-reservations")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "reservations",
            filter: `restaurant_id=eq.${restaurant.id}`,
          },
          async (payload) => {
            const r = payload.new;
            // Evitar duplicado si la reserva la acaba de crear este usuario
            if (r.id === lastCreatedReservationId) return;
            toast.success(
              <div>
                <b>¡Nueva reserva recibida!</b>
                <div>Cliente: {r.customer_name}</div>
                <div>Fecha: {r.reservation_date} {r.reservation_time?.slice(0,5)}</div>
                <div>Personas: {r.party_size}</div>
              </div>,
              { position: "bottom-right", duration: 7000 }
            );
            // Guardar notificación en Supabase
            await supabase.from('notifications').insert({
              restaurant_id: restaurant.id,
              type: 'reservation',
              message: `Nueva reserva de ${r.customer_name} para el ${r.reservation_date} a las ${r.reservation_time?.slice(0,5)} (${r.party_size} personas)`
            });
            // Refrescar notificaciones
            const { data: notifs } = await supabase
              .from('notifications')
              .select('*')
              .eq('restaurant_id', restaurant.id)
              .order('created_at', { ascending: false });
            setNotifications(notifs || []);
            setUnreadCount((notifs || []).filter(n => !n.is_read).length);
          }
        )
        .subscribe();
    }
    subscribeToReservations();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [lastCreatedReservationId]);

  // Cerrar notificaciones al hacer click fuera
  useEffect(() => {
    if (!notifPanelOpen) return;
    function handleClick(e: MouseEvent) {
      // Si el click es fuera del panel y fuera del botón campana, cerrar
      const notifPanel = document.getElementById('notif-panel');
      const bellBtn = document.getElementById('notif-bell-btn');
      if (
        notifPanel &&
        !notifPanel.contains(e.target as Node) &&
        bellBtn &&
        !bellBtn.contains(e.target as Node)
      ) {
        setNotifPanelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifPanelOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Altura del navbar (en px)
  const NAVBAR_HEIGHT = 64;
  const SIDEBAR_WIDTH = sidebarCollapsed ? 64 : 256;

  return (
    <ReservationToastContext.Provider value={{ lastCreatedReservationId, setLastCreatedReservationId }}>
      {/* Toaster de Sonner para mostrar los toasts globales */}
      <Toaster position="bottom-right" richColors />
      <div className="min-h-screen bg-white">
        {/* NAVBAR SUPERIOR */}
        <nav
          className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 flex items-center h-16 px-4 md:px-8"
          style={{ height: NAVBAR_HEIGHT }}
        >
          {/* Logo y botón menú/comprimir SIEMPRE visibles */}
          <div className="flex items-center gap-2 min-w-[160px] md:min-w-0" style={{ width: SIDEBAR_WIDTH }}>
            <button
              className="p-2 rounded hover:bg-gray-100"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={sidebarCollapsed ? 'Expandir menú' : 'Comprimir menú'}
            >
              {sidebarCollapsed ? (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 24 24"><path d="M9 5l7 7-7 7"/></svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
              )}
            </button>
            <span className="font-bold text-xl text-gray-900 select-none ml-1">Menu</span>
            <span className="font-bold text-xl text-blue-700 select-none">Link</span>
          </div>
          {/* Buscador centrado respecto al contenido principal */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-3 py-2 rounded-full bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
          </div>
          {/* Iconos a la derecha */}
          <div className="flex items-center gap-3 ml-4">
            <button
              id="notif-bell-btn"
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 transition"
              onClick={() => setNotifPanelOpen((v) => !v)}
              aria-label="Notificaciones"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            {notifPanelOpen && (
              <div
                id="notif-panel"
                className="absolute right-16 top-14 w-80 bg-white border border-gray-100 rounded-lg shadow-lg py-2 z-50 animate-fade-in max-h-96 overflow-y-auto"
              >
                <div className="px-4 py-2 text-sm font-semibold border-b">Notificaciones</div>
                {notifications.length === 0 && (
                  <div className="px-4 py-6 text-center text-gray-400 text-sm">No hay notificaciones</div>
                )}
                {notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b last:border-b-0 ${!n.is_read ? 'bg-blue-50' : ''}`}>
                    <div className="text-sm text-gray-800">{n.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{format(new Date(n.created_at), 'dd/MM/yyyy HH:mm')}</div>
                  </div>
                ))}
              </div>
            )}
            <UserMenu user={user} onSignOut={handleSignOut} />
          </div>
        </nav>
        {/* SIDEBAR FIJO */}
        <aside
          className={`hidden md:flex flex-col fixed top-0 left-0 z-20 bg-white border-r border-divider transition-all duration-200`}
          style={{ width: SIDEBAR_WIDTH, height: `calc(100vh - ${NAVBAR_HEIGHT}px)`, top: NAVBAR_HEIGHT }}
        >
          {/* Solo links, sin logo ni botón */}
          <nav className={`flex-1 flex flex-col gap-1 py-4 ${sidebarCollapsed ? 'items-center' : 'px-4'}`}>
            {renderNavLinks()}
          </nav>
          <div className="p-4 border-t border-divider">
            <a
              href="mailto:soporte@menulink.com"
              className="block text-sm text-blue-700 hover:underline text-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              ¿Necesitas ayuda? Soporte
            </a>
          </div>
        </aside>
        {/* Sidebar móvil (sin cambios) */}
        <div className={`md:hidden ${isSidebarOpen ? "block" : "hidden"} fixed inset-0 z-40 flex`}>
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsSidebarOpen(false)}></div>
          <aside className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-divider">
            <div className="flex items-center h-16 px-6 font-bold text-[22px] tracking-tight select-none">
              <span className="text-[var(--primary)]">Menu</span><span className="ml-1 text-[var(--foreground)]">Link</span>
            </div>
            <nav className="flex-1 py-3 px-4 space-y-1">
              {renderNavLinks()}
            </nav>
          </aside>
        </div>
        {/* MAIN desplazado */}
        <main
          className="flex-1 overflow-y-auto p-6 md:p-8 bg-white"
          style={{ marginLeft: SIDEBAR_WIDTH, marginTop: NAVBAR_HEIGHT, transition: 'margin-left 0.2s' }}
        >
          {children}
        </main>
      </div>
    </ReservationToastContext.Provider>
  );

  function renderNavLinks() {
    const links = [
      { name: "Dashboard", href: "/dashboard", icon: (
        <svg className="mr-3 h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )},
      { name: "Perfil", href: "/dashboard/profile", icon: (
        <svg className="mr-3 h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )},
      { name: "Menú", href: "/dashboard/menu", icon: (
        <svg className="mr-3 h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )},
      { name: "Reservas", href: "/dashboard/reservations", icon: (
        <svg className="mr-3 h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )},
      { name: "Horario", href: "/dashboard/schedule", icon: (
        <svg className="mr-3 h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z M8 11h8M8 15h6" />
        </svg>
      )},
      { name: "Contacto", href: "/dashboard/contact", icon: (
        <svg className="mr-3 h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )},
      { name: "Redes Sociales", href: "/dashboard/social", icon: (
        <svg className="mr-3 h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )},
      { name: "Herramientas", href: "/dashboard/tools", icon: (
        <svg className="mr-3 h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )},
      { name: "CRM", href: "/dashboard/crm", icon: (
        <svg className="mr-3 h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4V7a4 4 0 10-8 0v3m12 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 012-2h12a2 2 0 012 2z" />
        </svg>
      )},
      { name: "Estadísticas", href: "/dashboard/stats", icon: (
        <svg className="mr-3 h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )},
      { name: "Configuración", href: "/dashboard/settings", icon: (
        <svg className="mr-3 h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )},
    ];

    return links.map((link) => {
      const active = isActive(link.href);
      return (
        <div key={link.href} className="relative group w-full">
          <Link
            href={link.href}
            className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-md text-base font-medium transition-colors
              ${active ? "border-l-2 border-blue-600 bg-[var(--card-bg-alt)] text-[var(--primary)]" : "text-[var(--foreground)] hover:bg-gray-100"}
              ${sidebarCollapsed ? 'w-12 h-12 mx-auto my-1' : ''}`}
          >
            <span className={`icon-primary flex items-center justify-center ${sidebarCollapsed ? 'w-7 h-7' : 'w-7 h-7'} transition-all duration-200`}>{link.icon}</span>
            {!sidebarCollapsed && (
              <span className={active ? "font-semibold" : "text-secondary font-normal"}>{link.name}</span>
            )}
          </Link>
          {/* Tooltip al hacer hover cuando está comprimido */}
          {sidebarCollapsed && (
            <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow transition-opacity duration-150">
              {link.name}
            </span>
          )}
        </div>
      );
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }
}

function UserMenu({ user, onSignOut }: { user: any, onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("#user-menu-dropdown")) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  return (
    <div className="relative" id="user-menu-dropdown">
      <button
        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 transition"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menú de usuario"
      >
        <User2 className="w-5 h-5 text-gray-600" />
        <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-2 z-50 animate-fade-in">
          <div className="px-4 py-2 text-xs text-gray-500">{user?.email || "Mi cuenta"}</div>
          <a href="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Perfil</a>
          <a href="/dashboard/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Configuración</a>
          <div className="px-4 py-2 text-xs text-gray-400">Plan: Básico</div>
          <button
            onClick={onSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}