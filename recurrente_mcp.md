# Recurrente MCP Server — Reference Guide

Toda la info necesaria para construir un MCP server para la API de Recurrente (procesador de pagos guatemalteco).

## API Base

```
Base URL: https://app.recurrente.com
```

## Autenticacion

Dos headers estáticos en CADA request:

```
Content-Type: application/json
X-PUBLIC-KEY: pk_test_... | pk_live_...
X-SECRET-KEY: sk_test_... | sk_live_...
```

No hay OAuth, no hay Bearer tokens. Solo estos dos headers.

## Endpoints Conocidos

### 1. Crear Producto

```
POST /api/products/
```

**IMPORTANTE**: Usa convención Rails de nested attributes. Los precios van DENTRO del objeto `product` como `prices_attributes`. Crear precios por separado falla con "prices no puede estar en blanco".

**Request body**:
```json
{
  "product": {
    "name": "Plan Mensual - Ad Altare",
    "description": "Suscripcion mensual para gestion de servidores de misa",
    "currency": "GTQ",
    "prices_attributes": [
      {
        "amount_in_cents": 25000,
        "currency": "GTQ",
        "charge_type": "recurring",
        "billing_interval": "month",
        "billing_interval_count": 1,
        "free_trial_enabled": true,
        "free_trial_interval": "month",
        "free_trial_interval_count": 1
      }
    ]
  }
}
```

**Response** (200):
```json
{
  "id": "prod_abc123",
  "name": "Plan Mensual - Ad Altare",
  "description": "...",
  "currency": "GTQ",
  "prices": [
    {
      "id": "price_xyz789",
      "amount_in_cents": 25000,
      "currency": "GTQ",
      "charge_type": "recurring",
      "billing_interval": "month",
      "billing_interval_count": 1,
      "free_trial_enabled": true,
      "free_trial_interval": "month",
      "free_trial_interval_count": 1
    }
  ]
}
```

**Nota**: El `prices[0].id` es lo que se usa como `price_id` en los checkouts.

**Campos `charge_type` conocidos**: `"recurring"` (probablemente también `"one_time"`)
**Campos `billing_interval` conocidos**: `"month"` (probablemente también `"year"`, `"week"`)

---

### 2. Crear Checkout (sesion de pago)

```
POST /api/checkouts/
```

**Request body**:
```json
{
  "items": [
    {
      "price_id": "price_xyz789",
      "quantity": 1
    }
  ],
  "success_url": "https://example.com/success",
  "cancel_url": "https://example.com/cancel",
  "metadata": {
    "tenant_id": "uuid-here",
    "tenant_slug": "mi-parroquia",
    "tenant_name": "Parroquia San Pedro"
  }
}
```

**Response** (200):
```json
{
  "id": "chk_abc123",
  "checkout_url": "https://app.recurrente.com/s/checkout/chk_abc123",
  "status": "open",
  "subscription_id": null,
  "user_id": null
}
```

**Notas**:
- `checkout_url` es el link que se le da al cliente para que pague
- `metadata` es un objeto libre (key-value strings), se retorna en los webhooks
- `items` es un array — soporta múltiples items por checkout
- `subscription_id` y `user_id` se populan después de que el pago se completa

---

### 3. Obtener Estado de Checkout

```
GET /api/checkouts/{checkoutId}
```

**Response** (200):
```json
{
  "id": "chk_abc123",
  "checkout_url": "https://app.recurrente.com/s/checkout/chk_abc123",
  "status": "completed",
  "subscription_id": "sub_def456",
  "user_id": "usr_ghi789"
}
```

**Campos de status conocidos**: `"open"`, `"completed"` (probablemente más)

**Nota**: `user_id` es el ID del cliente en Recurrente (customer ID).

---

### 4. Obtener Suscripcion

```
GET /api/subscriptions/{subscriptionId}
```

**Response** (200):
```json
{
  "id": "sub_def456",
  "status": "active",
  "current_period_end": "2025-07-15T00:00:00.000Z",
  "user_id": "usr_ghi789"
}
```

**Campos de status conocidos**: `"active"`, `"past_due"`, `"paused"`, `"cancelled"`

---

### 5. Cancelar Suscripcion

```
DELETE /api/subscriptions/{subscriptionId}
```

**Response**: 200 OK (body no documentado, posiblemente vacío o la suscripción actualizada)

---

## Endpoints Probablemente Existentes (no usados en nuestro proyecto)

Basado en que es una API REST estándar tipo Rails, muy probablemente existen:

| Endpoint | Método | Descripción probable |
|----------|--------|---------------------|
| `/api/products/` | GET | Listar productos |
| `/api/products/{id}` | GET | Detalle de producto |
| `/api/products/{id}` | PUT/PATCH | Actualizar producto |
| `/api/products/{id}` | DELETE | Eliminar producto |
| `/api/subscriptions/` | GET | Listar suscripciones |
| `/api/checkouts/` | GET | Listar checkouts |
| `/api/customers/` o `/api/users/` | GET | Listar clientes |
| `/api/customers/{id}` | GET | Detalle de cliente |
| `/api/refunds/` | POST | Crear reembolso |
| `/api/refunds/{id}` | GET | Detalle de reembolso |
| `/api/prices/` | GET | Listar precios |
| `/api/prices/{id}` | GET | Detalle de precio |

**Nota**: El campo `user_id` en las responses sugiere que el modelo de "cliente" en Recurrente se llama internamente "user".

---

## Webhooks (Svix)

Recurrente usa **Svix** para enviar webhooks. No los envía directamente — pasa por la infraestructura de Svix.

### Headers del Webhook

```
svix-id: msg_abc123
svix-timestamp: 1234567890
svix-signature: v1,base64signature1 v1,base64signature2
```

### Verificacion de Firma

```
Secret format: whsec_<base64-encoded-key>
```

**Algoritmo**:
1. Decodificar el secret: quitar prefijo `whsec_`, base64-decode el resto
2. Construir el signed content: `"${svix-id}.${svix-timestamp}.${rawBody}"`
3. Calcular HMAC-SHA256 con el secret decodificado
4. Base64-encode el resultado
5. Comparar contra cada firma en `svix-signature` (separadas por espacio, quitar prefijo `v1,`)
6. Usar timing-safe comparison
7. Validar que el timestamp esté dentro de 5 minutos del tiempo actual (anti-replay)

**Pseudocodigo**:
```typescript
const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
const expectedSig = crypto
  .createHmac("sha256", secretBytes)
  .update(signedContent)
  .digest("base64");

// svix-signature puede tener múltiples firmas separadas por espacio
const signatures = svixSignature.split(" ");
for (const sig of signatures) {
  const sigValue = sig.replace(/^v1,/, "");
  if (crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sigValue))) {
    return true; // Válida
  }
}
```

### Eventos Conocidos

| Evento | Descripcion | Campos en `data` |
|--------|-------------|------------------|
| `subscription.create` | Suscripción creada | `id`, `user_id`, `metadata` |
| `subscription.cancel` | Suscripción cancelada | `subscription_id`, `metadata` |
| `subscription.past_due` | Pago atrasado | `subscription_id`, `metadata` |
| `subscription.paused` | Suscripción pausada | `subscription_id`, `metadata` |
| `subscription.unpause` | Suscripción reanudada | `subscription_id`, `metadata` |
| `payment_intent.succeeded` | Pago exitoso | `subscription_id`, `checkout_id`, `metadata` |
| `payment_intent.failed` | Pago fallido | `subscription_id`, `checkout_id`, `metadata` |
| `setup_intent.succeeded` | Tokenización de tarjeta exitosa | `checkout_id`, `metadata` |
| `setup_intent.cancelled` | Tokenización cancelada | `checkout_id`, `metadata` |
| `refund.create` | Reembolso creado | `id`, `metadata` |

### Body del Webhook

```json
{
  "event": "payment_intent.succeeded",
  "data": {
    "id": "pi_abc123",
    "subscription_id": "sub_def456",
    "checkout_id": "chk_xyz789",
    "user_id": "usr_ghi789",
    "metadata": {
      "tenant_id": "uuid",
      "tenant_slug": "mi-parroquia",
      "tenant_name": "Parroquia San Pedro"
    }
  }
}
```

**Nota**: Los campos en `data` varían por evento. `metadata` es lo que se envió al crear el checkout.

---

## Testing

### Tarjeta de Prueba
```
Número: 4242 4242 4242 4242
Vencimiento: Cualquier fecha futura
CVV: 123
```

### Sandbox
- Las keys de test tienen prefijo `pk_test_` y `sk_test_`
- Las keys de producción tienen prefijo `pk_live_` y `sk_live_`
- **Los webhooks NO se disparan en modo sandbox/test**. Solo en producción.

---

## MCP Tools Sugeridos

### Tools principales (basados en endpoints confirmados)

```
recurrente_create_product       — Crear producto con precios
recurrente_create_checkout      — Crear sesión de pago
recurrente_get_checkout         — Obtener estado de checkout
recurrente_get_subscription     — Obtener detalles de suscripción
recurrente_cancel_subscription  — Cancelar suscripción
```

### Tools adicionales (explorar si existen)

```
recurrente_list_products        — Listar productos
recurrente_get_product          — Detalle de producto
recurrente_list_subscriptions   — Listar suscripciones
recurrente_list_checkouts       — Listar checkouts
recurrente_list_customers       — Listar clientes
```

### Tool de conveniencia

```
recurrente_verify_webhook       — Verificar firma Svix de un webhook payload
```

---

## Configuracion del MCP

### Variables de Entorno Necesarias

```bash
RECURRENTE_PUBLIC_KEY=pk_test_...   # o pk_live_...
RECURRENTE_SECRET_KEY=sk_test_...   # o sk_live_...
# Opcional:
RECURRENTE_BASE_URL=https://app.recurrente.com  # default
```

### Patron de Request (helper reutilizable)

```typescript
async function recurrenteFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-PUBLIC-KEY": publicKey,
      "X-SECRET-KEY": secretKey,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Recurrente API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}
```

---

## Gotchas

1. **`prices_attributes` no `prices`**: Al crear productos, el campo se llama `prices_attributes` (convención Rails nested attributes). Usar `prices` falla silenciosamente o con error "prices no puede estar en blanco"
2. **`user_id` = customer ID**: Recurrente llama "user" a lo que normalmente sería "customer"
3. **Webhooks solo en producción**: El modo sandbox no dispara eventos webhook
4. **Moneda GTQ**: Guatemala Quetzal. Los montos van en centavos (`amount_in_cents: 25000` = Q250.00)
5. **API estilo Rails**: Responses probablemente usan snake_case, endpoints terminan en `/` (trailing slash)
6. **Svix para webhooks**: No es un sistema propio de Recurrente — usan Svix como infraestructura, con el formato estándar de Svix para firmas
7. **Errores devuelven texto**: Cuando la API falla, el body puede ser texto plano o JSON con errores (no siempre consistente)
