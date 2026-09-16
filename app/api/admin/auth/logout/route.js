import { clearSessionCookie } from "@/lib/auth";
import { sameOrigin, forbidden } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!sameOrigin(request)) return forbidden();

  await clearSessionCookie();

  return Response.json(
    { ok: true },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
