export interface Config {
  publicKey: string;
  secretKey: string;
  baseUrl: string;
}

export function getConfig(): Config {
  const publicKey = process.env.RECURRENTE_PUBLIC_KEY;
  const secretKey = process.env.RECURRENTE_SECRET_KEY;
  const baseUrl = process.env.RECURRENTE_BASE_URL || "https://app.recurrente.com";

  if (!publicKey || !secretKey) {
    throw new Error(
      "Missing RECURRENTE_PUBLIC_KEY or RECURRENTE_SECRET_KEY environment variables"
    );
  }

  return { publicKey, secretKey, baseUrl };
}
