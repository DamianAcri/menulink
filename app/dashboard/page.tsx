"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Users, Clock, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const [restaurant, setRestaurant] = useState<{
    id: string;
    slug: string;
    subscription_tier: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    views: 0,
    menuItems: 0,
    categories: 0,
  });
  const router = useRouter();
  const [upcomingReservations, setUpcomingReservations] = useState<any[]>([]);
  
  // Agregamos una variable para refrescar los datos cuando sea necesario
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Función para forzar una recarga de datos
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Efecto que se ejecuta al montar el componente o al cambiar refreshTrigger
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Obtener el usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser();
        console.log("Usuario autenticado en dashboard:", user);
        if (!user) return;

        // Buscar el restaurante del usuario actual
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (restaurantError && restaurantError.code !== "PGRST116") {
          console.error("Error fetching restaurant:", restaurantError);
          return;
        }

        // Si no hay restaurante, significa que es la primera vez que el usuario accede
        if (!restaurantData) {
          setLoading(false);
          return;
        }

        setRestaurant(restaurantData);

        // Obtener estadísticas básicas - primero categorías y vistas
        const [viewsResponse, categoriesResponse] = await Promise.all([
          supabase
            .from("page_views")
            .select("count", { count: "exact", head: true })
            .eq("restaurant_id", restaurantData.id),
          supabase
            .from("menu_categories")
            .select("id")
            .eq("restaurant_id", restaurantData.id),
        ]);

        // Luego obtener los elementos del menú usando las categorías
        const categoryIds = (categoriesResponse?.data || []).map(
          (c: { id: string }) => c.id
        );
        const menuItemsResponse =
          categoryIds.length > 0
            ? await supabase
                .from("menu_items")
                .select("id")
                .in("category_id", categoryIds)
            : { data: [] };

        setStats({
          views: viewsResponse.count || 0,
          categories: (categoriesResponse?.data || []).length,
          menuItems: (menuItemsResponse?.data || []).length,
        });
      } catch (error: unknown) {
        console.error("Error en dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]); // Agregar refreshTrigger como dependencia

  useEffect(() => {
    const fetchUpcomingReservations = async () => {
      if (!restaurant) return;
      // Solo reservas futuras (hoy o más adelante), ordenadas por fecha y hora
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("reservations")
        .select("id, customer_name, reservation_date, reservation_time, party_size, status")
        .eq("restaurant_id", restaurant.id)
        .in("status", ["pending", "confirmed"])
        .gte("reservation_date", todayStr)
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true });
      if (!error && data) {
        // Filtrar reservas que son hoy pero ya pasaron (hora menor a la actual)
        const now = new Date();
        const filtered = data.filter((r: any) => {
          if (r.reservation_date > todayStr) return true;
          if (r.reservation_date === todayStr) {
            return r.reservation_time >= now.toTimeString().slice(0,5);
          }
          return false;
        });
        setUpcomingReservations(filtered.slice(0, 4));
      }
    };
    fetchUpcomingReservations();
  }, [restaurant, refreshTrigger]);

  // Verificar si debemos refrescar los datos al enfocar la ventana
  useEffect(() => {
    const handleFocus = () => {
      refreshData(); // Recargar datos cuando la ventana reciba el foco
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Si no hay restaurante configurado, mostrar pantalla de bienvenida
  if (!loading && !restaurant) {
    return <WelcomeScreen />;
  }

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard title="Visitas totales" value={loading ? '...' : stats.views} icon={<CalendarIcon className="w-5 h-5 text-blue-500" />} />
            <StatCard title="Platos en menú" value={loading ? '...' : stats.menuItems} icon={<Users className="w-5 h-5 text-green-500" />} />
            <StatCard title="Categorías" value={loading ? '...' : stats.categories} icon={<Clock className="w-5 h-5 text-yellow-500" />} />
          </div>

          {/* Vista previa del menú */}
          {restaurant && (
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <h3 className="text-lg font-semibold">Vista previa de tu menú</h3>
                <a href={`/r/${restaurant.slug}`} target="_blank" className="button-outline flex items-center gap-2 text-sm">
                  Ver mi página <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="bg-soft p-4">
                <div className="relative h-80 md:h-96 rounded-lg overflow-hidden border">
                  <iframe
                    src={`/r/${restaurant.slug}?preview=1`}
                    className="absolute inset-0 w-full h-full border-0"
                    title="Vista previa del menú"
                  ></iframe>
                </div>
              </div>
            </div>
          )}

          {/* Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickActionCard
              title="Añadir platos"
              description="Actualiza tu menú con nuevos productos o categorías."
              href="/dashboard/menu"
              icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v8m4-4H8"/></svg>}
              buttonText="Ir a menú"
            />
            <QuickActionCard
              title="Personalizar apariencia"
              description="Cambia colores, logo y estilo de tu menú."
              href="/dashboard/profile"
              icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M7.5 12a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v.5a2.5 2.5 0 01-2.5 2.5h-4A2.5 2.5 0 017 12.5v-.5z"/></svg>}
              buttonText="Personalizar"
              outline
            />
            <QuickActionCard
              title="Actualizar contacto"
              description="Modifica la información de contacto y ubicación."
              href="/dashboard/contact"
              icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10.5V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h7.5"/><path d="M16 21l5-5m0 0l-5-5m5 5H9"/></svg>}
              buttonText="Editar contacto"
              outline
            />
          </div>
        </div>
        {/* Columna lateral */}
        <div className="flex flex-col gap-8">
          {/* Próximas reservas */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Próximas reservas</h3>
              <a href="/dashboard/reservations" className="button-outline text-xs">Ver todas</a>
            </div>
            {upcomingReservations.length === 0 ? (
              <div className="text-gray-500 text-sm py-8 text-center">No hay reservas próximas</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcomingReservations.map((r) => (
                  <li key={r.id} className="py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{r.customer_name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {r.reservation_date} {r.reservation_time?.slice(0,5)}
                        <Users className="w-4 h-4 ml-2" />
                        {r.party_size} {r.party_size === 1 ? 'persona' : 'personas'}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${r.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{r.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex justify-center">
              <a href="/dashboard/reservations" className="button-primary w-full">Ver todas las reservas</a>
            </div>
          </div>
          {/* Plan actual */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Plan actual</h3>
            <div className="mb-2 text-blue-700 font-bold">Premium</div>
            <ul className="text-sm text-gray-700 mb-4 list-disc pl-5">
              <li>Menú digital ilimitado</li>
              <li>Reservas online</li>
              <li>Estadísticas avanzadas</li>
              <li>Soporte prioritario</li>
            </ul>
            <button className="button-outline w-full">Mejorar plan</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: any; icon: React.ReactNode }) {
  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">{icon} {title}</div>
      <div className="text-2xl font-bold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function QuickActionCard({ title, description, href, icon, buttonText, outline }: { title: string; description: string; href: string; icon: React.ReactNode; buttonText: string; outline?: boolean }) {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 mb-1">{icon}<span className="font-medium">{title}</span></div>
      <p className="text-secondary text-sm flex-1">{description}</p>
      <a href={href} className={outline ? "button-outline w-fit" : "button-primary w-fit"}>{buttonText}</a>
    </div>
  );
}

function WelcomeScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: "",
    slug: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Si se está editando el nombre del restaurante, generar un slug automáticamente
    if (name === "restaurantName") {
      const generatedSlug = value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");
      setFormData({
        ...formData,
        restaurantName: value,
        slug: generatedSlug,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Obtener el usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No se encontró usuario autenticado");
      }
      // Crear el registro del restaurante
      const { error } = await supabase
        .from("restaurants")
        .insert([
          {
            user_id: user.id,
            name: formData.restaurantName,
            slug: formData.slug,
            description: formData.description,
            subscription_tier: "free",
            theme_color: "#3B82F6", // Color azul por defecto
            secondary_color: "#1E40AF",
            font_family: "Inter, sans-serif",
          },
        ])
        .select()
        .single();
      if (error) throw error;
      // Recargar la página para mostrar el dashboard
      window.location.reload();
    } catch (error: unknown) {
      // Verificamos si el error es un objeto y tiene una propiedad 'message'
      if (error instanceof Error) {
        alert(`Error al crear el restaurante: ${error.message}`);
      } else {
        // Si no es un Error estándar, mostramos un mensaje genérico
        alert(`Error al crear el restaurante: Ha ocurrido un error inesperado`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            ¡Bienvenido a MenuLink!
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Para comenzar, necesitamos un poco de información sobre tu
              negocio. Esto nos permitirá crear tu página personalizada de menú.
            </p>
          </div>
          <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="restaurantName"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre de tu restaurante o negocio
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="restaurantName"
                  id="restaurantName"
                  required
                  value={formData.restaurantName}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Ej: Café Delicioso"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700"
              >
                URL personalizada
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  menulink.com/r/
                </span>
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  placeholder="mi-restaurante"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Esta será la URL donde tus clientes podrán ver tu menú. Solo
                letras, números y guiones.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Descripción breve
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Describe tu negocio en pocas palabras..."
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Una breve descripción de tu negocio que aparecerá en tu página
                de menú.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white"
                style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 0 2px var(--accent)' }}
              >
                {loading ? "Creando..." : "Crear mi página de menú"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
