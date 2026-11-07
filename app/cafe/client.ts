export class CafeRequestError extends Error {
  data: { code?: string; sessionId?: string };
  constructor(message: string, data: { code?: string; sessionId?: string }) {
    super(message);
    this.data = data;
  }
}
export async function cafeRequest<T>(
  path: string,
  body?: unknown,
  method = body ? "POST" : "GET",
  token?: string,
): Promise<T> {
  const response = await fetch(path, {
    method,
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new CafeRequestError(data.error || "Chưa kết nối được. Hãy thử lại.", data);
  return data as T;
}
