const DEFAULT_SUPABASE_URL = "https://gsfzfsylnrirrhdtvjmg.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZnpmc3lsbnJpcnJoZHR2am1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NzY5MjgsImV4cCI6MjA5NTE1MjkyOH0.31h7kDHADeH_65pgvVyrmvZl219OUV6WMMEL5jQBi1U";

export class RouteError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = "RouteError";
    this.status = status;
    this.details = details;
  }
}

function getSupabaseConfig() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const publishableKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new RouteError("Supabase env missing", 500, {
      required: [
        "SUPABASE_URL or VITE_SUPABASE_URL",
        "SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY",
      ],
    });
  }

  return {
    url,
    publishableKey,
    rpcBaseUrl: `${url}/rest/v1/rpc`,
  };
}

function isWebRequest(req: any) {
  return !!req && typeof req.headers?.get === "function";
}

function isNodeResponse(res: any) {
  return !!res && typeof res.status === "function";
}

function parseMaybeJson(text: string) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function callRpc(functionName: string, payload: Record<string, unknown>) {
  const { rpcBaseUrl, publishableKey } = getSupabaseConfig();

  const response = await fetch(`${rpcBaseUrl}/${functionName}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const data = parseMaybeJson(text);

  if (!response.ok) {
    throw new RouteError(
      typeof data === "object" && data !== null
        ? String((data as any).message || (data as any).error || (data as any).details || "RPC request failed")
        : typeof data === "string" && data
          ? data
          : "RPC request failed",
      response.status,
      {
        functionName,
        responseText: text.slice(0, 500),
      },
    );
  }

  return data;
}

export function getMethod(req: any) {
  return String(req?.method || "GET").toUpperCase();
}

export function getHeader(req: any, name: string) {
  if (isWebRequest(req)) {
    return req.headers.get(name) || "";
  }

  const value = req?.headers?.[name.toLowerCase()] ?? req?.headers?.[name];
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

export function getQueryParam(req: any, name: string) {
  if (req?.query && typeof req.query === "object") {
    const value = req.query[name];
    return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
  }

  const baseUrl = getRequestBaseUrl(req);
  const url = new URL(req?.url || "/", baseUrl);
  return url.searchParams.get(name) || "";
}

export async function getBody(req: any) {
  if (req?.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req?.body === "string") {
    return parseMaybeJson(req.body) || {};
  }

  if (typeof req?.json === "function") {
    try {
      return await req.json();
    } catch {
      return {};
    }
  }

  return {};
}

export function getRequestBaseUrl(req: any) {
  if (isWebRequest(req)) {
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}`.replace(/\/$/, "");
  }

  const forwardedProto = req?.headers?.["x-forwarded-proto"] || "https";
  const forwardedHost = req?.headers?.["x-forwarded-host"] || req?.headers?.host || "YOUR-DOMAIN.com";
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  return `${protocol}://${host}`.replace(/\/$/, "");
}

export function createErrorPayload(route: string, error: unknown) {
  if (error instanceof RouteError) {
    return {
      error: true,
      route,
      message: error.message,
      details: error.details ?? null,
    };
  }

  return {
    error: true,
    route,
    message: error instanceof Error ? error.message : "Unexpected error",
    details: null,
  };
}

export function sendJson(res: any, status: number, body: unknown) {
  if (isNodeResponse(res)) {
    return res.status(status).json(body);
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export function sendText(res: any, status: number, body: string, contentType = "text/plain; charset=utf-8") {
  if (isNodeResponse(res)) {
    res.status(status).setHeader("Content-Type", contentType);
    return res.send(body);
  }

  return new Response(body, {
    status,
    headers: {
      "Content-Type": contentType,
    },
  });
}

export function redirectTo(res: any, location: string, status = 302) {
  if (isNodeResponse(res)) {
    res.writeHead(status, { Location: location });
    return res.end();
  }

  return Response.redirect(location, status);
}
