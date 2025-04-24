"use client";

import { useState, useEffect } from "react";
import { supabase, checkStoragePermissions } from "@/lib/supabase";

// Tipos para las categorías y platos
interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at?: string;
}

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_featured: boolean;
  is_available: boolean;
  display_order: number;
  created_at?: string;
}

export default function MenuPage() {
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Estados para los modales y formularios
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<MenuCategory | null>(null);
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Estados para los formularios
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "0.00",
    is_featured: false,
    is_available: true,
    image_url: "",
  });
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [diagnosticResult, setDiagnosticResult] = useState<string>("");
  const [showDiagnostic, setShowDiagnostic] = useState<boolean>(false);

  // Cargar datos del restaurante y menú al iniciar
  useEffect(() => {
    const fetchRestaurantData = async () => {
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
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (restaurantError || !restaurant) {
          console.error("Error fetching restaurant:", restaurantError);
          setLoading(false);
          return;
        }

        setRestaurantId(restaurant.id);

        // Cargar categorías del menú
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('display_order', { ascending: true });

        if (categoriesError) {
          console.error("Error fetching categories:", categoriesError);
        } else {
          setCategories(categoriesData || []);
          
          // Establecer la primera categoría como activa si hay alguna
          if (categoriesData && categoriesData.length > 0) {
            setActiveCategory(categoriesData[0].id);
            
            // Cargar los elementos del menú para todas las categorías
            const { data: menuItemsData, error: menuItemsError } = await supabase
              .from('menu_items')
              .select('*')
              .in('category_id', categoriesData.map(cat => cat.id))
              .order('display_order', { ascending: true });
              
            if (menuItemsError) {
              console.error("Error fetching menu items:", menuItemsError);
            } else {
              setMenuItems(menuItemsData || []);
            }
          }
        }
      } catch (error) {
        console.error("Error in menu page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, []);

  // Filtrar elementos del menú por categoría activa
  const filteredItems = activeCategory 
    ? menuItems.filter(item => item.category_id === activeCategory)
    : [];

  // Manejadores para categorías
  const handleAddCategory = () => {
    setIsEditing(false);
    setCurrentCategory(null);
    setCategoryForm({ name: "", description: "" });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: MenuCategory) => {
    setIsEditing(true);
    setCurrentCategory(category);
    setCategoryForm({ 
      name: category.name,
      description: category.description || "",
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta categoría? Todos los platos asociados también se eliminarán.")) {
      return;
    }

    setProcessingAction(true);
    
    try {
      // Primero eliminar todos los platos asociados a la categoría
      const { error: deleteItemsError } = await supabase
        .from('menu_items')
        .delete()
        .eq('category_id', categoryId);
      
      if (deleteItemsError) {
        throw deleteItemsError;
      }
      
      // Luego eliminar la categoría
      const { error: deleteCategoryError } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', categoryId);
        
      if (deleteCategoryError) {
        throw deleteCategoryError;
      }
      
      // Actualizar el estado local
      setCategories(categories.filter(cat => cat.id !== categoryId));
      setMenuItems(menuItems.filter(item => item.category_id !== categoryId));
      
      // Si la categoría eliminada era la activa, seleccionar otra
      if (activeCategory === categoryId) {
        const remainingCategories = categories.filter(cat => cat.id !== categoryId);
        setActiveCategory(remainingCategories.length > 0 ? remainingCategories[0].id : null);
      }
      
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Error al eliminar la categoría. Por favor, inténtalo de nuevo.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurantId) {
      alert("No se encontró información del restaurante");
      return;
    }
    
    setProcessingAction(true);
    
    try {
      if (isEditing && currentCategory) {
        // Actualizar categoría existente
        const { error } = await supabase
          .from('menu_categories')
          .update({
            name: categoryForm.name,
            description: categoryForm.description || null,
          })
          .eq('id', currentCategory.id);
          
        if (error) throw error;
        
        // Actualizar estado local
        setCategories(categories.map(cat => 
          cat.id === currentCategory.id 
            ? { ...cat, name: categoryForm.name, description: categoryForm.description || null }
            : cat
        ));
      } else {
        // Crear nueva categoría
        const newDisplayOrder = categories.length > 0 
          ? Math.max(...categories.map(c => c.display_order)) + 1 
          : 0;
          
        const { data, error } = await supabase
          .from('menu_categories')
          .insert({
            restaurant_id: restaurantId,
            name: categoryForm.name,
            description: categoryForm.description || null,
            display_order: newDisplayOrder,
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Actualizar estado local
        const newCategory = data as MenuCategory;
        setCategories([...categories, newCategory]);
        
        // Si es la primera categoría, establecerla como activa
        if (categories.length === 0) {
          setActiveCategory(newCategory.id);
        }
      }
      
      setShowCategoryModal(false);
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Error al guardar la categoría. Por favor, inténtalo de nuevo.");
    } finally {
      setProcessingAction(false);
    }
  };

  // Manejadores para platos del menú
  const handleAddItem = () => {
    if (!activeCategory) {
      alert("Por favor, selecciona o crea una categoría primero");
      return;
    }
    
    setIsEditing(false);
    setCurrentItem(null);
    setItemForm({
      name: "",
      description: "",
      price: "0.00",
      is_featured: false,
      is_available: true,
      image_url: "",
    });
    setItemImage(null);
    setImagePreview(null);
    setShowItemModal(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setIsEditing(true);
    setCurrentItem(item);
    setItemForm({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      is_featured: item.is_featured,
      is_available: item.is_available,
      image_url: item.image_url || "",
    });
    setItemImage(null);
    setImagePreview(item.image_url);
    setShowItemModal(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este plato?")) {
      return;
    }

    setProcessingAction(true);
    
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);
        
      if (error) throw error;
      
      // Actualizar estado local
      setMenuItems(menuItems.filter(item => item.id !== itemId));
      
    } catch (error) {
      console.error("Error deleting menu item:", error);
      alert("Error al eliminar el plato. Por favor, inténtalo de nuevo.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setItemImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadItemImage = async (file: File, itemId: string): Promise<string> => {
    if (!restaurantId) throw new Error("No se encontró información del restaurante");
    
    // Verificar la sesión de usuario antes de subir
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Estado de sesión:', session ? 'Autenticado' : 'No autenticado');
    console.log('ID de usuario:', session?.user?.id);
    console.log('ID de restaurante:', restaurantId);
    console.log('ID de item:', itemId);
    
    // Verificar el archivo
    console.log('Subiendo archivo:', { 
      nombre: file.name, 
      tamaño: `${(file.size / 1024).toFixed(2)} KB`,
      tipo: file.type 
    });
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `restaurants/${restaurantId}/menu/${itemId}/${fileName}`;
    
    console.log('Ruta destino:', filePath);
    console.log('Bucket:', 'menulink');
    
    try {
      // Intentar la subida con upsert explícito y opciones adicionales
      const { data, error: uploadError } = await supabase.storage
        .from('menulink')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600',
          contentType: file.type // Aseguramos que el content type sea correcto
        });
      
      if (uploadError) {
        console.error('Error completo al subir imagen:', uploadError);
        console.error('Mensaje:', uploadError.message);
        console.error('Información adicional:', JSON.stringify(uploadError));
        console.error('Nombre:', uploadError.name);
        throw uploadError;
      }
      
      console.log('Subida exitosa:', data);
      
      const { data: { publicUrl } } = supabase.storage
        .from('menulink')
        .getPublicUrl(filePath);
      
      console.log('URL pública generada:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Error en uploadItemImage:', error);
      throw error;
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeCategory || !restaurantId) {
      alert("No se encontró información de la categoría o restaurante");
      return;
    }
    
    setProcessingAction(true);
    
    try {
      let imageUrl = itemForm.image_url;
      let newItemId = null;
      let newItem = null;
      
      if (isEditing && currentItem) {
        // Si se está editando, primero sube la imagen (si hay) y luego actualiza
        if (itemImage) {
          const fileExt = itemImage.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `restaurants/${restaurantId}/menu/${currentItem.id}/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from('menulink')
            .upload(filePath, itemImage, { upsert: true });
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('menulink').getPublicUrl(filePath);
          imageUrl = data.publicUrl;
        }
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: itemForm.name,
            description: itemForm.description || null,
            price: parseFloat(itemForm.price),
            is_featured: itemForm.is_featured,
            is_available: itemForm.is_available,
            image_url: imageUrl,
          })
          .eq('id', currentItem.id);
        if (error) throw error;
        setMenuItems(menuItems.map(item => 
          item.id === currentItem.id 
            ? {
                ...item,
                name: itemForm.name,
                description: itemForm.description || null,
                price: parseFloat(itemForm.price),
                is_featured: itemForm.is_featured,
                is_available: itemForm.is_available,
                image_url: imageUrl,
              }
            : item
        ));
      } else {
        // 1. Insertar el plato sin imagen
        const newDisplayOrder = menuItems.filter(i => i.category_id === activeCategory).length > 0
          ? Math.max(...menuItems.filter(i => i.category_id === activeCategory).map(i => i.display_order)) + 1
          : 0;
        const { data, error } = await supabase
          .from('menu_items')
          .insert({
            category_id: activeCategory,
            name: itemForm.name,
            description: itemForm.description || null,
            price: parseFloat(itemForm.price),
            is_featured: itemForm.is_featured,
            is_available: itemForm.is_available,
            image_url: null,
            display_order: newDisplayOrder,
          })
          .select()
          .single();
        if (error) throw error;
        newItem = data as MenuItem;
        newItemId = newItem.id;
        // 2. Subir la imagen usando el ID real
        if (itemImage) {
          const fileExt = itemImage.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `restaurants/${restaurantId}/menu/${newItemId}/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from('menulink')
            .upload(filePath, itemImage, { upsert: true });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from('menulink').getPublicUrl(filePath);
          imageUrl = urlData.publicUrl;
          // 3. Actualizar el registro con la URL de la imagen
          const { error: updateError } = await supabase
            .from('menu_items')
            .update({ image_url: imageUrl })
            .eq('id', newItemId);
          if (updateError) throw updateError;
          newItem.image_url = imageUrl;
        }
        setMenuItems([...menuItems, newItem]);
      }
      setShowItemModal(false);
    } catch (error) {
      console.error("Error saving menu item:", error);
      alert("Error al guardar el plato. Por favor, inténtalo de nuevo.");
    } finally {
      setProcessingAction(false);
    }
  };

  // Función para ejecutar diagnóstico de permisos
  const runDiagnostic = async () => {
    setDiagnosticResult("Ejecutando diagnóstico...");
    setShowDiagnostic(true);
    
    try {
      // Verificar permisos de almacenamiento
      const permissionsResult = await checkStoragePermissions();
      
      // Verificar política RLS para el bucket
      const { data: bucketPermission, error: bucketError } = await supabase.rpc(
        'check_bucket_permissions',
        { bucket_name: 'menulink' }
      );
      
      // Compilar resultados
      const results = {
        storage: permissionsResult,
        sessionInfo: (await supabase.auth.getSession()).data,
        bucket: bucketError ? { error: bucketError.message } : bucketPermission
      };
      
      setDiagnosticResult(JSON.stringify(results, null, 2));
    } catch (error) {
      console.error("Error durante el diagnóstico:", error);
      setDiagnosticResult(`Error durante el diagnóstico: ${JSON.stringify(error)}`);
    }
  };

  // Renderizado condicional para carga
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
          Antes de crear tu menú, completa la información básica de tu restaurante.
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
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl">
            Gestión del Menú
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administra las categorías y platos de tu menú.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={processingAction}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay categorías</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comienza creando una categoría para tu menú
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={processingAction}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Categoría
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row">
            {/* Sidebar de categorías */}
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-700 p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Categorías</h3>
              </div>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <div 
                    key={category.id} 
                    className={`flex justify-between items-center px-3 py-2 rounded-md cursor-pointer ${
                      activeCategory === category.id 
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div 
                      className="flex-grow"
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditCategory(category)}
                        disabled={processingAction}
                        className="p-1 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={processingAction}
                        className="p-1 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-500 disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Contenido de platos */}
            <div className="flex-1 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {activeCategory ? categories.find(c => c.id === activeCategory)?.name : "Platos"}
                </h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={processingAction || !activeCategory}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg className="-ml-1 mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Añadir Plato
                </button>
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay platos en esta categoría</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Comienza añadiendo platos a esta categoría
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={processingAction}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Añadir Plato
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                  {filteredItems.map((item) => (
                    <li 
                      key={item.id} 
                      className="col-span-1 bg-white dark:bg-gray-700 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-600"
                    >
                      <div className="w-full flex items-center justify-between p-4">
                        <div className="flex-1 truncate">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-gray-900 dark:text-white text-sm font-medium truncate">{item.name}</h3>
                            {item.is_featured && (
                              <span className="flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                Destacado
                              </span>
                            )}
                            {!item.is_available && (
                              <span className="flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                No disponible
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-gray-500 dark:text-gray-400 text-xs truncate">
                            {item.description || "Sin descripción"}
                          </p>
                          <p className="mt-1 text-gray-900 dark:text-white font-semibold">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        {item.image_url ? (
                          <img 
                            className="w-16 h-16 bg-gray-300 rounded-md object-cover" 
                            src={item.image_url} 
                            alt={item.name}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-md flex items-center justify-center">
                            <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="-mt-px flex divide-x divide-gray-200 dark:divide-gray-600">
                        <div className="w-0 flex-1 flex">
                          <button
                            onClick={() => handleEditItem(item)}
                            disabled={processingAction}
                            className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-2 text-sm text-gray-700 dark:text-gray-200 font-medium border border-transparent rounded-bl-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                          >
                            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="ml-2">Editar</span>
                          </button>
                        </div>
                        <div className="-ml-px w-0 flex-1 flex">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={processingAction}
                            className="relative w-0 flex-1 inline-flex items-center justify-center py-2 text-sm text-gray-700 dark:text-gray-200 font-medium border border-transparent rounded-br-lg hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-red-500 disabled:opacity-50"
                          >
                            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="ml-2">Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal para categorías */}
      {showCategoryModal && (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-40" onClick={() => { if (!processingAction) setShowCategoryModal(false); }}>
          <div
            className="bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-60"
            style={{ minWidth: 320, maxWidth: 400 }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  {isEditing ? "Editar Categoría" : "Nueva Categoría"}
                </h3>
                <div className="mt-2">
                  <form 
                    onSubmit={e => { e.preventDefault(); handleSaveCategory(e); }} 
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
                        Nombre
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={categoryForm.name}
                        onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="Ej: Entrantes, Platos principales, Postres"
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
                        Descripción (opcional)
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={categoryForm.description}
                        onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="Descripción breve de la categoría"
                      />
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => { if (!processingAction) setShowCategoryModal(false); }}
                        disabled={processingAction}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={processingAction}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 disabled:opacity-50"
                      >
                        {processingAction ? (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : null}
                        Guardar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para platos */}
      {showItemModal && (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-40" onClick={() => { if (!processingAction) setShowItemModal(false); }}>
          <div
            className="bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-60"
            style={{ minWidth: 320, maxWidth: 400, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  {isEditing ? "Editar Plato" : "Nuevo Plato"}
                </h3>
                <div className="mt-2">
                  <form onSubmit={handleSaveItem} className="space-y-4">
                    <div className="flex justify-center">
                      <div className="w-32 h-32 relative">
                        {imagePreview ? (
                          <div className="relative h-full">
                            <img 
                              src={imagePreview || ""}
                              alt="Preview" 
                              className="w-full h-full object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null);
                                setItemImage(null);
                                setItemForm({...itemForm, image_url: ""});
                              }}
                              className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm"
                            >
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => document.getElementById("item-image")?.click()}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center h-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <input
                        id="item-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                    {/* ...resto del formulario igual que antes... */}
                    <div className="text-left">
                      <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="item-name"
                        required
                        value={itemForm.name}
                        onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="Ej: Paella, Pizza Margarita"
                      />
                    </div>
                    <div className="text-left">
                      <label htmlFor="item-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Descripción (opcional)
                      </label>
                      <textarea
                        id="item-description"
                        rows={2}
                        value={itemForm.description}
                        onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="Ingredientes o descripción del plato"
                      />
                    </div>
                    <div className="text-left">
                      <label htmlFor="item-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Precio
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="item-price"
                          step="0.01"
                          min="0"
                          required
                          value={itemForm.price}
                          onChange={(e) => setItemForm({...itemForm, price: e.target.value})}
                          className="block w-full pl-7 pr-12 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 text-left">
                      <div className="flex items-center">
                        <input
                          id="is_featured"
                          name="is_featured"
                          type="checkbox"
                          checked={itemForm.is_featured}
                          onChange={(e) => setItemForm({...itemForm, is_featured: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Destacar este plato
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="is_available"
                          name="is_available"
                          type="checkbox"
                          checked={itemForm.is_available}
                          onChange={(e) => setItemForm({...itemForm, is_available: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Disponible
                        </label>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => { if (!processingAction) setShowItemModal(false); }}
                        disabled={processingAction}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={processingAction}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 disabled:opacity-50"
                      >
                        {processingAction ? (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : null}
                        Guardar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}