// Dedicated warm-up endpoint hit by the dashboard on mount. Returns 204
// without forwarding upstream, so we pay the Vercel cold-start lambda
// init cost while the user is reading the page rather than after they
// click Start. Saves ~300 ms off Time-to-First-Estimate on cold loads.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(null, { status: 204 });
}
