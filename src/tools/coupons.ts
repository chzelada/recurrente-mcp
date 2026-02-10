import { z } from "zod";
import { recurrenteRequest } from "../client.js";

export const createCouponSchema = z.object({
  name: z.string().describe("Coupon name"),
  amount_off_in_cents: z
    .number()
    .optional()
    .describe("Fixed discount in cents (mutually exclusive with percent_off)"),
  percent_off: z
    .number()
    .optional()
    .describe("Percentage discount 1-100 (mutually exclusive with amount_off_in_cents)"),
  currency: z
    .string()
    .optional()
    .describe("Currency code (required if amount_off_in_cents)"),
  duration: z
    .enum(["once", "forever"])
    .describe("once = single use, forever = all recurring charges"),
  max_redemptions: z
    .number()
    .optional()
    .describe("Maximum number of times this coupon can be redeemed"),
  redeem_by: z
    .string()
    .optional()
    .describe("Expiration date (ISO 8601)"),
});

export async function createCoupon(args: z.infer<typeof createCouponSchema>) {
  return recurrenteRequest("/api/coupons", {
    method: "POST",
    body: { coupon: args },
  });
}

export const listCouponsSchema = z.object({
  page: z.number().optional().describe("Page number for pagination"),
});

export async function listCoupons(args: z.infer<typeof listCouponsSchema>) {
  return recurrenteRequest("/api/coupons", {
    params: { page: args.page?.toString() },
  });
}

export const getCouponSchema = z.object({
  id: z.string().describe("Coupon ID"),
});

export async function getCoupon(args: z.infer<typeof getCouponSchema>) {
  return recurrenteRequest(`/api/coupons/${args.id}`);
}

export const updateCouponSchema = z.object({
  id: z.string().describe("Coupon ID"),
  name: z.string().optional().describe("Updated coupon name"),
  max_redemptions: z.number().optional().describe("Updated max redemptions"),
  redeem_by: z.string().optional().describe("Updated expiration date"),
});

export async function updateCoupon(args: z.infer<typeof updateCouponSchema>) {
  const { id, ...coupon } = args;
  return recurrenteRequest(`/api/coupons/${id}`, {
    method: "PATCH",
    body: { coupon },
  });
}

export const deleteCouponSchema = z.object({
  id: z.string().describe("Coupon ID"),
});

export async function deleteCoupon(args: z.infer<typeof deleteCouponSchema>) {
  return recurrenteRequest(`/api/coupons/${args.id}`, {
    method: "DELETE",
  });
}
