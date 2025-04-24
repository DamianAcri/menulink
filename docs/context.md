# Contexto del Proyecto MenuLink

## Descripción General
MenuLink es una plataforma que permite a restaurantes, bares y cafeterías crear una página web tipo "link in bio" que muestra su menú, ubicación, horarios y enlaces de contacto, diseñada específicamente para usar en perfiles de redes sociales.

## Tecnologías Utilizadas
- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend/Autenticación**: Supabase
- **Lenguaje de Programación**: TypeScript

## Estructura del Proyecto

```
menulink/
├── app/                      # Directorio principal de Next.js App Router
│   ├── page.tsx              # Landing page pública
│   ├── layout.tsx            # Layout principal de la aplicación
│   ├── globals.css           # Estilos globales
│   ├── auth/                 # Páginas de autenticación
│   │   ├── login/            # Página de inicio de sesión
│   │   ├── register/         # Página de registro
│   │   ├── reset-password/   # Página de recuperación de contraseña
│   │   ├── update-password/  # Página para actualizar contraseña
│   │   └── verify-email/     # Página de verificación de email
│   └── dashboard/            # Área de administración para usuarios registrados
│       ├── layout.tsx        # Layout común para todas las páginas del dashboard (sidebar)
│       ├── page.tsx          # Dashboard principal con resumen de estadísticas
│       ├── profile/          # Sección de edición de perfil del restaurante
│       │   └── page.tsx      # Página para editar información y apariencia
│       └── menu/             # Sección de gestión del menú
│           └── page.tsx      # Página para administrar categorías y platos
├── lib/                      # Utilidades y configuraciones
│   └── supabase.ts           # Cliente de Supabase y funciones de autenticación
├── public/                   # Archivos estáticos
│   ├── next.svg              # Logo de Next.js
│   └── vercel.svg            # Logo de Vercel
└── docs/                     # Documentación
    ├── context.md            # Contexto del proyecto y estructura
    └── todo.md               # Lista de tareas pendientes para el MVP
```

## Sistema de Autenticación

El sistema de autenticación está implementado utilizando Supabase Auth y sigue este flujo:

1. **Configuración Inicial**:
   - El cliente de Supabase se inicializa en `lib/supabase.ts` utilizando las variables de entorno:
     ```typescript
     import { createClient } from '@supabase/supabase-js';
     
     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
     const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
     
     export const supabase = createClient(supabaseUrl, supabaseAnonKey);
     ```

2. **Flujo de Registro (`/auth/register`)**:
   - El usuario completa el formulario con nombre, email, contraseña y nombre del negocio
   - Se llama a `supabase.auth.signUp()` para crear un nuevo usuario
   - Los datos adicionales (nombre completo, nombre del negocio) se guardan en los metadatos del usuario
   - El usuario es redirigido a la página de verificación de email

3. **Verificación de Email (`/auth/verify-email`)**:
   - Supabase envía un correo con un enlace para verificar la cuenta
   - El usuario hace clic en el enlace y confirma su dirección de email

4. **Inicio de Sesión (`/auth/login`)**:
   - El usuario ingresa su email y contraseña
   - Se llama a `supabase.auth.signInWithPassword()` para autenticar
   - Si es exitoso, se redirige al dashboard

5. **Recuperación de Contraseña**:
   - El flujo inicia en `/auth/reset-password` donde el usuario introduce su email
   - Se llama a `supabase.auth.resetPasswordForEmail()` para enviar un correo
   - El usuario recibe un enlace que lo lleva a `/auth/update-password`
   - En esta página, el usuario ingresa su nueva contraseña y se llama a `supabase.auth.updateUser()`

6. **Protección de Rutas**:
   - El layout `app/dashboard/layout.tsx` verifica la sesión del usuario con `supabase.auth.getSession()`
   - Si no hay sesión, redirige al usuario a la página de login
   - Este layout envuelve todas las páginas del dashboard, asegurando que solo usuarios autenticados puedan acceder

## Gestión de Datos

La interacción con la base de datos se realiza mediante el cliente de Supabase:

1. **Perfil del Restaurante**:
   - Al registrarse, se crea un registro en la tabla `restaurants` asociado al ID del usuario
   - La página `/dashboard/profile` permite editar esta información (nombre, descripción, URL, colores)

2. **Gestión de Menú**:
   - En `/dashboard/menu` se gestionan las categorías (tabla `menu_categories`) y los platos (tabla `menu_items`)
   - Las operaciones CRUD se realizan directamente usando el cliente de Supabase

3. **Almacenamiento de Imágenes**:
   - Las imágenes (logos, portadas, fotos de platos) se suben al storage de Supabase
   - Se organizan en buckets y carpetas según su propósito
   - Ejemplo: `restaurants/{restaurant_id}/logo` para los logos

## Representación de Datos

Para cada restaurante registrado, se genera una página pública en la ruta `/r/{slug}` que muestra:

1. Información básica (nombre, descripción, logo)
2. Menú organizado por categorías
3. Información de contacto y ubicación
4. Enlaces a redes sociales

Esta página se personaliza según las configuraciones de tema, colores y fuentes elegidas por el usuario.

## Progreso Actual

### Completado
1. **Configuración del Proyecto**
   - Inicialización del proyecto Next.js con TypeScript y Tailwind CSS
   - Instalación de Supabase para autenticación y base de datos

2. **Página Principal (Landing Page)**
   - Diseño completo con secciones de características, planes y testimonios
   - Llamadas a la acción para registro

3. **Sistema de Autenticación**
   - Página de inicio de sesión
   - Página de registro
   - Recuperación de contraseña
   - Verificación de email
   - Actualización de contraseña

4. **Dashboard del Restaurante**
   - Layout con barra lateral de navegación
   - Página principal con resumen y estadísticas
   - Editor de perfil con personalización completa

5. **Configuración de Supabase**
   - Configuración básica del cliente
   - Estructura de variables de entorno en .env.local
   - Creación de tablas en la base de datos
   - Configuración del almacenamiento para imágenes

## Estructura de Base de Datos en Supabase

### Tablas Principales

#### 1. restaurants
Almacena la información principal de cada restaurante o negocio.

| Columna           | Tipo          | Descripción                                          |
|-------------------|---------------|------------------------------------------------------|
| id                | uuid          | Identificador único (clave primaria)                 |
| user_id           | uuid          | Referencia al usuario en auth.users (llave foránea)  |
| name              | text          | Nombre del restaurante/negocio                       |
| slug              | text          | Slug único para la URL (ej: mi-restaurante)          |
| description       | text          | Descripción corta del restaurante                    |
| logo_url          | text          | URL de la imagen del logo                            |
| cover_image_url   | text          | URL de la imagen de portada                           |
| theme_color       | text          | Color primario del tema (hex)                        |
| secondary_color   | text          | Color secundario del tema (hex)                      |
| font_family       | text          | Familia de fuente preferida                          |
| subscription_tier | text          | Nivel de suscripción (free, pro, premium)            |
| created_at        | timestamp     | Fecha de creación                                    |
| updated_at        | timestamp     | Fecha de última actualización                        |

#### 2. menu_categories
Categorías del menú (ej: Entrantes, Platos Principales, Postres).

| Columna           | Tipo          | Descripción                                          |
|-------------------|---------------|------------------------------------------------------|
| id                | uuid          | Identificador único (clave primaria)                 |
| restaurant_id     | uuid          | Restaurante al que pertenece (llave foránea)         |
| name              | text          | Nombre de la categoría                               |
| description       | text          | Descripción opcional de la categoría                 |
| display_order     | integer       | Orden de visualización                               |
| created_at        | timestamp     | Fecha de creación                                    |
| updated_at        | timestamp     | Fecha de última actualización                        |

#### 3. menu_items
Platos o productos individuales del menú.

| Columna           | Tipo          | Descripción                                          |
|-------------------|---------------|------------------------------------------------------|
| id                | uuid          | Identificador único (clave primaria)                 |
| category_id       | uuid          | Categoría a la que pertenece (llave foránea)         |
| name              | text          | Nombre del plato/producto                            |
| description       | text          | Descripción del plato                                |
| price             | decimal       | Precio                                               |
| image_url         | text          | URL de la imagen del plato                           |
| is_featured       | boolean       | Si está destacado en el menú                         |
| is_available      | boolean       | Si está disponible actualmente                       |
| display_order     | integer       | Orden de visualización                               |
| created_at        | timestamp     | Fecha de creación                                    |
| updated_at        | timestamp     | Fecha de última actualización                        |

#### 4. contact_info
Información de contacto y ubicación del restaurante.

| Columna           | Tipo          | Descripción                                          |
|-------------------|---------------|------------------------------------------------------|
| id                | uuid          | Identificador único (clave primaria)                 |
| restaurant_id     | uuid          | Restaurante al que pertenece (llave foránea)         |
| address           | text          | Dirección física                                     |
| city              | text          | Ciudad                                               |
| postal_code       | text          | Código postal                                        |
| country           | text          | País                                                 |
| latitude          | decimal       | Coordenada latitud para el mapa                      |
| longitude         | decimal       | Coordenada longitud para el mapa                     |
| phone             | text          | Número de teléfono                                   |
| whatsapp          | text          | Número de WhatsApp (con código de país)              |
| email             | text          | Email de contacto                                    |
| created_at        | timestamp     | Fecha de creación                                    |
| updated_at        | timestamp     | Fecha de última actualización                        |

#### 5. opening_hours
Horarios de apertura del restaurante.

| Columna           | Tipo          | Descripción                                          |
|-------------------|---------------|------------------------------------------------------|
| id                | uuid          | Identificador único (clave primaria)                 |
| restaurant_id     | uuid          | Restaurante al que pertenece (llave foránea)         |
| day_of_week       | integer       | Día de la semana (0-6, 0 = Domingo)                  |
| opens_at          | time          | Hora de apertura                                     |
| closes_at         | time          | Hora de cierre                                       |
| is_closed         | boolean       | Si está cerrado este día                             |
| created_at        | timestamp     | Fecha de creación                                    |
| updated_at        | timestamp     | Fecha de última actualización                        |

#### 6. social_links
Enlaces a redes sociales y servicios de entrega.

| Columna           | Tipo          | Descripción                                          |
|-------------------|---------------|------------------------------------------------------|
| id                | uuid          | Identificador único (clave primaria)                 |
| restaurant_id     | uuid          | Restaurante al que pertenece (llave foránea)         |
| platform          | text          | Plataforma (instagram, facebook, ubereats, etc)      |
| url               | text          | URL completa al perfil o página                      |
| display_order     | integer       | Orden de visualización                               |
| created_at        | timestamp     | Fecha de creación                                    |
| updated_at        | timestamp     | Fecha de última actualización                        |

#### 7. page_views
Estadísticas de visitas a la página del menú.

| Columna           | Tipo          | Descripción                                          |
|-------------------|---------------|------------------------------------------------------|
| id                | uuid          | Identificador único (clave primaria)                 |
| restaurant_id     | uuid          | Restaurante visitado (llave foránea)                 |
| viewed_at         | timestamp     | Fecha y hora de la visita                            |
| referrer          | text          | URL de referencia (de dónde vino)                    |
| user_agent        | text          | Agente de usuario (navegador/dispositivo)            |
| ip_address        | text          | Dirección IP (anonimizada)                           |

### Relaciones entre Tablas

1. **restaurants** ← tiene una relación uno a uno con → **contact_info**
2. **restaurants** ← tiene una relación uno a muchos con → **menu_categories**
3. **restaurants** ← tiene una relación uno a muchos con → **opening_hours**
4. **restaurants** ← tiene una relación uno a muchos con → **social_links**
5. **restaurants** ← tiene una relación uno a muchos con → **page_views**
6. **menu_categories** ← tiene una relación uno a muchos con → **menu_items**

### Políticas de Seguridad

1. Los usuarios solo pueden ver y editar sus propios restaurantes y datos relacionados
2. Las páginas de menú públicas son accesibles por cualquier usuario sin autenticación
3. Las estadísticas solo pueden ser vistas por el propietario del restaurante

### Autenticación

Utilizaremos el sistema de autenticación integrado de Supabase con:
- Autenticación por email y contraseña
- Verificación de email obligatoria
- Recuperación de contraseña

### Almacenamiento

Utilizaremos el almacenamiento de Supabase para:
- Logos de restaurantes
- Imágenes de portada
- Imágenes de los platos del menú