import React, { useRef } from 'react';
import Image from 'next/image';

interface Step1BasicInfoProps {
  formData: {
    restaurantName: string;
    restaurantType: string;
    logoFile: File | null;
    logoPreview: string | null;
  };
  handleChange: (field: string, value: string | File | null) => void;
  errors: Record<string, string>;
}

const cuisineTypes = [
  "Mediterránea",
  "Italiana",
  "Española",
  "Mexicana",
  "Asiática",
  "Japonesa",
  "China",
  "Tailandesa",
  "India",
  "Árabe",
  "Americana",
  "Vegetariana",
  "Vegana",
  "Fusión",
  "Cafetería",
  "Pastelería",
  "Pizzería",
  "Hamburguesería",
  "Marisquería",
  "Steakhouse",
  "Otro"
];

const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({ formData, handleChange, errors }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleChange('logoFile', file);
      
      // Crear URL para previsualización
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleChange('logoPreview', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-gray-900 dark:text-white">
        Información básica del negocio
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Comencemos con la información esencial de tu restaurante.
      </p>

      {/* Nombre del restaurante */}
      <div>
        <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nombre del restaurante
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="restaurantName"
            value={formData.restaurantName}
            onChange={(e) => handleChange('restaurantName', e.target.value)}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md ${errors.restaurantName ? 'border-red-300' : ''}`}
            placeholder="Ej: Café Delicioso"
          />
        </div>
        {errors.restaurantName && (
          <p className="mt-2 text-sm text-red-600">{errors.restaurantName}</p>
        )}
      </div>

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Logo
        </label>
        <div className="mt-1 flex items-center space-x-6">
          <div className="flex items-center">
            {formData.logoPreview ? (
              <div className="relative">
                <Image
                  src={formData.logoPreview}
                  alt="Logo preview"
                  className="h-16 w-16 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleChange('logoPreview', null);
                    handleChange('logoFile', null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <span className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="h-12 w-12 text-gray-300 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Subir logo
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Recomendado: imagen cuadrada de 400x400 píxeles.
        </p>
      </div>

      {/* Tipo de cocina */}
      <div>
        <label htmlFor="restaurantType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tipo de cocina
        </label>
        <div className="mt-1">
          <select
            id="restaurantType"
            value={formData.restaurantType}
            onChange={(e) => handleChange('restaurantType', e.target.value)}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md ${errors.restaurantType ? 'border-red-300' : ''}`}
          >
            <option value="">Selecciona un tipo de cocina</option>
            {cuisineTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        {errors.restaurantType && (
          <p className="mt-2 text-sm text-red-600">{errors.restaurantType}</p>
        )}
      </div>
    </div>
  );
};

export default Step1BasicInfo;