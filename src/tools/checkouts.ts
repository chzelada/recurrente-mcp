import { z } from "zod";
import { recurrenteRequest } from "../client.js";

const CheckoutItemSchema = z.object({
  price_id: z.string().optional().describe("Price ID from a product"),
  currency: z.string().optional().describe("Currency code (e.g. GTQ)"),
  amount_in_cents: z.number().optional().describe("Amount in cents for inline items"),
  quantity: z.number().optional().describe("Quantity (default: 1)"),
  name: z.string().optional().describe("Item name (for inline items)"),
  image: z.string().optional().describe("Item image URL"),
});

export const createCheckoutSchema = z.object({
  items: z
    .array(CheckoutItemSchema)
    .min(1)
    .describe("Checkout items (use price_id OR inline amount_in_cents + currency)"),
  success_url: z.string().optional().describe("Redirect URL after successful payment"),
  cancel_url: z.string().optional().describe("Redirect URL if payment is cancelled"),
  user_id: z.string().optional().describe("Recurrente user ID"),
  customer_id: z.string().optional().describe("Customer ID to associate"),
  metadata: z
    .record(z.string())
    .optional()
    .describe("Arbitrary key-value metadata"),
  expires_at: z
    .string()
    .optional()
    .describe("Expiration datetime (ISO 8601)"),
  coupon_id: z.string().optional().describe("Coupon ID to apply"),
});

export async function createCheckout(args: z.infer<typeof createCheckoutSchema>) {
  return recurrenteRequest("/api/checkouts/", {
    method: "POST",
    body: { checkout: args },
  });
}

export const listCheckoutsSchema = z.object({
  from_time: z.string().optional().describe("Filter from datetime (ISO 8601)"),
  until_time: z.string().optional().describe("Filter until datetime (ISO 8601)"),
  user_id: z.string().optional().describe("Filter by user ID"),
  page: z.number().optional().describe("Page number for pagination"),
});

export async function listCheckouts(args: z.infer<typeof listCheckoutsSchema>) {
  return recurrenteRequest("/api/checkouts", {
    params: {
      from_time: args.from_time,
      until_time: args.until_time,
      user_id: args.user_id,
      page: args.page?.toString(),
    },
  });
}

export const getCheckoutSchema = z.object({
  id: z.string().describe("Checkout ID"),
});

export async function getCheckout(args: z.infer<typeof getCheckoutSchema>) {
  return recurrenteRequest(`/api/checkouts/${args.id}`);
}

export const updateCheckoutSchema = z.object({
  id: z.string().describe("Checkout ID (must be unpaid)"),
  items: z.array(CheckoutItemSchema).optional().describe("Updated items"),
  success_url: z.string().optional().describe("New success URL"),
  cancel_url: z.string().optional().describe("New cancel URL"),
  metadata: z.record(z.string()).optional().describe("Updated metadata"),
  expires_at: z.string().optional().describe("New expiration datetime"),
});

export async function updateCheckout(args: z.infer<typeof updateCheckoutSchema>) {
  const { id, ...checkout } = args;
  return recurrenteRequest(`/api/checkouts/${id}`, {
    method: "PATCH",
    body: { checkout },
  });
}
