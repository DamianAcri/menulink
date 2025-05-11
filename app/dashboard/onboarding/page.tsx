"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Step1BasicInfo from "./components/Step1BasicInfo";
import Step2Customization from "./components/Step2Customization";
import Step3FirstContent from "./components/Step3FirstContent";
import PreviewComplete from "./components/PreviewComplete";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

function LanguageModal({ open, onSelect }: { open: boolean; onSelect: (lang: string) => void }) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-xs w-full text-center">
        <h2 className="text-lg font-bold mb-4">{t('seleccionar_idioma')}</h2>
        <div className="flex justify-center gap-4 mb-4">
          <button onClick={() => onSelect('es')} className="focus:outline-none">
            <span role="img" aria-label="Español" className="text-3xl">🇪🇸</span>
            <div className="text-xs mt-1">{t('espanol')}</div>
          </button>
          <button onClick={() => onSelect('en')} className="focus:outline-none">
            <span role="img" aria-label="English" className="text-3xl">🇬🇧</span>
            <div className="text-xs mt-1">{t('ingles')}</div>
          </button>
          <button onClick={() => onSelect('fr')} className="focus:outline-none">
            <span role="img" aria-label="Français" className="text-3xl">🇫🇷</span>
            <div className="text-xs mt-1">{t('frances')}</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Paso 1: Info básica
    restaurantName: "",
    restaurantType: "",
    logoFile: null as File | null,
    logoPreview: null as string | null,
    
    // Paso 2: Personalización
    coverFile: null as File | null,
    coverPreview: null as string | null,
    templateType: "traditional" as string, // Default template is traditional
    reservationMode: "form" as string, // Default: mostrar formulario de reservas
    maxPartySize: 10, // Tamaño máximo de grupo por defecto
    defaultTimeSlots: true, // Crear horarios de reserva predeterminados por defecto
    
    // Paso 3: Primeros contenidos
    menuItems: [
      { name: "", price: "", description: "", allergens: "" }
    ],
    openingHours: {
      monday: { isOpen: false, opensAt: "09:00", closesAt: "18:00" },
      tuesday: { isOpen: false, opensAt: "09:00", closesAt: "18:00" },
      wednesday: { isOpen: false, opensAt: "09:00", closesAt: "18:00" },
      thursday: { isOpen: false, opensAt: "09:00", closesAt: "18:00" },
      friday: { isOpen: false, opensAt: "09:00", closesAt: "18:00" },
      saturday: { isOpen: false, opensAt: "09:00", closesAt: "18:00" },
      sunday: { isOpen: false, opensAt: "09:00", closesAt: "18:00" }
    },
    // Campos generales
    slug: "",
    restaurantId: null as string | null
  });

  const [user, setUser] = useState<unknown>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLangModal, setShowLangModal] = useState(false);
  const { t } = useTranslation();
  const [language, setLanguage] = useState('en');
  const [enableLanguageSelector, setEnableLanguageSelector] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang');
    if (!savedLang) {
      const navLang = navigator.language.slice(0, 2);
      if (["es", "en", "fr"].includes(navLang)) {
        setShowLangModal(true);
      } else {
        i18n.changeLanguage('es');
        localStorage.setItem('lang', 'es');
      }
    } else {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  const handleSelectLang = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
    setShowLangModal(false);
  };

  // Cuando se cambia el nombre del restaurante, generar automáticamente un slug
  useEffect(() => {
    if (formData.restaurantName) {
      const generatedSlug = formData.restaurantName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");
      
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug
      }));
    }
  }, [formData.restaurantName]);

  // Función para manejar los cambios en los datos del formulario
  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para navegar al siguiente paso
  const nextStep = () => {
    // Validar datos según el paso actual
    const validationErrors = validateStep(currentStep);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Si es el paso 3, enviar datos
    if (currentStep === 3) {
      completeOnboarding();
      return;
    }
    
    // Avanzar al siguiente paso
    setErrors({});
    setCurrentStep(prev => prev + 1);
  };

  // Función para navegar al paso anterior
  const prevStep = () => {
    // Si estamos en el último paso (vista previa), volver al paso 3
    if (currentStep === 4) {
      setCurrentStep(3);
      return;
    }
    
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Validaciones según el paso
  const validateStep = (step: number): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    switch(step) {
      case 1:
        if (!formData.restaurantName?.trim()) {
          errors.restaurantName = "El nombre del restaurante es obligatorio";
        }
        if (!formData.restaurantType?.trim()) {
          errors.restaurantType = "El tipo de cocina es obligatorio";
        }
        break;
      case 2:
        if (!formData.templateType) {
          errors.templateType = "Debes seleccionar un diseño para tu página";
        }
        // La imagen de portada no es obligatoria
        break;
      case 3:
        // Validar al menos un plato con nombre y precio
        if (!formData.menuItems[0]?.name?.trim()) {
          errors.menuItemName = "Debes agregar al menos un plato con nombre";
        }
        if (!formData.menuItems[0]?.price) {
          errors.menuItemPrice = "Debes agregar al menos un plato con precio";
        }
        
        // Al menos un día de horario de apertura
        const hasAnyOpenDay = Object.values(formData.openingHours).some(day => day.isOpen);
        if (!hasAnyOpenDay) {
          errors.openingHours = "Debes indicar al menos un día de apertura";
        }
        break;
    }
    
    return errors;
  };

  // Función para cargar imágenes a Supabase Storage
  const uploadImage = async (file: File, path: string) => {
    if (!file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('menulink')
      .upload(filePath, file, { 
        upsert: true,
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('menulink')
      .getPublicUrl(filePath);
    
    return publicUrl;
  };

  // Función para crear time slots de reserva predeterminados
  const createDefaultReservationTimeSlots = async (restaurantId: string) => {
    // Definir franjas horarias predeterminadas para comida y cena
    const defaultSlots = [
      // Comida (13:00 - 15:30)
      { startTime: '13:00', endTime: '14:30', maxReservations: 4 },
      { startTime: '14:00', endTime: '15:30', maxReservations: 4 },
      // Cena (20:00 - 23:00)
      { startTime: '20:00', endTime: '21:30', maxReservations: 4 },
      { startTime: '21:00', endTime: '22:30', maxReservations: 4 },
      { startTime: '22:00', endTime: '23:30', maxReservations: 4 },
    ];
    
    // Crear slots para cada día de la semana que tenga horarios abiertos
    interface TimeSlot {
      restaurant_id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      max_reservations: number;
      max_party_size: number;
      is_active: boolean;
    }
    
    const timeSlotsToInsert: TimeSlot[] = [];
    
    // Mapear los días de la semana a números (0-6, donde 0 es domingo)
    const daysOfWeekMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };
    
    // Solo crear slots para los días que el restaurante esté abierto
    for (const [day, hours] of Object.entries(formData.openingHours)) {
      if (hours.isOpen) {
        const dayOfWeek = daysOfWeekMap[day as keyof typeof daysOfWeekMap];
        
        // Añadir los slots predeterminados para este día
        defaultSlots.forEach(slot => {
          timeSlotsToInsert.push({
            restaurant_id: restaurantId,
            day_of_week: dayOfWeek,
            start_time: slot.startTime,
            end_time: slot.endTime,
            max_reservations: slot.maxReservations,
            max_party_size: formData.maxPartySize || 10, // Valor por defecto de 10 si no se proporciona
            is_active: true
          });
        });
      }
    }
    
    // Si no hay días abiertos configurados, crear slots para los días laborables comunes
    if (timeSlotsToInsert.length === 0) {
      // Lunes a sábado (1-6), excluyendo domingo (0)
      [1, 2, 3, 4, 5, 6].forEach(dayOfWeek => {
        defaultSlots.forEach(slot => {
          timeSlotsToInsert.push({
            restaurant_id: restaurantId,
            day_of_week: dayOfWeek,
            start_time: slot.startTime,
            end_time: slot.endTime,
            max_reservations: slot.maxReservations,
            max_party_size: formData.maxPartySize || 10,
            is_active: true
          });
        });
      });
    }
    
    // Insertar todos los time slots
    if (timeSlotsToInsert.length > 0) {
      const { error } = await supabase
        .from('reservation_time_slots')
        .insert(timeSlotsToInsert);
      
      if (error) {
        console.error('Error al crear slots de reserva predeterminados:', error);
        throw error;
      }
    }
  };

  // Función para completar el onboarding y guardar los datos
  const completeOnboarding = async () => {
    setLoading(true);
    
    try {
      // 1. Crear el restaurante
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .insert([
          {
            user_id: (user && typeof user === 'object' && 'id' in user) ? (user as { id: string }).id : null,
            name: formData.restaurantName,
            slug: formData.slug,
            restaurant_type: formData.restaurantType,
            theme_color: 'var(--accent)', // Color de acento
            secondary_color: 'var(--accent-hover)',
            font_family: 'Inter, sans-serif',
            subscription_tier: 'free',
            reservation_mode: formData.reservationMode, // Guardar la configuración del formulario de reservas
            theme_type: convertTemplateTypeToNumber(formData.templateType), // Guardar el tipo de plantilla como número
            language: language,
            enable_language_selector: enableLanguageSelector
          }
        ])
        .select()
        .single();
      
      if (restaurantError) throw restaurantError;
      
      // Guardar el ID del restaurante
      const restaurantId = restaurantData.id;
      setFormData(prev => ({ ...prev, restaurantId }));
      
      // 2. Subir imágenes si existen
      let logoUrl = null;
      let coverUrl = null;
      
      if (formData.logoFile) {
        logoUrl = await uploadImage(formData.logoFile, `restaurants/${restaurantId}/logo`);
      }
      
      if (formData.coverFile) {
        coverUrl = await uploadImage(formData.coverFile, `restaurants/${restaurantId}/cover`);
      }
      
      // Actualizar restaurante con las URLs de las imágenes
      if (logoUrl || coverUrl) {
        await supabase
          .from('restaurants')
          .update({
            logo_url: logoUrl,
            cover_image_url: coverUrl
          })
          .eq('id', restaurantId);
      }
      
      // 3. Crear categoría de menú por defecto
      const { data: categoryData, error: categoryError } = await supabase
        .from('menu_categories')
        .insert([
          {
            restaurant_id: restaurantId,
            name: 'Principales',
            description: 'Platos principales',
            display_order: 1
          }
        ])
        .select()
        .single();
      
      if (categoryError) throw categoryError;
      
      const categoryId = categoryData.id;
      
      // 4. Crear elementos del menú
      const menuItemsToInsert = formData.menuItems
        .filter(item => item.name.trim() && item.price)
        .map((item, index) => ({
          category_id: categoryId,
          name: item.name.trim(),
          price: parseFloat(item.price.toString()),
          description: item.description || null,
          display_order: index + 1,
          is_available: true,
          allergens: item.allergens ? item.allergens.split(',').map((a: string) => a.trim()).filter(Boolean) : null
        }));
      
      if (menuItemsToInsert.length > 0) {
        await supabase
          .from('menu_items')
          .insert(menuItemsToInsert);
      }
      
      // 5. Crear horarios de apertura
      const daysOfWeek = {
        monday: 1, tuesday: 2, wednesday: 3, thursday: 4, 
        friday: 5, saturday: 6, sunday: 0
      };
      
      const openingHoursToInsert = Object.entries(formData.openingHours)
        .map(([day, hours]) => ({
          restaurant_id: restaurantId,
          day_of_week: daysOfWeek[day as keyof typeof daysOfWeek],
          is_closed: !hours.isOpen,
          opens_at: hours.isOpen ? hours.opensAt : null,
          closes_at: hours.isOpen ? hours.closesAt : null
        }));
      
      await supabase
        .from('opening_hours')
        .insert(openingHoursToInsert);
      
      // 6. Si el formulario de reservas está habilitado y se solicitan time slots predeterminados, crearlos
      if (formData.reservationMode === 'form' && formData.defaultTimeSlots) {
        await createDefaultReservationTimeSlots(restaurantId);
      }
      
      // 7. Marcar al usuario como no nuevo (quitar la bandera is_new_user)
      await supabase.auth.updateUser({
        data: {
          is_new_user: false
        }
      });
      
      // 8. Mover a la pantalla de vista previa
      setCurrentStep(4);
    } catch (error) {
      console.error('Error en onboarding:', error);
      alert('Ha ocurrido un error al guardar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para convertir el tipo de plantilla a número 
  // (1 = traditional, 2 = minimalist, 3 = visual)
  const convertTemplateTypeToNumber = (templateType: string): number => {
    switch (templateType) {
      case 'minimalist': return 2;
      case 'visual': return 3;
      default: return 1; // 'traditional' por defecto
    }
  };

  // Función para terminar el onboarding y redirigir al dashboard
  const finishOnboarding = () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <LanguageModal open={showLangModal} onSelect={handleSelectLang} />
      {/* Header con pasos de progreso */}
      {currentStep < 4 && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-center text-gray-900">
            Configura tu restaurante en MenuLink
          </h1>
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-center gap-4">
            <div>
              <label htmlFor="language" className="block text-md font-medium text-gray-900">Idioma del dashboard</label>
              <select
                id="language"
                name="language"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Este idioma se usará en todo el panel de administración y, si no activas el selector público, también en la web pública.
              </p>
            </div>
            <div className="flex items-center mt-2 md:mt-0">
              <input
                id="enable-language-selector"
                name="enable-language-selector"
                type="checkbox"
                checked={enableLanguageSelector}
                onChange={e => setEnableLanguageSelector(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enable-language-selector" className="ml-2 block text-sm text-gray-900">
                Permitir a los clientes elegir idioma en la web pública
              </label>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Si activas esta opción, aparecerá un pequeño selector de idioma en la web pública (abajo a la izquierda). Si no, la web pública usará el idioma del dashboard.
          </p>
          <div className="mt-8">
            <nav aria-label="Progress">
              <ol className="flex items-center justify-between">
                <li className={`relative ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                  <div className="flex items-center">
                    <span className={`h-9 w-9 rounded-full border-2 ${currentStep >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'} flex items-center justify-center`}>
                      1
                    </span>
                    <span className="ml-2 text-sm font-medium">Información básica</span>
                  </div>
                </li>
                
                <div className="hidden sm:block w-16 bg-gray-200 h-0.5"></div>
                
                <li className={`relative ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
                  <div className="flex items-center">
                    <span className={`h-9 w-9 rounded-full border-2 ${currentStep >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'} flex items-center justify-center`}>
                      2
                    </span>
                    <span className="ml-2 text-sm font-medium">Personalización</span>
                  </div>
                </li>
                
                <div className="hidden sm:block w-16 bg-gray-200 h-0.5"></div>
                
                <li className={`relative ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>
                  <div className="flex items-center">
                    <span className={`h-9 w-9 rounded-full border-2 ${currentStep >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'} flex items-center justify-center`}>
                      3
                    </span>
                    <span className="ml-2 text-sm font-medium">Contenido inicial</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
        </div>
      )}

      {/* Contenido del paso actual */}
      <div className="bg-white shadow rounded-lg p-6">
        {currentStep === 1 && (
          <Step1BasicInfo 
            formData={formData} 
            handleChange={handleChange} 
            errors={errors}
          />
        )}
        
        {currentStep === 2 && (
          <Step2Customization 
            formData={formData} 
            handleChange={handleChange}
          />
        )}
        
        {currentStep === 3 && (
          <Step3FirstContent 
            formData={formData} 
            handleChange={handleChange}
            errors={errors}
          />
        )}
        
        {currentStep === 4 && (
          <PreviewComplete 
            restaurantSlug={formData.slug}
            finishOnboarding={finishOnboarding}
          />
        )}

        {/* Botones de navegación */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              className={`px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentStep === 1 ? 'invisible' : ''}`}
            >
              Atrás
            </button>
            
            <button
              type="button"
              onClick={nextStep}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : currentStep < 3 ? (
                'Siguiente'
              ) : (
                'Completar'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}