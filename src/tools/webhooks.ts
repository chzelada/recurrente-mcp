import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";

export const verifyWebhookSchema = z.object({
  payload: z.string().describe("Raw webhook request body (string)"),
  signature: z
    .string()
    .describe("Svix-Signature header value (v1,<base64>)"),
  message_id: z.string().describe("Svix-Id header value"),
  timestamp: z.string().describe("Svix-Timestamp header value"),
  secret: z
    .string()
    .describe("Webhook signing secret from Recurrente (whsec_...)"),
});

export async function verifyWebhook(
  args: z.infer<typeof verifyWebhookSchema>
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { payload, signature, message_id, timestamp, secret } = args;

    // Svix secrets are prefixed with whsec_
    const secretBytes = Buffer.from(
      secret.startsWith("whsec_") ? secret.slice(6) : secret,
      "base64"
    );

    // Check timestamp tolerance (5 minutes)
    const ts = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > 300) {
      return { valid: false, error: "Timestamp outside tolerance (>5min)" };
    }

    // Svix signature: HMAC-SHA256 of "{msg_id}.{timestamp}.{body}"
    const toSign = `${message_id}.${timestamp}.${payload}`;
    const expected = createHmac("sha256", secretBytes)
      .update(toSign)
      .digest("base64");

    // Parse v1 signatures (header can have multiple: "v1,<sig1> v1,<sig2>")
    const signatures = signature.split(" ");
    for (const sig of signatures) {
      const parts = sig.split(",");
      if (parts[0] !== "v1" || !parts[1]) continue;

      const sigBuf = Buffer.from(parts[1], "base64");
      const expBuf = Buffer.from(expected, "base64");

      if (
        sigBuf.length === expBuf.length &&
        timingSafeEqual(sigBuf, expBuf)
      ) {
        return { valid: true };
      }
    }

    return { valid: false, error: "No matching signature found" };
  } catch (err) {
    return {
      valid: false,
      error: `Verification failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
