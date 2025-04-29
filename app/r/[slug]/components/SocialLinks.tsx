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
  variant?: 'default' | 'minimal' | 'footer';
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

export default function SocialLinks({ links, themeColors, variant = 'default' }: SocialLinksProps) {
  if (!links || links.length === 0) return null;

  // Ordenar los enlaces por display_order si está disponible
  const sortedLinks = [...links].sort((a, b) => {
    if (a.display_order !== undefined && b.display_order !== undefined) {
      return a.display_order - b.display_order;
    }
    return 0;
  });

  if (variant === 'minimal') {
    return (
      <div className="flex justify-center gap-3 mb-4 animate-fade-up animation-delay-300">
        {sortedLinks.map((link) => {
          const platform = link.platform.toLowerCase();
          const iconFile = platformIcons[platform] || 'globe.svg';
          const tooltipText = platform.charAt(0).toUpperCase() + platform.slice(1).replace(/_/g, ' ');
          
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm 
                        hover:bg-white/30 transition-all duration-300 shadow-sm"
              title={tooltipText}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={`/social/${iconFile}`}
                alt={tooltipText}
                width={18}
                height={18}
                className="opacity-90"
                onError={(e) => {
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

  if (variant === 'footer') {
    return (
      <div className="flex justify-center gap-2 mb-3">
        {sortedLinks.map((link, idx) => {
          const platform = link.platform.toLowerCase();
          const iconFile = platformIcons[platform] || 'globe.svg';
          const tooltipText = platform.charAt(0).toUpperCase() + platform.slice(1).replace(/_/g, ' ');
          
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300
                       hover:bg-gray-100"
              style={{ opacity: 0.7 }}
              title={tooltipText}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={`/social/${iconFile}`}
                alt={tooltipText}
                width={16}
                height={16}
                className="opacity-70"
                style={{ filter: 'grayscale(40%)' }}
                onError={(e) => {
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

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-6 animate-fade-up">
      {sortedLinks.map((link, idx) => {
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
            className="flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300
                      hover:shadow hover:-translate-y-1 animate-fade-up"
            style={{ 
              backgroundColor: `${themeColors.primary}08`, 
              animationDelay: `${idx * 100}ms`
            }}
            onClick={(e) => e.stopPropagation()}
            title={tooltipText}
          >
            <Image
              src={`/social/${iconFile}`}
              alt={tooltipText}
              width={20}
              height={20}
              style={{ color: themeColors.primary }}
              className="opacity-80"
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