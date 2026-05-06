// Server-side proxy in front of the Wise AI cloud (api.rouast.com).
//
// Why: the Wise AI Web SDK's REST client appends `/file`, `/stream`, and
// `/resolve-model` to whatever `proxyUrl` you give it. Pointing it at this
// route lets us inject `WISEAI_API_KEY` server-side instead of shipping it
// in the client bundle.
//
// Endpoints handled:
//   GET  /api/wiseai-proxy/resolve-model[?model=...]
//   POST /api/wiseai-proxy/file           (JSON body)
//   POST /api/wiseai-proxy/stream         (binary, x-encoding: gzip, X-* metadata)
//
// All requests forward to https://api.rouast.com/vitallens-v3/<path>.

import { NextRequest } from "next/server";

export const runtime = "nodejs";
// Stream payloads can be large (compressed video frames). Disable response
// caching and bump the body parser ceiling.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UPSTREAM_BASE =
  process.env.WISEAI_UPSTREAM?.replace(/\/$/, "") ??
  "https://api.rouast.com/vitallens-v3";

// Headers we forward upstream. The SDK puts metadata in many X-* keys for
// stream mode, so we whitelist by prefix rather than enumerate every one.
function buildForwardHeaders(req: NextRequest, apiKey: string): Headers {
  const out = new Headers();
  out.set("x-api-key", apiKey);
  for (const [k, v] of req.headers.entries()) {
    const kl = k.toLowerCase();
    if (kl === "content-type" || kl === "content-encoding") {
      out.set(k, v);
    } else if (kl.startsWith("x-") && kl !== "x-api-key") {
      out.set(k, v);
    }
  }
  return out;
}

async function forward(req: NextRequest, sub: string): Promise<Response> {
  const apiKey = process.env.WISEAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "WISEAI_API_KEY not configured on server." }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const upstreamUrl = new URL(`${UPSTREAM_BASE}/${sub}`);
  // Forward query parameters (resolve-model uses ?model=...)
  for (const [k, v] of req.nextUrl.searchParams.entries()) {
    upstreamUrl.searchParams.set(k, v);
  }

  const headers = buildForwardHeaders(req, apiKey);
  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    // Pass the body straight through. For binary stream uploads this avoids
    // double-buffering or transcoding.
    const body = await req.arrayBuffer();
    init.body = body;
    if (!headers.has("content-length")) {
      headers.set("content-length", String(body.byteLength));
    }
  }

  try {
    const upstream = await fetch(upstreamUrl, init);
    const respHeaders = new Headers();
    for (const [k, v] of upstream.headers.entries()) {
      const kl = k.toLowerCase();
      // Strip hop-by-hop headers and CORS — Next will set its own.
      if (
        kl === "transfer-encoding" ||
        kl === "connection" ||
        kl === "keep-alive" ||
        kl.startsWith("access-control-")
      ) {
        continue;
      }
      respHeaders.set(k, v);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upstream fetch failed";
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return forward(req, path.join("/"));
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return forward(req, path.join("/"));
}
