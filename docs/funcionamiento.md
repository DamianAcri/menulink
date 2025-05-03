# MenuLink - Documentación Técnica

## Índice
1. [Introducción](#introducción)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Sistema de Autenticación](#sistema-de-autenticación)
4. [Estructura del Frontend](#estructura-del-frontend)
5. [Comunicación con Supabase](#comunicación-con-supabase)
6. [Flujos de Usuario](#flujos-de-usuario)
7. [Gestión de Datos](#gestión-de-datos)
8. [Funcionalidades Principales](#funcionalidades-principales)
9. [Sistema de Correos Electrónicos](#sistema-de-correos-electrónicos)

## Introducción

MenuLink es una plataforma que permite a restaurantes, bares y cafeterías crear una página web tipo "link in bio" que muestra su menú, ubicación, horarios y enlaces de contacto, diseñada específicamente para usar en perfiles de redes sociales.

### Problema que resuelve

En la era digital actual, los establecimientos de hostelería necesitan tener presencia en redes sociales, pero estas plataformas tienen limitaciones para mostrar información detallada como menús completos, horarios, o enlaces de reserva. MenuLink ofrece una solución centralizada que permite a los restaurantes crear una página web sencilla y personalizable, que pueden compartir desde sus perfiles en plataformas como Instagram, Facebook, TikTok, etc.

### Tecnologías utilizadas

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend/Autenticación**: Supabase (Auth y Base de datos)
- **Lenguaje de Programación**: TypeScript

## Arquitectura Técnica

MenuLink utiliza una arquitectura moderna basada en Next.js con el App Router para el frontend y Supabase como backend-as-a-service para la autenticación, base de datos y almacenamiento. Esta estructura permite un desarrollo ágil y escalable con las siguientes características:

- **Renderizado híbrido**: Combina Server Components con Client Components en Next.js para optimizar el rendimiento y SEO
- **Almacenamiento de estado**: Principalmente en Supabase, con estados locales gestionados por React
- **API Routes**: Se utilizan las API Routes de Next.js para operaciones del lado del servidor
- **Autenticación**: Implementada con Supabase Auth para una gestión segura de usuarios

## Sistema de Autenticación

La autenticación está implementada usando Supabase Auth y sigue los siguientes flujos:

### Configuración Inicial

El cliente de Supabase se inicializa en `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'menulink' },
  },
});
```

### Flujo de Registro (`/auth/register`)

1. El usuario completa el formulario con nombre, email, contraseña y nombre del negocio
2. Se llama a `supabase.auth.signUp()` para crear un nuevo usuario
3. Los datos adicionales como nombre completo y nombre del negocio se guardan en los metadatos del usuario
4. El usuario es redirigido a la página de verificación de email

### Verificación de Email (`/auth/verify-email`)

1. Supabase envía un correo con un enlace para verificar la cuenta
2. El usuario hace clic en el enlace y confirma su dirección de email
3. Una vez verificado, puede acceder al dashboard

### Inicio de Sesión (`/auth/login`)

1. El usuario introduce su email y contraseña
2. Se llama a `supabase.auth.signInWithPassword()` para autenticar
3. Si es exitoso, se redirige al dashboard

### Recuperación de Contraseña

1. El proceso inicia en `/auth/reset-password` donde el usuario introduce su email
2. Se llama a `supabase.auth.resetPasswordForEmail()` para enviar un correo
3. El usuario recibe un enlace que lo lleva a `/auth/update-password`
4. En esta página, el usuario ingresa su nueva contraseña y se llama a `supabase.auth.updateUser()`

### Protección de Rutas

El layout `app/dashboard/layout.tsx` verifica la sesión del usuario:

```typescript
useEffect(() => {
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Redirigir al login si no hay usuario autenticado
      router.push("/auth/login");
      return;
    }
    
    setUser(session.user);
    // Verificación adicional para usuarios nuevos
    // ...
  };
  
  checkUser();
}, [router, pathname]);
```

Este layout envuelve todas las páginas del dashboard, asegurando que solo usuarios autenticados puedan acceder. Además, comprueba si el usuario es nuevo para redirigirlo al proceso de onboarding si es necesario.

## Estructura del Frontend

El proyecto sigue la estructura de App Router de Next.js:

### Estructura de carpetas principal

```
app/
├── page.tsx              # Landing page pública
├── layout.tsx            # Layout principal de la aplicación
├── globals.css           # Estilos globales
├── auth/                 # Páginas de autenticación
├── dashboard/            # Área de administración
└── r/                    # Páginas públicas de restaurantes
```

### Páginas de autenticación (`/auth`)

Contiene las páginas relacionadas con la gestión de usuarios:
- `login`: Inicio de sesión
- `register`: Registro de nuevos usuarios
- `reset-password`: Solicitud de recuperación de contraseña
- `update-password`: Cambio de contraseña
- `verify-email`: Verificación de email

Todas implementadas como Client Components que interactúan con Supabase Auth.

### Dashboard (`/dashboard`)

El área principal para usuarios autenticados donde pueden gestionar su restaurante:

- `layout.tsx`: Define la estructura común con barra lateral de navegación
- `page.tsx`: Dashboard principal con resumen de estadísticas
- `/profile`: Edición de información básica del restaurante
- `/menu`: Gestión de categorías y platos del menú
- `/contact`: Información de contacto y ubicación
- `/social`: Enlaces a redes sociales y servicios de delivery
- `/reservations`: Gestión de reservas
- `/stats`: Estadísticas de visitas
- `/tools`: Herramientas auxiliares
- `/settings`: Configuración general
- `/onboarding`: Proceso guiado para nuevos usuarios

### Páginas públicas de restaurantes (`/r/[slug]`)

La ruta dinámica donde se muestra la página pública de cada restaurante:

- `page.tsx`: Componente principal que carga los datos del restaurante
- `components/`: Componentes específicos para esta página:
  - `Header.tsx`: Cabecera con logo y descripción
  - `MenuSection.tsx`: Visualización del menú
  - `ContactSection.tsx`: Información de contacto y ubicación
  - `SocialLinks.tsx`: Enlaces a redes sociales
  - `DeliveryLinks.tsx`: Enlaces a servicios de delivery
  - `ReservationSection.tsx`: Formulario de reservas

## Comunicación con Supabase

MenuLink utiliza Supabase para:

### Autenticación de usuarios

Como se describió en la sección de autenticación, utilizando:
- `supabase.auth.signUp()`
- `supabase.auth.signInWithPassword()`
- `supabase.auth.signOut()`
- `supabase.auth.getSession()`

### Operaciones CRUD en la base de datos

Para interactuar con las tablas de la base de datos:

```typescript
// Ejemplo de consulta para obtener datos
const { data, error } = await supabase
  .from('restaurants')
  .select('*')
  .eq('user_id', userId);

// Ejemplo de inserción
const { data, error } = await supabase
  .from('menu_items')
  .insert({
    category_id: categoryId,
    name: itemName,
    description: itemDescription,
    price: itemPrice
  });

// Ejemplo de actualización
const { data, error } = await supabase
  .from('restaurants')
  .update({ name: newName })
  .eq('id', restaurantId);

// Ejemplo de eliminación
const { data, error } = await supabase
  .from('menu_items')
  .delete()
  .eq('id', itemId);
```

### Almacenamiento de archivos

Para subir imágenes (logos, fotos de platos, etc.):

```typescript
// Ejemplo de subida de imagen
const { data, error } = await supabase.storage
  .from('restaurant-images')
  .upload(`${restaurantId}/logo.png`, imageFile);

// Ejemplo para obtener URL pública
const { data } = supabase.storage
  .from('restaurant-images')
  .getPublicUrl(`${restaurantId}/logo.png`);
```

### Relaciones y consultas complejas

Las consultas a la base de datos aprovechan las relaciones entre tablas:

```typescript
// Ejemplo de consulta con relaciones anidadas
const { data: restaurant, error } = await supabase
  .from('restaurants')
  .select(`
    *,
    menu_categories(
      id,
      name,
      description,
      menu_items(*)
    ),
    contact_info(*),
    social_links(*)
  `)
  .eq('slug', slug)
  .single();
```

## Flujos de Usuario

### Registro y onboarding

1. El usuario se registra en `/auth/register`
2. Verifica su email
3. Es redirigido a `/dashboard/onboarding`
4. Completa los pasos guiados:
   - Información básica del restaurante
   - Personalización de la apariencia
   - Primer contenido del menú
5. Al finalizar, accede al dashboard completo

### Gestión de contenidos

1. El usuario accede al dashboard
2. Puede editar:
   - Información del perfil en `/dashboard/profile`
   - Categorías y platos en `/dashboard/menu`
   - Datos de contacto en `/dashboard/contact`
   - Redes sociales en `/dashboard/social`
3. Todos los cambios se reflejan inmediatamente en la página pública del restaurante

### Visualización de la página pública

La página pública en `/r/[slug]` muestra:
1. Información básica (nombre, descripción, logo)
2. Menú organizado por categorías
3. Información de contacto y ubicación
4. Enlaces a redes sociales y servicios de delivery
5. Formulario de reservas

Al cargar esta página, se registra una vista en la tabla `page_views` para el tracking estadístico.

## Gestión de Datos

La base de datos de MenuLink está estructurada en las siguientes tablas principales:

### Tablas relacionadas con restaurantes

- `restaurants`: Información básica del restaurante
- `menu_categories`: Categorías del menú
- `menu_items`: Platos/productos individuales
- `contact_info`: Datos de contacto y ubicación
- `opening_hours`: Horarios de apertura
- `social_links`: Enlaces a redes sociales
- `delivery_links`: Enlaces a servicios de delivery
- `page_views`: Estadísticas de visitas
- `reservations`: Solicitudes de reserva

### Relaciones principales

1. `restaurants` ← tiene una relación uno a uno con → `contact_info`
2. `restaurants` ← tiene una relación uno a muchos con → `menu_categories`, `opening_hours`, `social_links`, `delivery_links`, `page_views`
3. `menu_categories` ← tiene una relación uno a muchos con → `menu_items`

### Políticas de seguridad en Supabase

1. Los usuarios solo pueden ver y editar sus propios restaurantes y datos relacionados
2. Las páginas públicas son accesibles por cualquier usuario sin autenticación
3. Las estadísticas solo pueden ser vistas por el propietario del restaurante

## Funcionalidades Principales

### Personalización visual

Los usuarios pueden personalizar la apariencia de su página:
- Colores primario y secundario
- Fuente
- Logo y imagen de portada

Estos ajustes se aplican a la página pública mediante estilos dinámicos:

```typescript
// Ejemplo de cómo se aplican los estilos
const themeColors = {
  primary: restaurant.theme_color || '#3b82f6',
  secondary: restaurant.secondary_color || '#1E40AF',
  background: '#ffffff',
  text: '#1f2937',
};

const fontFamily = restaurant.font_family || 'Inter, sans-serif';

// Uso en componentes
<main style={{ background: '#fff', color: themeColors.text, fontFamily }}>
```

### Gestión del menú

El menú se estructura en categorías y platos, con opciones para:
- Ordenar categorías y platos
- Marcar platos como destacados
- Establecer disponibilidad
- Añadir imágenes a los platos

### Sistema de reservas

Los visitantes pueden hacer solicitudes de reserva:
1. Completan un formulario con sus datos y fecha/hora deseada
2. La reserva se guarda en la tabla `reservations` con estado "pendiente"
3. El propietario recibe notificación (si tiene habilitadas las notificaciones)
4. Puede aprobar o rechazar la reserva desde el dashboard

### Estadísticas y analítica

El sistema registra las visitas a la página pública para proporcionar estadísticas:
- Número de visitas
- Fuentes de tráfico (referrers)
- Dispositivos utilizados

### Compatibilidad con dispositivos móviles

Todos los componentes están diseñados con un enfoque mobile-first, utilizando Tailwind CSS para asegurar que la experiencia sea óptima en todos los dispositivos.

## Sistema de Correos Electrónicos

MenuLink implementa un sistema automatizado para el envío de correos electrónicos a clientes después de completar reservas. Este sistema ayuda a los restaurantes a mantener una comunicación efectiva con sus clientes y fomentar las reseñas positivas.

### Arquitectura del Sistema de Correos

El sistema utiliza una arquitectura flexible que permite cambiar entre proveedores de correo según el entorno:

- **Entorno de desarrollo**: Utiliza Mailtrap para simular el envío de correos sin enviarlos realmente
- **Entorno de producción**: Utiliza Resend para el envío real de correos con dominio personalizado

La selección del proveedor se realiza automáticamente basándose en la variable de entorno `NODE_ENV`.

### Proveedores de Correo Electrónico

#### Mailtrap (Desarrollo)

Configuración para pruebas de correos durante el desarrollo:

```typescript
// Configuración de Mailtrap para entorno de desarrollo
const mailtrapTransport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER || "d0c1f26a9d60cd",
    pass: process.env.MAILTRAP_PASS || "16e4a59b156a75"
  }
});
```

#### Resend (Producción)

Para el envío de correos en producción con dominio personalizado:

```typescript
// Inicializar cliente de Resend con la API key
export const resend = new Resend(process.env.RESEND_API_KEY);
```

### Tipos de Correos Electrónicos

El sistema envía dos tipos de correos a los clientes:

1. **Correo de agradecimiento**: Enviado inmediatamente cuando una reserva es marcada como "completada"
   - Agradece al cliente por su visita
   - Utiliza un tono cercano y profesional
   - Incluye el nombre del cliente y del restaurante

2. **Solicitud de reseña**: Enviado automáticamente 24 horas después del correo de agradecimiento
   - Solicita al cliente que comparta su experiencia
   - Incluye un botón para acceder directamente a la página de reseñas
   - Utiliza el enlace de Google My Business del restaurante (si está configurado) o su página en MenuLink

### Flujo de Envío de Correos

1. Cuando un administrador marca una reserva como "completada" en el panel de reservas
   - Se envía automáticamente el correo de agradecimiento al cliente
   - Se programa el correo de solicitud de reseña para 24 horas después

2. Un proceso periódico (CRON job) verifica los correos programados
   - Busca correos con estado "scheduled" cuya fecha de envío ya ha llegado
   - Envía los correos pendientes
   - Actualiza su estado en la base de datos

### Almacenamiento y Seguimiento

Todos los correos enviados y programados se registran en la tabla `email_logs` con la siguiente estructura:

```sql
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('thank_you', 'review_request')),
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'sent', 'failed')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Este sistema de registro permite:
- Evitar duplicados (verificando si ya se envió un correo para una reserva específica)
- Programar envíos futuros (como el correo de solicitud de reseña)
- Realizar seguimiento de errores en el envío
- Generar estadísticas sobre tasas de apertura y respuesta (en futuras versiones)

#Estructura de la base de datos (v1)
[
  {
    "tabla": "campaign_recipients",
    "columna": "campaign_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "marketing_campaigns",
    "columna_referenciada": "id"
  },
  {
    "tabla": "campaign_recipients",
    "columna": "clicked_through",
    "tipo": "boolean",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "campaign_recipients",
    "columna": "customer_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "customers",
    "columna_referenciada": "id"
  },
  {
    "tabla": "campaign_recipients",
    "columna": "email_opened",
    "tipo": "boolean",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "campaign_recipients",
    "columna": "email_sent",
    "tipo": "boolean",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "contact_info",
    "columna": "address",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "contact_info",
    "columna": "city",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "contact_info",
    "columna": "country",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "contact_info",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "contact_info",
    "columna": "email",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "contact_info",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "contact_info",
    "columna": "latitude",
    "tipo": "numeric(10,8)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "contact_info",
    "columna": "longitude",
    "tipo": "numeric(11,8)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "contact_info",
    "columna": "phone",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "contact_info",
    "columna": "postal_code",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "contact_info",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "contact_info",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "contact_info",
    "columna": "whatsapp",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_interactions",
    "columna": "customer_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "customers",
    "columna_referenciada": "id"
  },
  {
    "tabla": "customer_interactions",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_interactions",
    "columna": "interaction_date",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_interactions",
    "columna": "interaction_type",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_interactions",
    "columna": "notes",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_interactions",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "customer_interactions",
    "columna": "staff_id",
    "tipo": "uuid",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_loyalty",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_loyalty",
    "columna": "current_points",
    "tipo": "integer(32,0)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_loyalty",
    "columna": "customer_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "customers",
    "columna_referenciada": "id"
  },
  {
    "tabla": "customer_loyalty",
    "columna": "last_activity_date",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_loyalty",
    "columna": "total_points",
    "tipo": "integer(32,0)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_loyalty",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_preferences",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_preferences",
    "columna": "customer_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "customers",
    "columna_referenciada": "id"
  },
  {
    "tabla": "customer_preferences",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_preferences",
    "columna": "preference_type",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_preferences",
    "columna": "preference_value",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_preferences",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "customer_preferences",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_segments",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_segments",
    "columna": "description",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_segments",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_segments",
    "columna": "name",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customer_segments",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "customer_segments",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customers",
    "columna": "birth_date",
    "tipo": "date",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customers",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customers",
    "columna": "customer_source",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customers",
    "columna": "email",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customers",
    "columna": "first_name",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customers",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customers",
    "columna": "last_name",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customers",
    "columna": "notes",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customers",
    "columna": "phone",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "customers",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "customers",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "delivery_links",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "delivery_links",
    "columna": "display_order",
    "tipo": "integer(32,0)",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "delivery_links",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "delivery_links",
    "columna": "platform",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "delivery_links",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "YES",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "delivery_links",
    "columna": "url",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "email_logs",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "email_logs",
    "columna": "customer_email",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "email_logs",
    "columna": "error_message",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "email_logs",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "email_logs",
    "columna": "reservation_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "reservations",
    "columna_referenciada": "id"
  },
  {
    "tabla": "email_logs",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "email_logs",
    "columna": "scheduled_for",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "email_logs",
    "columna": "sent_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "email_logs",
    "columna": "status",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "email_logs",
    "columna": "type",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "loyalty_programs",
    "columna": "active",
    "tipo": "boolean",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "loyalty_programs",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "loyalty_programs",
    "columna": "description",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "loyalty_programs",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "loyalty_programs",
    "columna": "name",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "loyalty_programs",
    "columna": "points_required",
    "tipo": "integer(32,0)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "loyalty_programs",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "loyalty_programs",
    "columna": "reward_description",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "loyalty_programs",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "marketing_campaigns",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "marketing_campaigns",
    "columna": "description",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "marketing_campaigns",
    "columna": "end_date",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "marketing_campaigns",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "marketing_campaigns",
    "columna": "name",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "marketing_campaigns",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "marketing_campaigns",
    "columna": "start_date",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "marketing_campaigns",
    "columna": "status",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "marketing_campaigns",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_categories",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_categories",
    "columna": "description",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_categories",
    "columna": "display_order",
    "tipo": "integer(32,0)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_categories",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_categories",
    "columna": "name",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_categories",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "menu_categories",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_items",
    "columna": "category_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "menu_categories",
    "columna_referenciada": "id"
  },
  {
    "tabla": "menu_items",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_items",
    "columna": "description",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_items",
    "columna": "display_order",
    "tipo": "integer(32,0)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_items",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_items",
    "columna": "image_url",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_items",
    "columna": "is_available",
    "tipo": "boolean",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_items",
    "columna": "is_featured",
    "tipo": "boolean",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_items",
    "columna": "name",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_items",
    "columna": "price",
    "tipo": "numeric(10,2)",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "menu_items",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "opening_hours",
    "columna": "closes_at",
    "tipo": "time without time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "opening_hours",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "opening_hours",
    "columna": "day_of_week",
    "tipo": "integer(32,0)",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "opening_hours",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "opening_hours",
    "columna": "is_closed",
    "tipo": "boolean",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "opening_hours",
    "columna": "opens_at",
    "tipo": "time without time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "opening_hours",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "opening_hours",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "page_views",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "page_views",
    "columna": "ip_address",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "page_views",
    "columna": "referrer",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "page_views",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "page_views",
    "columna": "user_agent",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "page_views",
    "columna": "viewed_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "reservations",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "reservations",
    "columna": "customer_email",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "reservations",
    "columna": "customer_id",
    "tipo": "uuid",
    "permite_nulos": "YES",
    "tabla_referenciada": "customers",
    "columna_referenciada": "id"
  },
  {
    "tabla": "reservations",
    "columna": "customer_name",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "reservations",
    "columna": "customer_phone",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "reservations",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "reservations",
    "columna": "party_size",
    "tipo": "integer(32,0)",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "reservations",
    "columna": "reservation_date",
    "tipo": "date",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "reservations",
    "columna": "reservation_time",
    "tipo": "time without time zone",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "reservations",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "reservations",
    "columna": "special_requests",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "reservations",
    "columna": "status",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "reservations",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "color_scheme",
    "tipo": "character varying(255)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "cover_image_url",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "description",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "email_notifications",
    "tipo": "boolean",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "font_family",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "google_my_business_link",
    "tipo": "character varying(255)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "logo_url",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "name",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "primary_color",
    "tipo": "character varying(50)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "restaurant_type",
    "tipo": "character varying(50)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "secondary_color",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "slug",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "subscription_tier",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "theme_color",
    "tipo": "text",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "theme_type",
    "tipo": "integer(32,0)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "restaurants",
    "columna": "user_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "social_links",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "social_links",
    "columna": "display_order",
    "tipo": "integer(32,0)",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "social_links",
    "columna": "id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "social_links",
    "columna": "platform",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "social_links",
    "columna": "restaurant_id",
    "tipo": "uuid",
    "permite_nulos": "NO",
    "tabla_referenciada": "restaurants",
    "columna_referenciada": "id"
  },
  {
    "tabla": "social_links",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "permite_nulos": "YES",
    "tabla_referenciada": null,
    "columna_referenciada": null
  },
  {
    "tabla": "social_links",
    "columna": "url",
    "tipo": "text",
    "permite_nulos": "NO",
    "tabla_referenciada": null,
    "columna_referenciada": null
  }
]