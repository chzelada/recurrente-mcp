#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  createProductSchema,
  createProduct,
  listProductsSchema,
  listProducts,
  getProductSchema,
  getProduct,
  updateProductSchema,
  updateProduct,
  deleteProductSchema,
  deleteProduct,
} from "./tools/products.js";

import {
  createCheckoutSchema,
  createCheckout,
  listCheckoutsSchema,
  listCheckouts,
  getCheckoutSchema,
  getCheckout,
  updateCheckoutSchema,
  updateCheckout,
} from "./tools/checkouts.js";

import {
  createCustomerSchema,
  createCustomer,
  listCustomersSchema,
  listCustomers,
  getCustomerSchema,
  getCustomer,
  updateCustomerSchema,
  updateCustomer,
} from "./tools/customers.js";

import {
  listSubscriptionsSchema,
  listSubscriptions,
  getSubscriptionSchema,
  getSubscription,
  pauseSubscriptionSchema,
  pauseSubscription,
  cancelSubscriptionSchema,
  cancelSubscription,
} from "./tools/subscriptions.js";

import {
  createCouponSchema,
  createCoupon,
  listCouponsSchema,
  listCoupons,
  getCouponSchema,
  getCoupon,
  updateCouponSchema,
  updateCoupon,
  deleteCouponSchema,
  deleteCoupon,
} from "./tools/coupons.js";

import { verifyWebhookSchema, verifyWebhook } from "./tools/webhooks.js";

const server = new McpServer({
  name: "recurrente",
  version: "1.0.0",
});

// ── Helper to wrap tool handlers ──

function toolHandler<T>(fn: (args: T) => Promise<unknown>) {
  return async (args: T) => {
    try {
      const result = await fn(args);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  };
}

// ── Products (5) ──

server.tool(
  "create_product",
  "Create a new product with one or more prices (one_time or recurring)",
  createProductSchema.shape,
  toolHandler(createProduct)
);

server.tool(
  "list_products",
  "List all products (paginated)",
  listProductsSchema.shape,
  toolHandler(listProducts)
);

server.tool(
  "get_product",
  "Get product details by ID",
  getProductSchema.shape,
  toolHandler(getProduct)
);

server.tool(
  "update_product",
  "Update a product's name, description, or prices",
  updateProductSchema.shape,
  toolHandler(updateProduct)
);

server.tool(
  "delete_product",
  "Delete a product by ID",
  deleteProductSchema.shape,
  toolHandler(deleteProduct)
);

// ── Checkouts (4) ──

server.tool(
  "create_checkout",
  "Create a checkout session (payment link). Use price_id for existing products or inline amount_in_cents + currency",
  createCheckoutSchema.shape,
  toolHandler(createCheckout)
);

server.tool(
  "list_checkouts",
  "List checkouts with optional filters (from_time, until_time, user_id, page)",
  listCheckoutsSchema.shape,
  toolHandler(listCheckouts)
);

server.tool(
  "get_checkout",
  "Get checkout details and payment status by ID",
  getCheckoutSchema.shape,
  toolHandler(getCheckout)
);

server.tool(
  "update_checkout",
  "Update an unpaid checkout (items, URLs, metadata, expiration)",
  updateCheckoutSchema.shape,
  toolHandler(updateCheckout)
);

// ── Customers (4) ──

server.tool(
  "create_customer",
  "Create a new customer with email and optional name",
  createCustomerSchema.shape,
  toolHandler(createCustomer)
);

server.tool(
  "list_customers",
  "List all customers (paginated)",
  listCustomersSchema.shape,
  toolHandler(listCustomers)
);

server.tool(
  "get_customer",
  "Get customer details by ID",
  getCustomerSchema.shape,
  toolHandler(getCustomer)
);

server.tool(
  "update_customer",
  "Update customer name or email",
  updateCustomerSchema.shape,
  toolHandler(updateCustomer)
);

// ── Subscriptions (4) ──

server.tool(
  "list_subscriptions",
  "List all subscriptions (paginated)",
  listSubscriptionsSchema.shape,
  toolHandler(listSubscriptions)
);

server.tool(
  "get_subscription",
  "Get subscription details by ID",
  getSubscriptionSchema.shape,
  toolHandler(getSubscription)
);

server.tool(
  "pause_subscription",
  "Pause or unpause a subscription (act: pause | unpause)",
  pauseSubscriptionSchema.shape,
  toolHandler(pauseSubscription)
);

server.tool(
  "cancel_subscription",
  "Cancel a subscription (irreversible)",
  cancelSubscriptionSchema.shape,
  toolHandler(cancelSubscription)
);

// ── Coupons (5) ──

server.tool(
  "create_coupon",
  "Create a discount coupon (fixed amount or percentage, once or forever)",
  createCouponSchema.shape,
  toolHandler(createCoupon)
);

server.tool(
  "list_coupons",
  "List all coupons (paginated)",
  listCouponsSchema.shape,
  toolHandler(listCoupons)
);

server.tool(
  "get_coupon",
  "Get coupon details by ID",
  getCouponSchema.shape,
  toolHandler(getCoupon)
);

server.tool(
  "update_coupon",
  "Update a coupon's name, max redemptions, or expiry",
  updateCouponSchema.shape,
  toolHandler(updateCoupon)
);

server.tool(
  "delete_coupon",
  "Delete a coupon by ID",
  deleteCouponSchema.shape,
  toolHandler(deleteCoupon)
);

// ── Utilities (1) ──

server.tool(
  "verify_webhook",
  "Verify a Recurrente/Svix webhook signature (HMAC-SHA256). Returns { valid: boolean }",
  verifyWebhookSchema.shape,
  toolHandler(verifyWebhook)
);

// ── Start server ──

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Recurrente MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
