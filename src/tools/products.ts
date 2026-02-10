import { z } from "zod";
import { recurrenteRequest } from "../client.js";

const PriceAttributeSchema = z.object({
  amount_in_cents: z.number().describe("Price in cents (e.g. 10000 = Q100.00)"),
  currency: z.string().default("GTQ").describe("Currency code (default: GTQ)"),
  charge_type: z.enum(["one_time", "recurring"]).describe("one_time or recurring"),
  recurring_interval: z
    .enum(["month", "week", "year"])
    .optional()
    .describe("Interval for recurring charges"),
  recurring_interval_count: z
    .number()
    .optional()
    .describe("Number of intervals between charges"),
  free_trial_days: z.number().optional().describe("Free trial period in days"),
});

export const createProductSchema = z.object({
  name: z.string().describe("Product name"),
  description: z.string().optional().describe("Product description"),
  prices_attributes: z
    .array(PriceAttributeSchema)
    .min(1)
    .describe("At least one price is required"),
});

export async function createProduct(args: z.infer<typeof createProductSchema>) {
  return recurrenteRequest("/api/products/", {
    method: "POST",
    body: { product: args },
  });
}

export const listProductsSchema = z.object({
  page: z.number().optional().describe("Page number for pagination"),
});

export async function listProducts(args: z.infer<typeof listProductsSchema>) {
  return recurrenteRequest("/api/products", {
    params: { page: args.page?.toString() },
  });
}

export const getProductSchema = z.object({
  id: z.string().describe("Product ID"),
});

export async function getProduct(args: z.infer<typeof getProductSchema>) {
  return recurrenteRequest(`/api/products/${args.id}`);
}

export const updateProductSchema = z.object({
  id: z.string().describe("Product ID"),
  name: z.string().optional().describe("New product name"),
  description: z.string().optional().describe("New product description"),
  prices_attributes: z
    .array(PriceAttributeSchema)
    .optional()
    .describe("Updated prices"),
});

export async function updateProduct(args: z.infer<typeof updateProductSchema>) {
  const { id, ...product } = args;
  return recurrenteRequest(`/api/products/${id}`, {
    method: "PATCH",
    body: { product },
  });
}

export const deleteProductSchema = z.object({
  id: z.string().describe("Product ID"),
});

export async function deleteProduct(args: z.infer<typeof deleteProductSchema>) {
  return recurrenteRequest(`/api/products/${args.id}`, {
    method: "DELETE",
  });
}
