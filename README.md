# Recurrente MCP Server

MCP server para la API de [Recurrente](https://recurrente.com), procesador de pagos de Guatemala. Permite a Claude (y cualquier cliente MCP) gestionar productos, checkouts, clientes, suscripciones, cupones y verificar webhooks.

## Requisitos

- Node.js >= 18
- Cuenta en Recurrente con API keys ([dashboard](https://app.recurrente.com))

## Instalacion

```bash
git clone https://github.com/chzelada/recurrente-mcp.git
cd recurrente-mcp
npm install
npm run build
```

## Configuracion

Crear un archivo `.env` (o pasar las variables directamente):

```bash
RECURRENTE_PUBLIC_KEY=pk_live_xxxxxxxxxxxx
RECURRENTE_SECRET_KEY=sk_live_xxxxxxxxxxxx
# Opcional - default: https://app.recurrente.com
RECURRENTE_BASE_URL=https://app.recurrente.com
```

## Uso con Claude Desktop

Agregar al archivo de configuracion de Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "recurrente": {
      "command": "node",
      "args": ["/ruta/absoluta/a/recurrente-mcp/build/index.js"],
      "env": {
        "RECURRENTE_PUBLIC_KEY": "pk_live_xxxxxxxxxxxx",
        "RECURRENTE_SECRET_KEY": "sk_live_xxxxxxxxxxxx"
      }
    }
  }
}
```

## Uso con Claude Code

Agregar al archivo `.claude/settings.json` del proyecto o global:

```json
{
  "mcpServers": {
    "recurrente": {
      "command": "node",
      "args": ["/ruta/absoluta/a/recurrente-mcp/build/index.js"],
      "env": {
        "RECURRENTE_PUBLIC_KEY": "pk_live_xxxxxxxxxxxx",
        "RECURRENTE_SECRET_KEY": "sk_live_xxxxxxxxxxxx"
      }
    }
  }
}
```

## Tools disponibles (23)

### Productos

| Tool | Descripcion |
|------|-------------|
| `create_product` | Crear producto con uno o mas precios (one_time o recurring) |
| `list_products` | Listar productos (paginado) |
| `get_product` | Detalle de producto por ID |
| `update_product` | Actualizar nombre, descripcion o precios |
| `delete_product` | Eliminar producto |

### Checkouts

| Tool | Descripcion |
|------|-------------|
| `create_checkout` | Crear sesion de pago (por price_id o monto inline) |
| `list_checkouts` | Listar checkouts con filtros (fecha, usuario, pagina) |
| `get_checkout` | Estado y detalle de un checkout |
| `update_checkout` | Actualizar checkout no pagado |

### Clientes

| Tool | Descripcion |
|------|-------------|
| `create_customer` | Crear cliente (email, nombre) |
| `list_customers` | Listar clientes |
| `get_customer` | Detalle de cliente por ID |
| `update_customer` | Actualizar nombre o email |

### Suscripciones

| Tool | Descripcion |
|------|-------------|
| `list_subscriptions` | Listar suscripciones (paginado) |
| `get_subscription` | Detalle de suscripcion |
| `pause_subscription` | Pausar o reanudar (act: pause/unpause) |
| `cancel_subscription` | Cancelar suscripcion (irreversible) |

### Cupones

| Tool | Descripcion |
|------|-------------|
| `create_coupon` | Crear cupon (monto fijo o porcentaje) |
| `list_coupons` | Listar cupones |
| `get_coupon` | Detalle de cupon |
| `update_coupon` | Actualizar nombre, max redemptions o fecha |
| `delete_coupon` | Eliminar cupon |

### Utilidades

| Tool | Descripcion |
|------|-------------|
| `verify_webhook` | Verificar firma Svix de webhook (HMAC-SHA256) |

## Ejemplos

### Crear un producto con precio recurrente mensual

> "Crea un producto llamado 'Plan Pro' que cueste Q200 al mes"

Claude usara `create_product` con:
```json
{
  "name": "Plan Pro",
  "prices_attributes": [
    {
      "amount_in_cents": 20000,
      "currency": "GTQ",
      "charge_type": "recurring",
      "recurring_interval": "month",
      "recurring_interval_count": 1
    }
  ]
}
```

### Crear un checkout de pago unico

> "Genera un link de pago por Q150 para una consultoria"

Claude usara `create_checkout` con:
```json
{
  "items": [
    {
      "name": "Consultoria",
      "amount_in_cents": 15000,
      "currency": "GTQ",
      "quantity": 1
    }
  ],
  "success_url": "https://tusitio.com/gracias",
  "cancel_url": "https://tusitio.com/cancelado"
}
```

### Crear un checkout usando un producto existente

> "Crea un checkout para el price_id abc123"

```json
{
  "items": [
    {
      "price_id": "abc123",
      "quantity": 1
    }
  ]
}
```

### Listar checkouts de un periodo

> "Muestrame los checkouts de enero 2025"

Claude usara `list_checkouts` con:
```json
{
  "from_time": "2025-01-01T00:00:00Z",
  "until_time": "2025-01-31T23:59:59Z"
}
```

### Crear un cupon de descuento

> "Crea un cupon de 20% de descuento que se pueda usar 100 veces"

Claude usara `create_coupon` con:
```json
{
  "name": "DESCUENTO20",
  "percent_off": 20,
  "duration": "once",
  "max_redemptions": 100
}
```

### Pausar una suscripcion

> "Pausa la suscripcion sub_xxxxx"

Claude usara `pause_subscription` con:
```json
{
  "id": "sub_xxxxx",
  "act": "pause"
}
```

### Verificar un webhook

> "Verifica esta firma de webhook: ..."

Claude usara `verify_webhook` con los headers `Svix-Id`, `Svix-Timestamp`, `Svix-Signature` y el body del request.

## Desarrollo

```bash
# Compilar
npm run build

# Watch mode
npm run dev

# Probar con MCP Inspector
npx @modelcontextprotocol/inspector build/index.js
```

## Estructura del proyecto

```
src/
├── index.ts           # Entry point, registra los 23 tools
├── config.ts          # Variables de entorno
├── types.ts           # Interfaces TypeScript
├── client.ts          # Fetch helper con auth headers
└── tools/
    ├── products.ts    # CRUD productos
    ├── checkouts.ts   # CRUD checkouts
    ├── customers.ts   # CRUD clientes
    ├── subscriptions.ts # Listar, pausar, cancelar
    ├── coupons.ts     # CRUD cupones
    └── webhooks.ts    # Verificacion de firma Svix
```

## Licencia

MIT
