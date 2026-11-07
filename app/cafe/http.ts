import { limitedBody, isBodyTooLarge } from "../api/request-body.ts";
export class CafeError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function fail(status: number, code: string, message: string): never {
  throw new CafeError(status, code, message);
}
export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Request-Id": crypto.randomUUID(), ...extraHeaders },
  });
}
export function errorResponse(error: unknown) {
  return error instanceof CafeError
    ? json(
        { code: error.code, error: error.message },
        error.status,
        error.status === 429 ? { "Retry-After": "60" } : {},
      )
    : json(
        {
          code: "SERVICE_UNAVAILABLE",
          error: "Chưa kết nối được. Nội dung đã lưu vẫn được giữ; hãy thử lại.",
        },
        503,
      );
}
export async function bodyOf(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = await limitedBody(request, 16_000).json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch (error) {
    return fail(
      isBodyTooLarge(error) ? 413 : 400,
      "INVALID_INPUT",
      "Dữ liệu không hợp lệ hoặc quá dài.",
    );
  }
}
export function textField(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}
export function tenantId() {
  return process.env.CAFE_TENANT_ID || "local";
}
