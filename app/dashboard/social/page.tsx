"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

// Interfaces para tipos de datos
interface SocialLink {
  id?: string;
  restaurant_id: string;
  platform: string;
  url: string;
  display_order: number;
}

interface DeliveryLink {
  id?: string;
  restaurant_id: string;
  platform: string;
  url: string;
  display_order: number;
}

// Plataformas sociales disponibles
const SOCIAL_PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "instagram.svg" },
  { id: "facebook", name: "Facebook", icon: "facebook.svg" },
  { id: "twitter", name: "Twitter", icon: "twitter.svg" },
  { id: "tiktok", name: "TikTok", icon: "tiktok.svg" },
  { id: "youtube", name: "YouTube", icon: "youtube.svg" },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin.svg" },
  { id: "website", name: "Sitio Web", icon: "globe.svg" },
];

// Plataformas de delivery disponibles
const DELIVERY_PLATFORMS = [
  { id: "uber_eats", name: "Uber Eats", icon: "ubereats.svg" },
  { id: "glovo", name: "Glovo", icon: "glovo.svg" },
  { id: "deliveroo", name: "Deliveroo", icon: "deliveroo.svg" },
  { id: "just_eat", name: "Just Eat", icon: "justeat.svg" },
  { id: "custom", name: "Otro servicio", icon: "delivery.svg" },
];

function SocialLinksPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState({ type: "", message: "" });
  
  // Estados para las listas de enlaces
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [deliveryLinks, setDeliveryLinks] = useState<DeliveryLink[]>([]);
  
  // Estados para modales y formularios
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | DeliveryLink | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [socialForm, setSocialForm] = useState({
    platform: "",
    url: "",
  });
  
  const [deliveryForm, setDeliveryForm] = useState({
    platform: "",
    url: "",
    custom_name: "",
  });
  
  // Carga inicial de datos
  useEffect(() => {
    const fetchLinkData = async () => {
      try {
        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Obtener el restaurante del usuario
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, user_id')
          .eq('user_id', user.id)
          .single();

        // Log para depuración: compara user.id y restaurant.user_id
        console.log("user.id:", user.id, "restaurant.id:", restaurant?.id, "restaurant.user_id:", restaurant?.user_id);

        if (restaurantError || !restaurant) {
          console.error("Error fetching restaurant:", restaurantError);
          setLoading(false);
          return;
        }

        setRestaurantId(restaurant.id);

        // Cargar enlaces sociales
        const { data: socialData, error: socialError } = await supabase
          .from('social_links')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('display_order', { ascending: true });

        if (socialError) {
          console.error("Error fetching social links:", socialError);
        } else {
          setSocialLinks(socialData || []);
        }

        // Cargar enlaces de delivery
        const { data: deliveryData, error: deliveryError } = await supabase
          .from('delivery_links')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('display_order', { ascending: true });

        if (deliveryError) {
          console.error("Error fetching delivery links:", deliveryError);
        } else {
          setDeliveryLinks(deliveryData || []);
        }
      } catch (error) {
        console.error("Error in social links page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinkData();
  }, []);

  const handleAddSocialLink = () => {
    setIsEditing(false);
    setEditingLink(null);
    setSocialForm({ platform: "", url: "" });
    setShowSocialModal(true);
  };

  const handleEditSocialLink = (link: SocialLink) => {
    setIsEditing(true);
    setEditingLink(link);
    setSocialForm({
      platform: link.platform,
      url: link.url,
    });
    setShowSocialModal(true);
  };

  const handleDeleteSocialLink = async (linkId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este enlace?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      // Actualizar estado local
      setSocialLinks(socialLinks.filter(link => link.id !== linkId));

      setSaveMessage({
        type: "success",
        message: "Enlace eliminado correctamente",
      });
      
      setTimeout(() => {
        setSaveMessage({ type: "", message: "" });
      }, 3000);
    } catch (error: unknown) {
      console.error("Error deleting social link:", error);
      setSaveMessage({
        type: "error",
        message: `Error al eliminar: ${error instanceof Error ? error.message : "Ocurrió un problema"}`,
      });
    }
  };

  const handleAddDeliveryLink = () => {
    setIsEditing(false);
    setEditingLink(null);
    setDeliveryForm({ platform: "", url: "", custom_name: "" });
    setShowDeliveryModal(true);
  };

  const handleEditDeliveryLink = (link: DeliveryLink) => {
    setIsEditing(true);
    setEditingLink(link);
    setDeliveryForm({
      platform: link.platform,
      url: link.url,
      custom_name: link.platform === "custom" ? link.platform : "",
    });
    setShowDeliveryModal(true);
  };

  const handleDeleteDeliveryLink = async (linkId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este enlace?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('delivery_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      // Actualizar estado local
      setDeliveryLinks(deliveryLinks.filter(link => link.id !== linkId));

      setSaveMessage({
        type: "success",
        message: "Enlace eliminado correctamente",
      });
      
      setTimeout(() => {
        setSaveMessage({ type: "", message: "" });
      }, 3000);
    } catch (error: unknown) {
      console.error("Error deleting delivery link:", error);
      setSaveMessage({
        type: "error",
        message: `Error al eliminar: ${error instanceof Error ? error.message : "Ocurrió un problema"}`,
      });
    }
  };

  const handleSaveSocialLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    setSaving(true);
    
    try {
      if (isEditing && editingLink) {
        // Actualizar enlace existente
        const { error } = await supabase
          .from('social_links')
          .update({
            platform: socialForm.platform,
            url: socialForm.url,
          })
          .eq('id', editingLink.id);

        if (error) throw error;

        // Actualizar estado local
        setSocialLinks(links => links.map(link => 
          link.id === editingLink.id 
            ? { ...link, platform: socialForm.platform, url: socialForm.url }
            : link
        ));
      } else {
        // Crear nuevo enlace
        const newDisplayOrder = socialLinks.length > 0 
          ? Math.max(...socialLinks.map(l => l.display_order)) + 1 
          : 0;
          
        const { data, error } = await supabase
          .from('social_links')
          .insert({
            restaurant_id: restaurantId,
            platform: socialForm.platform,
            url: socialForm.url,
            display_order: newDisplayOrder,
          })
          .select()
          .single();

        if (error) throw error;

        // Actualizar estado local
        setSocialLinks([...socialLinks, data as SocialLink]);
      }

      setShowSocialModal(false);
      setSaveMessage({
        type: "success",
        message: "Enlace social guardado correctamente",
      });
      
      setTimeout(() => {
        setSaveMessage({ type: "", message: "" });
      }, 3000);
    } catch (error: unknown) {
      console.error("Error saving social link:", error);
      setSaveMessage({
        type: "error",
        message: `Error al guardar: ${error instanceof Error ? error.message : "Ocurrió un problema"}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDeliveryLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    setSaving(true);
    
    try {
      // Si es un enlace personalizado, usamos el nombre personalizado
      const platform = deliveryForm.platform === "custom" 
        ? deliveryForm.custom_name 
        : deliveryForm.platform;
        
      if (isEditing && editingLink) {
        // Actualizar enlace existente
        const { error } = await supabase
          .from('delivery_links')
          .update({
            platform: platform,
            url: deliveryForm.url,
          })
          .eq('id', editingLink.id);

        if (error) throw error;

        // Actualizar estado local
        setDeliveryLinks(links => links.map(link => 
          link.id === editingLink.id 
            ? { ...link, platform: platform, url: deliveryForm.url }
            : link
        ));
      } else {
        // Crear nuevo enlace
        const newDisplayOrder = deliveryLinks.length > 0 
          ? Math.max(...deliveryLinks.map(l => l.display_order)) + 1 
          : 0;
          
        const { data, error } = await supabase
          .from('delivery_links')
          .insert({
            restaurant_id: restaurantId,
            platform: platform,
            url: deliveryForm.url,
            display_order: newDisplayOrder,
          })
          .select()
          .single();

        if (error) throw error;

        // Actualizar estado local
        setDeliveryLinks([...deliveryLinks, data as DeliveryLink]);
      }

      setShowDeliveryModal(false);
      setSaveMessage({
        type: "success",
        message: "Enlace de delivery guardado correctamente",
      });
      
      setTimeout(() => {
        setSaveMessage({ type: "", message: "" });
      }, 3000);
    } catch (error: unknown) {
      console.error("Error saving delivery link:", error);
      setSaveMessage({
        type: "error",
        message: `Error al guardar: ${error instanceof Error ? error.message : "Ocurrió un problema"}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const getPlatformInfo = (platform: string, type: 'social' | 'delivery') => {
    if (type === 'social') {
      const found = SOCIAL_PLATFORMS.find(p => p.id === platform);
      return found || { id: platform, name: platform, icon: "globe.svg" };
    } else {
      const found = DELIVERY_PLATFORMS.find(p => p.id === platform);
      if (found) return found;
      return { id: "custom", name: platform, icon: "delivery.svg" };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si no hay restaurante configurado, mostrar mensaje
  if (!restaurantId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">
          Necesitas completar la configuración de tu restaurante
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Antes de configurar tus enlaces, completa la información básica de tu restaurante.
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
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl">
            Enlaces y Redes Sociales
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona tus redes sociales y enlaces de pedidos online.
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

      {/* Sección de Redes Sociales */}
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Redes Sociales
          </h3>
          <button
            type="button"
            onClick={handleAddSocialLink}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir red social
          </button>
        </div>

        {socialLinks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay enlaces de redes sociales</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Añade las redes sociales de tu negocio para que tus clientes te encuentren fácilmente
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleAddSocialLink}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Añadir red social
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {socialLinks.map((link) => {
              const platform = getPlatformInfo(link.platform, 'social');
              return (
                <li key={link.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <Image 
                        src={`/social/${platform.icon}`} 
                        alt={platform.name} 
                        className="h-6 w-6"
                        width={24}
                        height={24}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{platform.name}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 truncate">
                        <a href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:underline" 
                          onClick={(e) => {
                            // Solo detener la propagación, no prevenir el comportamiento predeterminado
                            e.stopPropagation();
                            // No usar window.open ni preventDefault para evitar las recargas
                          }}>
                          {link.url}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditSocialLink(link)}
                      className="inline-flex items-center p-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => link.id && handleDeleteSocialLink(link.id)}
                      className="inline-flex items-center p-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Sección de Enlaces de Delivery */}
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Plataformas de Pedidos Online
          </h3>
          <button
            type="button"
            onClick={handleAddDeliveryLink}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir plataforma de delivery
          </button>
        </div>

        {deliveryLinks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay enlaces de delivery</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Añade enlaces a plataformas donde tus clientes puedan hacer pedidos online
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleAddDeliveryLink}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Añadir plataforma de delivery
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {deliveryLinks.map((link) => {
              const platform = getPlatformInfo(link.platform, 'delivery');
              return (
                <li key={link.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <Image 
                        src={`/delivery/${platform.icon}`} 
                        alt={platform.name} 
                        className="h-6 w-6"
                        width={24}
                        height={24}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/delivery/delivery.svg';
                        }}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {platform.id === "custom" ? link.platform : platform.name}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 truncate">
                        <a href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:underline" 
                          onClick={(e) => {
                            // Solo detener la propagación, no prevenir el comportamiento predeterminado
                            e.stopPropagation();
                            // No usar window.open ni preventDefault para evitar las recargas
                          }}>
                          {link.url}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditDeliveryLink(link)}
                      className="inline-flex items-center p-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => link.id && handleDeleteDeliveryLink(link.id)}
                      className="inline-flex items-center p-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal para redes sociales */}
      {showSocialModal && (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="relative w-full max-w-lg mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    {isEditing ? "Editar red social" : "Añadir red social"}
                  </h3>
                  <div className="mt-2">
                    <form onSubmit={handleSaveSocialLink} className="space-y-4">
                      <div>
                        <label htmlFor="platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
                          Plataforma
                        </label>
                        <select
                          id="platform"
                          required
                          value={socialForm.platform}
                          onChange={(e) => setSocialForm({...socialForm, platform: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Selecciona una plataforma</option>
                          {SOCIAL_PLATFORMS.map((platform) => (
                            <option key={platform.id} value={platform.id}>
                              {platform.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
                          URL del perfil
                        </label>
                        <input
                          type="url"
                          id="url"
                          required
                          value={socialForm.url}
                          onChange={(e) => setSocialForm({...socialForm, url: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          placeholder="https://instagram.com/turestaurante"
                        />
                      </div>
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setShowSocialModal(false)}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 disabled:opacity-50"
                        >
                          {saving ? "Guardando..." : "Guardar"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setShowSocialModal(false)}
              aria-label="Cerrar"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal para delivery */}
      {showDeliveryModal && (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="relative w-full max-w-lg mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    {isEditing ? "Editar plataforma de delivery" : "Añadir plataforma de delivery"}
                  </h3>
                  <div className="mt-2">
                    <form onSubmit={handleSaveDeliveryLink} className="space-y-4">
                      <div>
                        <label htmlFor="delivery-platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
                          Plataforma
                        </label>
                        <select
                          id="delivery-platform"
                          required
                          value={deliveryForm.platform}
                          onChange={(e) => setDeliveryForm({...deliveryForm, platform: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Selecciona una plataforma</option>
                          {DELIVERY_PLATFORMS.map((platform) => (
                            <option key={platform.id} value={platform.id}>
                              {platform.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {deliveryForm.platform === "custom" && (
                        <div>
                          <label htmlFor="custom-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
                            Nombre de la plataforma
                          </label>
                          <input
                            type="text"
                            id="custom-name"
                            required={deliveryForm.platform === "custom"}
                            value={deliveryForm.custom_name}
                            onChange={(e) => setDeliveryForm({...deliveryForm, custom_name: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                            placeholder="Nombre de la plataforma"
                          />
                        </div>
                      )}
                      
                      <div>
                        <label htmlFor="delivery-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
                          URL del perfil o enlace de pedidos
                        </label>
                        <input
                          type="url"
                          id="delivery-url"
                          required
                          value={deliveryForm.url}
                          onChange={(e) => setDeliveryForm({...deliveryForm, url: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          placeholder="https://ubereats.com/restaurant/tu-restaurante"
                        />
                      </div>
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setShowDeliveryModal(false)}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 disabled:opacity-50"
                        >
                          {saving ? "Guardando..." : "Guardar"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setShowDeliveryModal(false)}
              aria-label="Cerrar"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialLinksPage;