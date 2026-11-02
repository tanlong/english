import { createHash } from "node:crypto";
const buckets = new Map<string, { count: number; resetAt: number }>();
const windowMs = 900_000;
const maxBuckets = 5000;
// ponytail: per-process budgets; use a shared gateway quota before scaling out.
export function providerQuota(request: Request, service: string, limit = 60, now = Date.now()) {
  const cookie = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)english_learner=([a-f0-9]{64})(?:;|$)/)?.[1];
  const id = cookie ? createHash("sha256").update(cookie).digest("hex") : "anonymous";
  const key = `${service}:${id}`;
  for (const [name, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(name);
  // Cookies are anonymous and can be rotated. The aggregate budget never uses client identity.
  const configured = Number(process.env.PROVIDER_GLOBAL_LIMIT);
  const globalLimit = Number.isSafeInteger(configured) && configured > 0 ? configured : 600;
  const aggregate = buckets.get("global") ?? { count: 0, resetAt: now + windowMs };
  const bucket = buckets.get(key) ?? { count: 0, resetAt: now + windowMs };
  const exhausted = aggregate.count >= globalLimit ? aggregate : bucket;
  if (aggregate.count >= globalLimit || bucket.count >= limit || buckets.size >= maxBuckets)
    return Response.json(
      {
        error: "Bạn đã dùng hết lượt xử lý trong 15 phút. Hãy thử lại sau hoặc luyện bằng câu mẫu.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((exhausted.resetAt - now) / 1000))),
          "Cache-Control": "no-store",
        },
      },
    );
  bucket.count++;
  aggregate.count++;
  buckets.set(key, bucket);
  buckets.set("global", aggregate);
  return null;
}
