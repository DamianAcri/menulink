"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from '@supabase/supabase-js';
import i18n from '@/lib/i18n';
import { Toaster, toast } from "sonner";

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

  useEffect(() => {
    // Suscripción global a nuevas reservas para mostrar toast
    let channel: any = null;
    let restaurantId: string | null = null;
    let ignoreFirst = true;

    async function subscribeToReservations() {
      // Obtener el restaurante del usuario
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, name")
        .eq("user_id", session.user.id)
        .single();
      if (!restaurant) return;
      restaurantId = restaurant.id;
      // Suscribirse a inserciones en reservations de este restaurante
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
          (payload) => {
            // Evitar mostrar el toast por reservas ya existentes al conectar
            if (ignoreFirst) {
              ignoreFirst = false;
              return;
            }
            const r = payload.new;
            toast.success(
              <div>
                <b>¡Nueva reserva recibida!</b>
                <div>Cliente: {r.customer_name}</div>
                <div>Fecha: {r.reservation_date} {r.reservation_time?.slice(0,5)}</div>
                <div>Personas: {r.party_size}</div>
              </div>,
              { position: "bottom-right", duration: 7000 }
            );
          }
        )
        .subscribe();
    }
    subscribeToReservations();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Sidebar tipo Toast */}
      <aside className={`hidden md:flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-64'} border-r border-divider bg-white transition-all duration-200 relative`}>
        {/* Botón de toggle fijo arriba */}
        <div className="flex items-center h-16 px-4 border-b border-divider relative">
          {!sidebarCollapsed && (
            <span className="font-bold text-[22px] tracking-tight select-none text-[var(--primary)]">Menu</span>
          )}
          {!sidebarCollapsed && (
            <span className="ml-1 font-bold text-[22px] tracking-tight select-none text-[var(--foreground)]">Link</span>
          )}
          <button
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition`}
            title={sidebarCollapsed ? 'Expandir menú' : 'Comprimir menú'}
            onClick={() => setSidebarCollapsed((v) => !v)}
          >
            {sidebarCollapsed ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
            )}
          </button>
        </div>
        <nav className={`flex-1 flex flex-col gap-1 py-4 ${sidebarCollapsed ? 'items-center' : 'px-4'}`}>
          {renderNavLinks()}
        </nav>
        <div className="p-4 border-t border-divider">
          {/* ...acciones secundarias... */}
        </div>
      </aside>
      {/* Sidebar móvil */}
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
      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-white" style={{ minHeight: '100vh' }}>
        {children}
      </main>
    </div>
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