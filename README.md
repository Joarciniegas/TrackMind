# TrackMind

Sistema de tracking de vehículos para dealers - Desde la subasta hasta la venta.

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
- **Fotos**: Subida de fotos del vehículo

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (pendiente)
- **Storage**: Cloudflare R2 (pendiente)

## Instalación

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Estructura

```
src/
├── app/
│   ├── page.tsx              # Lista de vehículos
│   ├── layout.tsx            # Layout principal
│   ├── globals.css           # Estilos globales
│   └── vehicle/
│       ├── new/page.tsx      # Crear vehículo
│       └── [id]/page.tsx     # Detalle vehículo
├── components/               # Componentes reutilizables
├── lib/                      # Utilidades
└── types/                    # TypeScript types
```

## TODO

### Fase 1 - MVP
- [x] Listado de vehículos con filtros
- [x] Formulario crear vehículo
- [x] Detalle con cambio de estado
- [ ] Conectar API/Database
- [ ] Subida de fotos

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

## Campos del Vehículo

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID interno |
| vin | string(6) | Últimos 6 dígitos VIN |
| stock_no | string | Número de stock |
| year | int | Año |
| make | string | Marca |
| model | string | Modelo |
| trim | string | Versión |
| color | string | Color |
| miles | int | Millaje |
| status | enum | Estado actual |
| auction | string | Subasta de origen |
| payment_method | enum | CASH / FLOORING |
| purchase_price | decimal | Precio de compra |
| transport_cost | decimal | Costo de transporte |
| recon_cost | decimal | Costo de recon |
| photo_url | string | URL de foto |
| notes | text | Notas |
| created_at | timestamp | Fecha creación |
| updated_at | timestamp | Última actualización |
