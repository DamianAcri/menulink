import React, { useRef, useState } from 'react';
import Image from 'next/image';

interface Step2CustomizationProps {
  formData: {
    coverFile: File | null;
    coverPreview: string | null;
    templateType?: string;
    reservationMode: string;
    maxPartySize?: number;
    defaultTimeSlots?: boolean;
  };
  handleChange: (field: string, value: File | string | number | boolean | null) => void;
}

const Step2Customization: React.FC<Step2CustomizationProps> = ({ formData, handleChange }) => {
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleChange('coverFile', file);
      
      // Crear URL para previsualización
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleChange('coverPreview', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">
          Personalización inicial
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ahora vamos a darle un poco de personalidad visual a tu página.
        </p>
      </div>

      {/* Selección de plantilla */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Diseño de la página
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Elige el diseño que mejor se adapte al estilo de tu restaurante
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plantilla Tradicional */}
          <div 
            className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              formData.templateType === 'traditional' ? 'ring-2 ring-blue-500' : 'hover:border-gray-400'
            }`}
            onClick={() => handleChange('templateType', 'traditional')}
          >
            <div className="aspect-video w-full relative">
              <Image 
                src="/templates/traditional.jpg" 
                alt="Diseño tradicional" 
                width={300}
                height={200}
                layout="responsive"
                objectFit="cover"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  checked={formData.templateType === 'traditional'}
                  onChange={() => handleChange('templateType', 'traditional')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tradicional
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Ideal para restaurantes clásicos y familiares
              </p>
            </div>
          </div>
          
          {/* Plantilla Minimalista */}
          <div 
            className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              formData.templateType === 'minimalist' ? 'ring-2 ring-blue-500' : 'hover:border-gray-400'
            }`}
            onClick={() => handleChange('templateType', 'minimalist')}
          >
            <div className="aspect-video w-full relative">
              <Image 
                src="/templates/minimalist.jpg" 
                alt="Diseño minimalista" 
                width={300}
                height={200}
                layout="responsive"
                objectFit="cover"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  checked={formData.templateType === 'minimalist'}
                  onChange={() => handleChange('templateType', 'minimalist')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Minimalista
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Perfecto para cafés modernos y bares
              </p>
            </div>
          </div>
          
          {/* Plantilla Visual/Elegante */}
          <div 
            className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              formData.templateType === 'visual' ? 'ring-2 ring-blue-500' : 'hover:border-gray-400'
            }`}
            onClick={() => handleChange('templateType', 'visual')}
          >
            <div className="aspect-video w-full relative">
              <Image 
                src="/templates/visual.jpg" 
                alt="Diseño visual" 
                width={300}
                height={200}
                layout="responsive"
                objectFit="cover"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  checked={formData.templateType === 'visual'}
                  onChange={() => handleChange('templateType', 'visual')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Visual
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Ideal para restaurantes gourmet y de autor
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Formulario de reservas */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sistema de Reservas
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          ¿Deseas incluir un formulario de reservas en tu página?
        </p>
        
        <div className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="reservation-enabled"
                name="reservation-mode"
                type="radio"
                checked={formData.reservationMode === 'form'}
                onChange={() => handleChange('reservationMode', 'form')}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="reservation-enabled" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sí, incluir formulario de reservas
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="reservation-disabled"
                name="reservation-mode"
                type="radio"
                checked={formData.reservationMode === 'disabled'}
                onChange={() => handleChange('reservationMode', 'disabled')}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="reservation-disabled" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                No, no incluir formulario de reservas
              </label>
            </div>
          </div>
          
          {formData.reservationMode === 'form' && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-3">
                Configuración inicial del sistema de reservas
              </h4>
              
              <div className="mb-4">
                <label htmlFor="max-party-size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tamaño máximo de grupo que aceptas
                </label>
                <div className="flex items-center">
                  <select
                    id="max-party-size"
                    value={formData.maxPartySize || 10}
                    onChange={(e) => handleChange('maxPartySize', parseInt(e.target.value))}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-24 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {[...Array(20)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} personas</option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Este es el número máximo de personas por reserva que podrán seleccionar los clientes
                </p>
              </div>

              <div className="mt-4">
                <div className="flex items-center">
                  <input
                    id="default-slots"
                    name="default-slots"
                    type="checkbox"
                    checked={formData.defaultTimeSlots !== false}
                    onChange={(e) => handleChange('defaultTimeSlots', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="default-slots" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Crear horarios de reserva predeterminados
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">
                  Crearemos automáticamente franjas horarias comunes para reservas (13:00-15:30 y 20:00-23:00)
                  que podrás personalizar más tarde en tu dashboard.
                </p>
              </div>
              
              <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Podrás configurar los horarios específicos para cada día de la semana, capacidad por horario 
                  y otros ajustes en la sección de Configuración después de completar el registro.
                </p>
              </div>
            </div>
          )}
          
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Podrás cambiar esta configuración más tarde desde la sección de Configuración en tu Dashboard.
          </p>
        </div>
      </div>

      {/* Imagen de portada */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Imagen de portada
        </label>
        <div className="mt-1">
          {formData.coverPreview ? (
            <div className="relative w-full h-48">
              <Image
                src={formData.coverPreview}
                alt="Cover preview"
                className="object-cover rounded-md"
                layout="fill"
              />
              <button
                type="button"
                onClick={() => {
                  handleChange('coverPreview', null);
                  handleChange('coverFile', null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div
              onClick={() => coverInputRef.current?.click()}
              className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <span className="relative rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none">
                    Sube una imagen de portada
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, GIF hasta 10MB
                </p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverChange}
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Recomendado: imagen panorámica de 1200x400 píxeles.
        </p>
      </div>

      {/* Consejos de personalización */}
      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 000-2H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Consejos para una buena imagen de portada
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-200 space-y-1">
              <p>
                • Elige una imagen de alta calidad de tu restaurante o tus platos más destacados.
              </p>
              <p>
                • Evita imágenes con mucho texto.
              </p>
              <p>
                • Asegúrate de que la imagen refleje la identidad de tu restaurante.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2Customization;