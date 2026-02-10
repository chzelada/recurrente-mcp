import { z } from "zod";
import { recurrenteRequest } from "../client.js";

export const createCustomerSchema = z.object({
  email: z.string().describe("Customer email address"),
  full_name: z.string().optional().describe("Customer full name"),
});

export async function createCustomer(args: z.infer<typeof createCustomerSchema>) {
  return recurrenteRequest("/api/customers", {
    method: "POST",
    body: args,
  });
}

export const listCustomersSchema = z.object({
  page: z.number().optional().describe("Page number for pagination"),
});

export async function listCustomers(args: z.infer<typeof listCustomersSchema>) {
  return recurrenteRequest("/api/customers", {
    params: { page: args.page?.toString() },
  });
}

export const getCustomerSchema = z.object({
  id: z.string().describe("Customer ID"),
});

export async function getCustomer(args: z.infer<typeof getCustomerSchema>) {
  return recurrenteRequest(`/api/customers/${args.id}`);
}

export const updateCustomerSchema = z.object({
  id: z.string().describe("Customer ID"),
  full_name: z.string().optional().describe("Updated full name"),
  email: z.string().optional().describe("Updated email"),
});

export async function updateCustomer(args: z.infer<typeof updateCustomerSchema>) {
  const { id, ...body } = args;
  return recurrenteRequest(`/api/customers/${id}`, {
    method: "PUT",
    body,
  });
}
