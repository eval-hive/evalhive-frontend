import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOP_BY_HOP = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const base = process.env.INTERNAL_API_URL || "http://127.0.0.1:5000/api/";
  const target = new URL(path.join("/"), base.endsWith("/") ? base : `${base}/`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("x-forwarded-host", request.headers.get("host") || request.nextUrl.host);
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  if (process.env.INTERNAL_PROXY_SECRET) {
    headers.set("x-evalhive-proxy-secret", process.env.INTERNAL_PROXY_SECRET);
  }
  const developmentSlug = request.nextUrl.searchParams.get("organization") ||
    request.cookies.get("eval_hive_organization")?.value ||
    process.env.DEV_ORGANIZATION_SLUG ||
    process.env.NEXT_PUBLIC_DEV_ORGANIZATION_SLUG;
  if (developmentSlug) headers.set("x-organization-slug", developmentSlug);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!HOP_BY_HOP.has(key.toLowerCase()) && key.toLowerCase() !== "set-cookie") {
        responseHeaders.append(key, value);
      }
    });
    const cookieHeaders = upstream.headers.getSetCookie?.() || [];
    for (const cookie of cookieHeaders) responseHeaders.append("set-cookie", cookie);

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ error: "The API is temporarily unavailable" }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;
