import Image from 'next/image';

type ContactInfo = {
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
};

type OpeningHour = {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
};

type Restaurant = {
  contact?: ContactInfo;
  opening_hours?: OpeningHour[];
  [key: string]: any;
};

type ContactSectionProps = {
  restaurant: Restaurant;
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
};

// Nombres de los días de la semana
const dayNames = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

// Función para formatear horas desde formato 24h a 12h
function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  
  try {
    // Extraer horas y minutos
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Formato AM/PM
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    return timeStr;
  }
}

export default function ContactSection({ restaurant, themeColors }: ContactSectionProps) {
  const contact = restaurant.contact || {};
  const openingHours = restaurant.opening_hours || [];
  
  // Verificar si hay alguna información de contacto
  const hasContactInfo = Boolean(
    contact.address ||
    contact.phone ||
    contact.email ||
    contact.whatsapp ||
    (contact.latitude && contact.longitude) ||
    openingHours.length > 0
  );

  if (!hasContactInfo) return null;

  // Crear string de dirección completa
  const fullAddress = [
    contact.address,
    contact.city,
    contact.postal_code,
    contact.country
  ].filter(Boolean).join(', ');

  // Formatear horarios para mostrarlos organizados
  const formatOpeningHours = () => {
    if (!openingHours.length) return null;

    // Ordenar por día de la semana
    const sortedHours = [...openingHours].sort((a, b) => a.day_of_week - b.day_of_week);
    
    return (
      <div className="grid gap-1">
        {sortedHours.map((dayHour) => (
          <div key={dayHour.day_of_week} className="flex justify-between text-sm">
            <span className="font-medium">{dayNames[dayHour.day_of_week]}</span>
            <span>
              {dayHour.is_closed ? (
                'Cerrado'
              ) : (
                `${formatTime(dayHour.opens_at)} - ${formatTime(dayHour.closes_at)}`
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="pt-8 border-t border-gray-200 border-opacity-20">
      <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: themeColors.primary }}>
        Información de Contacto
      </h2>

      <div className="space-y-4">
        {fullAddress && (
          <div className="flex items-start">
            <div className="mr-3 mt-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-medium" style={{ color: themeColors.secondary }}>Dirección</h3>
              <p>{fullAddress}</p>
              
              {/* Botón para abrir en Google Maps si hay coordenadas */}
              {contact.latitude && contact.longitude && (
                <a 
                  href={`https://maps.google.com/?q=${contact.latitude},${contact.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-2 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  style={{ color: themeColors.primary }}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver en Google Maps
                </a>
              )}
            </div>
          </div>
        )}

        {openingHours.length > 0 && (
          <div className="flex items-start">
            <div className="mr-3 mt-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-medium" style={{ color: themeColors.secondary }}>Horario</h3>
              {formatOpeningHours()}
            </div>
          </div>
        )}

        {contact.phone && (
          <div className="flex items-start">
            <div className="mr-3 mt-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-medium" style={{ color: themeColors.secondary }}>Teléfono</h3>
              <p><a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a></p>
            </div>
          </div>
        )}

        {contact.whatsapp && (
          <div className="flex items-start">
            <div className="mr-3 mt-1">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium" style={{ color: themeColors.secondary }}>WhatsApp</h3>
              <p>
                <a 
                  href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {contact.whatsapp}
                </a>
              </p>
            </div>
          </div>
        )}

        {contact.email && (
          <div className="flex items-start">
            <div className="mr-3 mt-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-medium" style={{ color: themeColors.secondary }}>Email</h3>
              <p><a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a></p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}