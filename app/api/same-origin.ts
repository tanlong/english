export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin) return false;
    const target = new URL(request.url);
    return (
      parsed.protocol === target.protocol &&
      (parsed.origin === target.origin || parsed.host === request.headers.get("host"))
    );
  } catch {
    return false;
  }
}
