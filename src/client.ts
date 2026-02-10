import { getConfig } from "./config.js";

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | undefined>;
}

export async function recurrenteRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { publicKey, secretKey, baseUrl } = getConfig();
  const { method = "GET", body, params } = options;

  const url = new URL(path, baseUrl);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
  }

  const headers: Record<string, string> = {
    "X-PUBLIC-KEY": publicKey,
    "X-SECRET-KEY": secretKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();

  if (!res.ok) {
    let detail: string;
    try {
      const json = JSON.parse(text);
      detail = JSON.stringify(json, null, 2);
    } catch {
      detail = text;
    }
    throw new Error(`Recurrente API error ${res.status}: ${detail}`);
  }

  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
