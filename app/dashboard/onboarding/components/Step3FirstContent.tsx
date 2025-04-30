import React from 'react';

interface MenuItemType {
  name: string;
  price: string;
  description: string;
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
  handleChange: (field: string, value: any) => void;
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
  const handleMenuItemChange = (index: number, field: keyof MenuItemType, value: string) => {
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
                  type="number"
                  id={`item-price-${index}`}
                  value={item.price}
                  onChange={(e) => handleMenuItemChange(index, 'price', e.target.value)}
                  className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Ej: 12.50"
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