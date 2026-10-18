export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin) return false;
    return origin === new URL(request.url).origin || parsed.host === request.headers.get("host");
  } catch {
    return false;
  }
}
