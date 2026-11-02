import { expect, test } from "@playwright/test";

test("pages and APIs send security headers and preserve microphone access", async ({ request }) => {
  for (const path of ["/", "/admin", "/api/v1/lessons"]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["permissions-policy"]).toContain("microphone=(self)");
    expect(headers["x-powered-by"]).toBeUndefined();
  }
});
