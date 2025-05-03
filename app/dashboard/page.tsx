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

  useEffect(() => {
    const fetchData = async () => {
      try {
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
  }, []);

  // Si no hay restaurante configurado, mostrar pantalla de bienvenida
  if (!loading && !restaurant) {
    return <WelcomeScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Bienvenido a MenuLink, gestiona tu menú y presencia online.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href={`/r/${restaurant?.slug || ""}`}
            target="_blank"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ver mi página{" "}
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400 dark:text-gray-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Visitas totales
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {loading ? "..." : stats.views}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/dashboard/stats"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
              >
                Ver todas las estadísticas
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400 dark:text-gray-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Platos en tu menú
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {loading ? "..." : stats.menuItems}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/dashboard/menu"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
              >
                Administrar menú
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400 dark:text-gray-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Plan actual
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {loading
                        ? "..."
                        : restaurant?.subscription_tier === "premium"
                          ? "Premium"
                          : restaurant?.subscription_tier === "pro"
                            ? "Pro"
                            : "Básico"}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/dashboard/settings"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
              >
                Administrar suscripción
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Acciones rápidas
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    <Link href="/dashboard/menu" className="hover:underline">
                      Añadir platos al menú
                    </Link>
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Actualiza tu menú con nuevos productos o categorías
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    <Link href="/dashboard/profile" className="hover:underline">
                      Personalizar apariencia
                    </Link>
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Cambia colores, logo y estilo de tu menú
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    <Link href="/dashboard/contact" className="hover:underline">
                      Actualizar contacto
                    </Link>
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Edita horarios, ubicación y WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vista previa del menú */}
      {restaurant && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Vista previa de tu menú
            </h3>
            <div className="mt-5 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
              <div className="relative h-96 overflow-hidden rounded-md">
                <iframe
                  src={`/r/${restaurant?.slug || ""}`}
                  className="absolute inset-0 w-full h-full border-0"
                  title="Vista previa del menú"
                ></iframe>
              </div>
              <div className="mt-4 text-center">
                <Link
                  href={`/r/${restaurant?.slug || ""}`}
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Abrir en nueva pestaña{" "}
                  <span aria-hidden="true" className="ml-2">
                    →
                  </span>
                </Link>
              </div>
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
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            ¡Bienvenido a MenuLink!
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            <p>
              Para comenzar, necesitamos un poco de información sobre tu
              negocio. Esto nos permitirá crear tu página personalizada de menú.
            </p>
          </div>
          <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="restaurantName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Ej: Café Delicioso"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                URL personalizada
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm">
                  menulink.com/r/
                </span>
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="mi-restaurante"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Esta será la URL donde tus clientes podrán ver tu menú. Solo
                letras, números y guiones.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Describe tu negocio en pocas palabras..."
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Una breve descripción de tu negocio que aparecerá en tu página
                de menú.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
