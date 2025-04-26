"use client";

import Image from 'next/image';

type DeliveryLink = {
  id: string;
  platform: string;
  url: string;
  display_order?: number;
};

type DeliveryLinksProps = {
  links: DeliveryLink[];
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
};

// Mapping of delivery platforms to their respective icons
const platformIcons: Record<string, string> = {
  uber_eats: 'ubereats.svg',
  glovo: 'glovo.svg',
  deliveroo: 'deliveroo.svg',
  just_eat: 'justeat.svg',
  custom: 'delivery.svg',
};

export default function DeliveryLinks({ links, themeColors }: DeliveryLinksProps) {
  if (!links || links.length === 0) return null;

  // Ordenar los enlaces por display_order si está disponible
  const sortedLinks = [...links].sort((a, b) => {
    if (a.display_order !== undefined && b.display_order !== undefined) {
      return a.display_order - b.display_order;
    }
    return 0;
  });

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-6">
      {sortedLinks.map((link) => {
        // Determine the icon file to use
        const platform = link.platform.toLowerCase();
        const iconFile = platformIcons[platform] || 'delivery.svg';

        // Display name - format the platform name nicely
        const displayName = platform.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2 rounded-lg transition-transform hover:scale-105"
            style={{ backgroundColor: themeColors.secondary }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Image
              src={`/delivery/${iconFile}`}
              alt={displayName}
              width={24}
              height={24}
              className="mr-2 invert"
              onError={(e) => {
                // Fallback to generic icon if specific one not found
                const target = e.target as HTMLImageElement;
                target.src = '/delivery/delivery.svg';
              }}
            />
            <span className="text-white font-medium">{displayName}</span>
          </a>
        );
      })}
    </div>
  );
}