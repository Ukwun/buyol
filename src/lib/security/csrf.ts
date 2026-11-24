import "server-only";

export function assertSameOrigin(request: Request): void {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  let refererOrigin: string | null = null;
  try {
    refererOrigin = referer ? new URL(referer).origin : null;
  } catch {
    refererOrigin = null;
  }
  const suppliedOrigin = origin ?? refererOrigin;

  if (!suppliedOrigin || suppliedOrigin !== requestOrigin) {
    throw new Error("Cross-site request rejected.");
  }
}
