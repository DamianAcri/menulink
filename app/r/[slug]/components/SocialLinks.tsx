"use client";

import Image from 'next/image';

type SocialLink = {
  id: string;
  platform: string;
  url: string;
  display_order?: number;
};

type SocialLinksProps = {
  links: SocialLink[];
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
};

// Mapping of social media platforms to their respective icons
const platformIcons: Record<string, string> = {
  facebook: 'facebook.svg',
  instagram: 'instagram.svg',
  twitter: 'twitter.svg',
  linkedin: 'linkedin.svg',
  youtube: 'youtube.svg',
  tiktok: 'tiktok.svg',
  pinterest: 'pinterest.svg',
  snapchat: 'snapchat.svg',
  website: 'globe.svg',
  custom: 'globe.svg',
};

export default function SocialLinks({ links, themeColors }: SocialLinksProps) {
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
        const iconFile = platformIcons[platform] || 'globe.svg';

        // Prepare tooltip text (platform name with proper formatting)
        const tooltipText = platform.charAt(0).toUpperCase() + platform.slice(1).replace(/_/g, ' ');
        
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full transition-transform hover:scale-110"
            style={{ backgroundColor: themeColors.primary }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            title={tooltipText} // Add tooltip
          >
            <Image
              src={`/social/${iconFile}`}
              alt={tooltipText}
              width={24}
              height={24}
              className="invert"
              onError={(e) => {
                // Fallback to generic icon if specific one not found
                const target = e.target as HTMLImageElement;
                target.src = '/social/globe.svg';
              }}
            />
          </a>
        );
      })}
    </div>
  );
}