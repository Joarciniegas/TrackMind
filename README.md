# TrackMind - South Pro Motors

Sistema de tracking de vehículos personalizado para **South Pro Motors**.

**URL:** https://trackmind.joarciniegas.cloud

## Flujo del Vehículo

```
SUBASTA → EN TRÁNSITO → RECIBIDO → EN RECON → LISTO → EN EXHIBICIÓN → VENDIDO
                                      ↓
                              ESPERANDO PIEZAS
```

## Características

- **Mobile-First**: Diseñado para uso desde el teléfono
- **Tracking de Estados**: Seguimiento del vehículo desde compra hasta venta
- **Costos**: Control de compra, transporte y reacondicionamiento
- **Timeline**: Historial de cambios con usuario y fecha
- **Notas**: Comentarios por cualquier usuario
- **Base de Datos**: Cloudflare D1 (SQLite en el edge)

## Tech Stack

- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Cloudflare D1
- **Hosting**: Cloudflare Pages
- **Storage**: Cloudflare R2 (pendiente)

## Estructura

```
src/
├── app/
│   ├── page.tsx              # Lista de vehículos
│   ├── layout.tsx            # Layout principal
│   ├── globals.css           # Estilos globales
│   ├── api/
│   │   └── vehicles/         # API endpoints
│   │       ├── route.ts      # GET/POST /api/vehicles
│   │       └── [id]/route.ts # GET/PUT /api/vehicles/:id
│   └── vehicle/
│       ├── new/page.tsx      # Crear vehículo
│       └── [id]/page.tsx     # Detalle vehículo
└── env.d.ts                  # Types para Cloudflare
```

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
| purchase_price | REAL | Precio de compra |
| transport_cost | REAL | Costo de transporte |
| recon_cost | REAL | Costo de recon |
| photo_url | TEXT | URL de foto |
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

## Desarrollo Local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Deploy

El proyecto se despliega automáticamente a Cloudflare Pages en cada push a `main`.

**Build command:** `npx @cloudflare/next-on-pages@1`
**Output directory:** `.vercel/output/static`

## Configuración Cloudflare

### Bindings necesarios:
- **DB**: D1 database `trackmind-db`

### Compatibility flags:
- `nodejs_compat`

## TODO

### Fase 1 - MVP
- [x] Listado de vehículos con filtros
- [x] Formulario crear vehículo
- [x] Detalle con cambio de estado
- [x] Conectar API/Database (D1)
- [ ] Subida de fotos (R2)

### Fase 2
- [ ] Login/Autenticación
- [ ] Usuarios y roles
- [ ] Dashboard con métricas
- [ ] Múltiples fotos

### Fase 3
- [ ] PWA instalable
- [ ] Notificaciones push
- [ ] Reportes
- [ ] Integración con n8n

---

Desarrollado por **BizMind AI Agency** para **South Pro Motors**
