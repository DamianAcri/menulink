import React, { useRef } from 'react';
import Image from 'next/image';

interface Step2CustomizationProps {
  formData: {
    coverFile: File | null;
    coverPreview: string | null;
  };
  handleChange: (field: string, value: File | string | null) => void;
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
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-gray-900 dark:text-white">
        Personalización inicial
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Ahora vamos a darle un poco de personalidad visual a tu página.
      </p>

      {/* Imagen de portada */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Imagen de portada
        </label>
        <div className="mt-1">
          {formData.coverPreview ? (
            <div className="relative">
              <Image
                src={formData.coverPreview}
                alt="Cover preview"
                className="h-48 w-full object-cover rounded-md"
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