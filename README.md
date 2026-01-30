# TrackMind - South Pro Motors

Sistema de tracking de vehículos para **South Pro Motors**.

**URL:** https://trackmind.joarciniegas.cloud

## Flujo del Vehículo

```
SUBASTA → EN TRÁNSITO → RECIBIDO → EN RECON → LISTO → EN EXHIBICIÓN → VENDIDO
```

## Características

- **Mobile-First**: Diseñado para uso desde el teléfono
- **PWA**: Instalable en iOS y Android con icono personalizado
- **Google OAuth**: Autenticación segura con cuenta de Google
- **Roles de Usuario**: ADMIN, OPERADOR, VISOR (con aprobación de nuevos usuarios)
- **Tracking de Estados**: Seguimiento del vehículo desde compra hasta venta
- **Costos**: Control de compra, transporte y reacondicionamiento
- **Timeline**: Historial de cambios con usuario y fecha
- **Fotos**: Subida de fotos desde galería o cámara (almacenadas en R2)
- **Notificaciones Push**: Alertas en tiempo real (iOS 16.4+ y Android)
- **Dashboard**: Estadísticas de inventario y costos
- **Notas**: Comentarios por usuario autorizado

## Tech Stack

- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Cloudflare D1 (SQLite edge)
- **Storage**: Cloudflare R2 (fotos)
- **Hosting**: Cloudflare Pages
- **Auth**: Google OAuth 2.0

## Estructura

```
src/
├── app/
│   ├── page.tsx                    # Lista de vehículos (Home)
│   ├── layout.tsx                  # Layout con providers
│   ├── globals.css                 # Estilos globales
│   ├── login/page.tsx              # Página de login
│   ├── pending/page.tsx            # Usuarios pendientes de aprobación
│   ├── admin/page.tsx              # Administración de usuarios
│   ├── stats/page.tsx              # Dashboard de estadísticas
│   ├── config/page.tsx             # Configuración y perfil
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      # Iniciar OAuth
│   │   │   ├── callback/route.ts   # Callback de Google
│   │   │   ├── me/route.ts         # Usuario actual
│   │   │   └── logout/route.ts     # Cerrar sesión
│   │   ├── vehicles/
│   │   │   ├── route.ts            # GET/POST /api/vehicles
│   │   │   └── [id]/route.ts       # GET/PUT/DELETE /api/vehicles/:id
│   │   ├── users/route.ts          # Gestión de usuarios
│   │   ├── stats/route.ts          # Estadísticas
│   │   ├── photos/route.ts         # Subida de fotos
│   │   └── push/
│   │       ├── subscribe/route.ts  # Suscribir a push
│   │       ├── unsubscribe/route.ts # Desuscribir
│   │       └── vapid-public-key/route.ts
│   └── vehicle/
│       ├── new/page.tsx            # Crear vehículo
│       └── [id]/
│           ├── page.tsx            # Detalle vehículo
│           └── edit/page.tsx       # Editar vehículo
├── lib/
│   ├── auth.ts                     # Roles y permisos
│   ├── UserContext.tsx             # Context de autenticación
│   └── ServiceWorker.tsx           # Registro de SW y push
└── env.d.ts                        # Types para Cloudflare
public/
├── manifest.json                   # PWA manifest
├── sw.js                           # Service Worker
├── icon-192.png                    # Icono PWA
├── icon-512.png                    # Icono PWA grande
└── generate-icons.html             # Generador de iconos
```

## Roles y Permisos

| Permiso | ADMIN | OPERADOR | VISOR |
|---------|-------|----------|-------|
| Ver vehículos | ✅ | ✅ | ✅ |
| Ver precios | ✅ | ✅ | ✅ |
| Cambiar estado | ✅ | ✅ | ❌ |
| Agregar notas | ✅ | ✅ | ❌ |
| Crear vehículos | ✅ | ❌ | ❌ |
| Editar vehículos | ✅ | ❌ | ❌ |
| Eliminar vehículos | ✅ | ❌ | ❌ |
| Editar precios | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |

*Usuarios nuevos entran como PENDIENTE y deben ser aprobados por un ADMIN.*

## Base de Datos (D1)

### Tabla: vehicles
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID interno (auto) |
| vin | TEXT | Últimos 6 dígitos VIN |
| stock_no | TEXT | Número de stock |
| year | INTEGER | Año |
| make | TEXT | Marca |
| model | TEXT | Modelo |
| trim | TEXT | Versión |
| color | TEXT | Color |
| miles | INTEGER | Millaje |
| status | TEXT | Estado actual |
| auction | TEXT | Subasta de origen |
| payment_method | TEXT | CASH / FLOORING |
| flooring_company | TEXT | Compañía de flooring |
| purchase_price | REAL | Precio de compra |
| transport_cost | REAL | Costo de transporte |
| recon_cost | REAL | Costo de recon |
| photo_url | TEXT | URL de foto en R2 |
| notes | TEXT | Notas |
| created_at | DATETIME | Fecha creación |
| updated_at | DATETIME | Última actualización |

### Tabla: timeline
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID interno (auto) |
| vehicle_id | INTEGER | FK a vehicles |
| status | TEXT | Estado en ese momento |
| user_name | TEXT | Usuario que hizo el cambio |
| note | TEXT | Nota del cambio |
| created_at | DATETIME | Fecha del cambio |

### Tabla: users
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID interno (auto) |
| email | TEXT | Email de Google |
| name | TEXT | Nombre |
| picture | TEXT | URL foto de perfil |
| role | TEXT | ADMIN/OPERADOR/VISOR/PENDIENTE |
| created_at | DATETIME | Fecha registro |
| last_login | DATETIME | Último acceso |

### Tabla: sessions
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | TEXT | ID de sesión (UUID) |
| user_id | INTEGER | FK a users |
| expires_at | DATETIME | Fecha expiración |
| created_at | DATETIME | Fecha creación |

### Tabla: push_subscriptions
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID interno (auto) |
| user_id | INTEGER | FK a users |
| endpoint | TEXT | URL del push service |
| p256dh | TEXT | Clave pública |
| auth | TEXT | Token de autenticación |
| created_at | DATETIME | Fecha suscripción |

## Variables de Entorno (Cloudflare)

| Variable | Tipo | Descripción |
|----------|------|-------------|
| GOOGLE_CLIENT_ID | Plaintext | Client ID de Google OAuth |
| GOOGLE_CLIENT_SECRET | Secret | Client Secret de Google OAuth |
| VAPID_PUBLIC_KEY | Plaintext | Clave pública VAPID para push |
| VAPID_PRIVATE_KEY | Secret | Clave privada VAPID |
| VAPID_EMAIL | Plaintext | Email para VAPID |
| NODE_VERSION | Plaintext | 18 |

## Bindings (Cloudflare)

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| DB | D1 Database | Base de datos principal |
| PHOTOS | R2 Bucket | Almacenamiento de fotos |

## Desarrollo Local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Deploy

El proyecto se despliega automáticamente a Cloudflare Pages en cada push a `main`.

- **Build command:** `npx @cloudflare/next-on-pages@1`
- **Output directory:** `.vercel/output/static`
- **Compatibility flags:** `nodejs_compat`

## Generar VAPID Keys

```bash
npx web-push generate-vapid-keys
```

## Estado del Proyecto

### Completado
- [x] Listado de vehículos con filtros
- [x] Formulario crear/editar vehículo
- [x] Detalle con cambio de estado
- [x] Base de datos D1
- [x] Subida de fotos (R2)
- [x] Google OAuth
- [x] Sistema de roles
- [x] Aprobación de usuarios
- [x] Dashboard de estadísticas
- [x] PWA instalable
- [x] Notificaciones push
- [x] Timeline de cambios

### Pendiente
- [ ] Múltiples fotos por vehículo
- [ ] Reportes exportables
- [ ] Integración con n8n
- [ ] Notificaciones automáticas por cambio de estado

---

Desarrollado por **BizMind AI Agency** para **South Pro Motors**
