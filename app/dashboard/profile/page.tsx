"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<{
    id: string;
    name: string;
    description: string;
    slug: string;
    theme_color: string;
    secondary_color: string;
    font_family: string;
    logo_url?: string;
    cover_image_url?: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    themeColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    fontFamily: "Inter, sans-serif",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState({ type: "", message: "" });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fontOptions = [
    { name: "Inter", value: "Inter, sans-serif" },
    { name: "Roboto", value: "Roboto, sans-serif" },
    { name: "Open Sans", value: "Open Sans, sans-serif" },
    { name: "Playfair Display", value: "Playfair Display, serif" },
    { name: "Montserrat", value: "Montserrat, sans-serif" },
    { name: "Lato", value: "Lato, sans-serif" },
  ];

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Obtener el restaurante del usuario
        const { data: restaurantData, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error fetching restaurant:", error);
          return;
        }

        setRestaurant(restaurantData);
        setFormData({
          name: restaurantData.name || "",
          description: restaurantData.description || "",
          slug: restaurantData.slug || "",
          themeColor: restaurantData.theme_color || "#3B82F6",
          secondaryColor: restaurantData.secondary_color || "#1E40AF",
          fontFamily: restaurantData.font_family || "Inter, sans-serif",
        });

        if (restaurantData.logo_url) {
          setLogoPreview(restaurantData.logo_url);
        }

        if (restaurantData.cover_image_url) {
          setCoverPreview(restaurantData.cover_image_url);
        }
      } catch (error) {
        console.error("Error in profile page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "slug") {
      // Validar que el slug solo contenga letras, números y guiones
      const isValidSlug = /^[a-z0-9\-]+$/.test(value);
      if (!isValidSlug && value) {
        setSaveMessage({
          type: "error",
          message: "El slug solo puede contener letras minúsculas, números y guiones",
        });
      } else {
        setSaveMessage({ type: "", message: "" });
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File, path: string) => {
    // Verificar la sesión de usuario antes de subir
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Estado de sesión:', session ? 'Autenticado' : 'No autenticado');
    
    // Verificar el archivo
    console.log('Subiendo archivo:', { 
      nombre: file.name, 
      tamaño: `${(file.size / 1024).toFixed(2)} KB`,
      tipo: file.type 
    });
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;
    console.log('Ruta destino:', filePath);
    
    try {
      // Intentar la subida con upsert explícito
      const { data, error: uploadError } = await supabase.storage
        .from('menulink')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error('Error completo al subir imagen:', uploadError);
        console.error('Mensaje:', uploadError.message);
        console.error('Detalles adicionales:', uploadError);
        throw uploadError;
      }
      
      console.log('Subida exitosa:', data);
      
      const { data: { publicUrl } } = supabase.storage
        .from('menulink')
        .getPublicUrl(filePath);
      
      console.log('URL pública generada:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Error en uploadImage:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage({ type: "", message: "" });

    try {
      if (!restaurant) {
        throw new Error("No restaurant data found");
      }

      // Verificar si el slug ya existe (excepto el del propio restaurante)
      if (formData.slug !== restaurant.slug) {
        const { data: slugCheck } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', formData.slug)
          .neq('id', restaurant.id)
          .single();
        
        if (slugCheck) {
          setSaveMessage({
            type: "error",
            message: "Esta URL ya está en uso. Por favor, elige otra.",
          });
          throw new Error("Slug already exists");
        }
      }

      // Preparar los datos a actualizar
      const updateData: Record<string, unknown> = {
        name: formData.name,
        description: formData.description,
        slug: formData.slug,
        theme_color: formData.themeColor,
        secondary_color: formData.secondaryColor,
        font_family: formData.fontFamily,
      };

      // Subir el logo si se ha cambiado
      if (logoFile) {
        const logoUrl = await uploadImage(logoFile, `restaurants/${restaurant.id}/logo`);
        updateData.logo_url = logoUrl;
      }

      // Subir la imagen de portada si se ha cambiado
      if (coverFile) {
        const coverUrl = await uploadImage(coverFile, `restaurants/${restaurant.id}/cover`);
        updateData.cover_image_url = coverUrl;
      }

      // Actualizar el restaurante en la base de datos
      const { error: updateError } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', restaurant.id);

      if (updateError) {
        throw updateError;
      }

      setSaveMessage({
        type: "success",
        message: "¡Perfil actualizado correctamente!",
      });
      
      // Limpiar el mensaje después de unos segundos
      setTimeout(() => {
        setSaveMessage({ type: "", message: "" });
      }, 3000);
    } catch (error: unknown) {
      console.error("Error saving profile:", error);
      setSaveMessage({
        type: "error",
        message: `Error al guardar: ${(error as Error).message || "Ocurrió un problema"}`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl">
            Editar Perfil
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Personaliza la información y apariencia de tu restaurante.
          </p>
        </div>
      </div>

      {saveMessage.message && (
        <div
          className={`p-4 mb-6 rounded-md ${
            saveMessage.type === "success"
              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          }`}
        >
          {saveMessage.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
            Información del Negocio
          </h3>

          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
            <div className="sm:col-span-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nombre del negocio
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Descripción
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Breve descripción que se mostrará en tu página
              </p>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                URL personalizada
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 dark:bg-gray-700 bg-gray-50 text-gray-500 dark:text-gray-400 sm:text-sm">
                  menulink.com/r/
                </span>
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  required
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Esta será la URL donde tus clientes podrán ver tu menú
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
            Imágenes y Marca
          </h3>

          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Logo
              </label>
              <div className="mt-1 flex items-center">
                {logoPreview ? (
                  <div className="relative inline-block">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 w-16 object-cover rounded-md"
                      width={64}
                      height={64}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        setLogoFile(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <span className="h-16 w-16 overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="ml-5 bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cambiar
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Logotipo de tu negocio (recomendado: 400x400px)
              </p>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Imagen de portada
              </label>
              <div className="mt-1">
                {coverPreview ? (
                  <div className="relative">
                    <Image
                      src={coverPreview}
                      alt="Cover preview"
                      className="h-32 w-full object-cover rounded-md"
                      width={1200}
                      height={400}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPreview(null);
                        setCoverFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div onClick={() => coverInputRef.current?.click()} className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Haz clic para subir una imagen de portada
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Imagen destacada para tu página (recomendado: 1200x400px)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
            Personalización
          </h3>

          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="themeColor"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Color principal
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="color"
                  name="themeColor"
                  id="themeColor"
                  value={formData.themeColor}
                  onChange={handleInputChange}
                  className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={formData.themeColor}
                  onChange={handleInputChange}
                  name="themeColor"
                  className="ml-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 block sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Color principal para botones y acentos
              </p>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="secondaryColor"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Color secundario
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="color"
                  name="secondaryColor"
                  id="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  name="secondaryColor"
                  className="ml-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 block sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Color secundario para detalles y fondos
              </p>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="fontFamily"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Fuente
              </label>
              <div className="mt-1">
                <select
                  id="fontFamily"
                  name="fontFamily"
                  value={formData.fontFamily}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Tipo de letra para el texto de tu menú
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>

      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Perfil del restaurante</h1>
        <ul className="space-y-4">
          <li>
            <Link href="/dashboard/profile/social-links" className="text-blue-600 hover:underline">
              Gestionar redes sociales y enlaces de delivery
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}