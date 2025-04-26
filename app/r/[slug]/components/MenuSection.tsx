import Image from 'next/image';

type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_featured: boolean;
  is_available: boolean;
  display_order: number;
};

type MenuCategory = {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  menu_items: MenuItem[];
};

type MenuSectionProps = {
  categories: MenuCategory[];
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
};

export default function MenuSection({ categories, themeColors }: MenuSectionProps) {
  if (!categories || categories.length === 0) return null;

  // Ordenar categorías por display_order
  const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: themeColors.primary }}>
        Nuestro Menú
      </h2>

      {/* Platos destacados (si existen) */}
      {sortedCategories.some(cat => cat.menu_items?.some(item => item.is_featured)) && (
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-4" style={{ color: themeColors.secondary }}>
            Destacados
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedCategories.flatMap(cat => 
              cat.menu_items
                ?.filter(item => item.is_featured && item.is_available !== false)
                .sort((a, b) => a.display_order - b.display_order)
                .map(item => (
                  <div 
                    key={item.id}
                    className="bg-white bg-opacity-10 rounded-lg p-4 shadow-sm flex flex-col"
                  >
                    {item.image_url && (
                      <div className="relative h-40 w-full rounded-md overflow-hidden mb-3">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-lg">{item.name}</h4>
                      <span className="font-bold" style={{ color: themeColors.primary }}>
                        {typeof item.price === 'number' ? 
                          `${item.price.toFixed(2)}€` : 
                          item.price}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-sm opacity-80">{item.description}</p>
                    )}
                  </div>
                )) || []
            )}
          </div>
        </div>
      )}

      {/* Categorías y sus platos */}
      {sortedCategories.map(category => {
        // Si no hay platos en esta categoría, no mostrar
        if (!category.menu_items || category.menu_items.length === 0) return null;

        // Ordenar platos por display_order y filtrar los que no están disponibles
        const sortedItems = [...category.menu_items]
          .filter(item => item.is_available !== false)
          .sort((a, b) => a.display_order - b.display_order);

        if (sortedItems.length === 0) return null;

        return (
          <div key={category.id} className="mb-8">
            <h3 className="text-xl font-semibold mb-4" style={{ color: themeColors.secondary }}>
              {category.name}
            </h3>
            {category.description && (
              <p className="text-sm opacity-80 mb-3">{category.description}</p>
            )}
            <div className="space-y-3">
              {sortedItems.map(item => (
                <div 
                  key={item.id}
                  className="flex justify-between items-start p-3 hover:bg-black hover:bg-opacity-5 rounded-lg transition-colors"
                >
                  <div className="flex-grow">
                    <h4 className="font-medium">{item.name}</h4>
                    {item.description && (
                      <p className="mt-1 text-sm opacity-80">{item.description}</p>
                    )}
                  </div>
                  <div className="ml-3 flex flex-col items-end">
                    <span className="font-bold whitespace-nowrap" style={{ color: themeColors.primary }}>
                      {typeof item.price === 'number' ? 
                        `${item.price.toFixed(2)}€` : 
                        item.price}
                    </span>
                    {item.is_featured && (
                      <span className="text-xs mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        Destacado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}