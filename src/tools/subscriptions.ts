import { z } from "zod";
import { recurrenteRequest } from "../client.js";

export const listSubscriptionsSchema = z.object({
  page: z.number().optional().describe("Page number for pagination"),
});

export async function listSubscriptions(
  args: z.infer<typeof listSubscriptionsSchema>
) {
  return recurrenteRequest("/api/subscriptions", {
    params: { page: args.page?.toString() },
  });
}

export const getSubscriptionSchema = z.object({
  id: z.string().describe("Subscription ID"),
});

export async function getSubscription(
  args: z.infer<typeof getSubscriptionSchema>
) {
  return recurrenteRequest(`/api/subscriptions/${args.id}`);
}

export const pauseSubscriptionSchema = z.object({
  id: z.string().describe("Subscription ID"),
  act: z.enum(["pause", "unpause"]).describe("Action: pause or unpause"),
});

export async function pauseSubscription(
  args: z.infer<typeof pauseSubscriptionSchema>
) {
  return recurrenteRequest(`/api/subscriptions/${args.id}`, {
    method: "PATCH",
    body: { act: args.act },
  });
}

export const cancelSubscriptionSchema = z.object({
  id: z.string().describe("Subscription ID"),
});

export async function cancelSubscription(
  args: z.infer<typeof cancelSubscriptionSchema>
) {
  return recurrenteRequest(`/api/subscriptions/${args.id}`, {
    method: "DELETE",
  });
}
