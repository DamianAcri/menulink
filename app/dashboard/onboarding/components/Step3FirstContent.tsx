import React from 'react';

interface MenuItemType {
  name: string;
  price: string;
  description: string;
  ingredients?: string;
  allergens?: string;
  spice_level?: number;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  discount_percentage?: string;
}

interface OpeningHoursType {
  [key: string]: {
    isOpen: boolean;
    opensAt: string;
    closesAt: string;
  };
}

interface Step3FirstContentProps {
  formData: {
    menuItems: MenuItemType[];
    openingHours: OpeningHoursType;
  };
  handleChange: (field: string, value: unknown) => void;
  errors: Record<string, string>;
}

const daysOfWeekLabels = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo"
};

const Step3FirstContent: React.FC<Step3FirstContentProps> = ({ formData, handleChange, errors }) => {
  // Funciones para manejar cambios en los platos del menú
  const handleMenuItemChange = (index: number, field: keyof MenuItemType, value: string | boolean | number) => {
    const updatedItems = [...formData.menuItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    handleChange('menuItems', updatedItems);
  };

  const addMenuItem = () => {
    handleChange('menuItems', [
      ...formData.menuItems,
      { name: '', price: '', description: '' }
    ]);
  };

  const removeMenuItem = (index: number) => {
    const updatedItems = formData.menuItems.filter((_, i) => i !== index);
    handleChange('menuItems', updatedItems);
  };

  // Funciones para manejar cambios en los horarios
  const handleOpeningHoursChange = (
    day: string, 
    field: 'isOpen' | 'opensAt' | 'closesAt', 
    value: boolean | string
  ) => {
    const updatedHours = {
      ...formData.openingHours,
      [day]: {
        ...formData.openingHours[day],
        [field]: value
      }
    };
    handleChange('openingHours', updatedHours);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-medium text-gray-900 dark:text-white">
        Primeros contenidos
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Para finalizar, vamos a añadir algunos platos a tu menú y establecer tus horarios.
      </p>

      {/* Sección de platos del menú */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Platos del menú
          </h3>
          <button
            type="button"
            onClick={addMenuItem}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60"
          >
            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Añadir plato
          </button>
        </div>

        {errors.menuItemName && (
          <p className="text-sm text-red-600">{errors.menuItemName}</p>
        )}
        {errors.menuItemPrice && (
          <p className="text-sm text-red-600">{errors.menuItemPrice}</p>
        )}

        {formData.menuItems.map((item, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md relative">
            {formData.menuItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeMenuItem(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`item-name-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del plato
                </label>
                <input
                  type="text"
                  id={`item-name-${index}`}
                  value={item.name}
                  onChange={(e) => handleMenuItemChange(index, 'name', e.target.value)}
                  className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Ej: Ensalada César"
                />
              </div>
              <div>
                <label htmlFor={`item-price-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Precio (€)
                </label>
                <input
                  type="text"
                  id={`item-price-${index}`}
                  value={item.price}
                  onChange={e => {
                    let val = e.target.value.replace(/[^\d.]/g, '');
                    const parts = val.split('.');
                    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                    handleMenuItemChange(index, 'price', val);
                  }}
                  className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Ej: 10.00"
                  inputMode="decimal"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`item-ingredients-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ingredientes (opcional)
                </label>
                <input
                  type="text"
                  id={`item-ingredients-${index}`}
                  value={item.ingredients || ''}
                  onChange={(e) => handleMenuItemChange(index, 'ingredients', e.target.value)}
                  className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Ej: Lechuga, pollo, parmesano, salsa césar"
                />
              </div>
              <div>
                <label htmlFor={`item-allergens-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Alérgenos (separados por coma)
                </label>
                <input
                  type="text"
                  id={`item-allergens-${index}`}
                  value={item.allergens || ''}
                  onChange={(e) => handleMenuItemChange(index, 'allergens', e.target.value)}
                  className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Ej: gluten, huevo, leche"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nivel de picante
                </label>
                <div className="flex items-center space-x-1">
                  {[1,2,3,4,5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Picante: ${star} estrellas`}
                      className={`text-xl ${item.spice_level === star ? 'text-red-500' : 'text-gray-300'}`}
                      onClick={() => handleMenuItemChange(index, 'spice_level', star)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-gray-500">{item.spice_level ? `${item.spice_level}/5` : 'Sin picante'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <label className="inline-flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={!!item.is_vegetarian}
                    onChange={e => handleMenuItemChange(index, 'is_vegetarian', e.target.checked)}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  />
                  <span className="ml-2">Vegetariano</span>
                </label>
                <label className="inline-flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={!!item.is_vegan}
                    onChange={e => handleMenuItemChange(index, 'is_vegan', e.target.checked)}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  />
                  <span className="ml-2">Vegano</span>
                </label>
                <label className="inline-flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={!!item.is_gluten_free}
                    onChange={e => handleMenuItemChange(index, 'is_gluten_free', e.target.checked)}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  />
                  <span className="ml-2">Sin gluten</span>
                </label>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`item-discount-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descuento (%) (opcional)
                </label>
                <input
                  type="number"
                  id={`item-discount-${index}`}
                  value={item.discount_percentage || ''}
                  onChange={(e) => handleMenuItemChange(index, 'discount_percentage', e.target.value)}
                  className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Ej: 10"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor={`item-desc-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción (opcional)
              </label>
              <textarea
                id={`item-desc-${index}`}
                rows={2}
                value={item.description}
                onChange={(e) => handleMenuItemChange(index, 'description', e.target.value)}
                className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                placeholder="Ingredientes o breve descripción del plato"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Sección de horarios */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Horario de apertura
        </h3>

        {errors.openingHours && (
          <p className="text-sm text-red-600">{errors.openingHours}</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(formData.openingHours).map(([day, hours]) => (
            <div key={day} className="flex items-start space-x-4 border dark:border-gray-700 p-3 rounded-md">
              <div className="flex h-6 items-center">
                <input
                  id={`day-${day}`}
                  type="checkbox"
                  checked={hours.isOpen}
                  onChange={(e) => handleOpeningHoursChange(day, 'isOpen', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <label htmlFor={`day-${day}`} className="font-medium text-gray-700 dark:text-gray-300">
                  {daysOfWeekLabels[day as keyof typeof daysOfWeekLabels]}
                </label>

                <div className={`mt-2 ${hours.isOpen ? 'flex space-x-3' : 'hidden'}`}>
                  <div>
                    <label htmlFor={`opens-at-${day}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Abre
                    </label>
                    <input
                      type="time"
                      id={`opens-at-${day}`}
                      value={hours.opensAt}
                      onChange={(e) => handleOpeningHoursChange(day, 'opensAt', e.target.value)}
                      className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor={`closes-at-${day}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Cierra
                    </label>
                    <input
                      type="time"
                      id={`closes-at-${day}`}
                      value={hours.closesAt}
                      onChange={(e) => handleOpeningHoursChange(day, 'closesAt', e.target.value)}
                      className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step3FirstContent;