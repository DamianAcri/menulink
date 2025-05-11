"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-secondary text-base">Bienvenido a MenuLink, gestiona tu menú y presencia online.</p>
      </div>
      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card relative">
          <span className="absolute top-4 right-4 icon-primary">
            {/* icono Lucide: Eye */}
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </span>
          <div className="text-xs text-secondary mb-1">Visitas totales</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">{loading ? "..." : stats.views}</div>
        </div>
        <div className="card relative">
          <span className="absolute top-4 right-4 icon-primary">
            {/* icono Lucide: UtensilsCrossed */}
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16.5 2.5 21 7m-7.5 7.5L3 21m0-4.5L7.5 16.5m9-9L21 3m-7.5 7.5L3 3"/></svg>
          </span>
          <div className="text-xs text-secondary mb-1">Platos en tu menú</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">{loading ? "..." : stats.menuItems}</div>
        </div>
        <div className="card relative">
          <span className="absolute top-4 right-4 icon-primary">
            {/* icono Lucide: Timer */}
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </span>
          <div className="text-xs text-secondary mb-1">Plan actual</div>
          <div className="text-2xl font-bold text-[var(--foreground)]">
            {loading
              ? "..."
              : restaurant?.subscription_tier === "premium"
              ? "Premium"
              : restaurant?.subscription_tier === "pro"
              ? "Pro"
              : "Básico"}
          </div>
        </div>
      </div>
      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="icon-primary">
              {/* icono Lucide: PlusCircle */}
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v8m4-4H8"/></svg>
            </span>
            <span className="font-medium">Añadir platos</span>
          </div>
          <p className="text-secondary text-sm">Actualiza tu menú con nuevos productos o categorías.</p>
          <a href="/dashboard/menu" className="button-primary w-fit">Ir a menú</a>
        </div>
        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="icon-primary">
              {/* icono Lucide: Palette */}
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M7.5 12a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v.5a2.5 2.5 0 01-2.5 2.5h-4A2.5 2.5 0 017 12.5v-.5z"/></svg>
            </span>
            <span className="font-medium">Personalizar apariencia</span>
          </div>
          <p className="text-secondary text-sm">Cambia colores, logo y estilo de tu menú.</p>
          <a href="/dashboard/profile" className="button-outline w-fit">Personalizar</a>
        </div>
      </div>
      {/* Vista previa del menú */}
      {restaurant && (
        <div className="card mt-6">
          <h3 className="text-lg font-semibold mb-4">Vista previa de tu menú</h3>
          <div className="rounded-lg shadow-inner bg-soft p-6">
            <div className="relative h-96 overflow-hidden rounded-md">
              <iframe
                src={`/r/${restaurant?.slug || ""}`}
                className="absolute inset-0 w-full h-full border-0"
                title="Vista previa del menú"
              ></iframe>
            </div>
            <div className="mt-4 text-center">
              <a
                href={`/r/${restaurant?.slug || ""}`}
                target="_blank"
                className="button-outline"
              >
                Abrir en nueva pestaña
              </a>
            </div>
          </div>
        </div>
      )}
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
