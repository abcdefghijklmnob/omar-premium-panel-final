export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

export function asUnixTimestamp(dateValue: string) {
  return Math.floor(new Date(`${dateValue}T23:59:59Z`).getTime() / 1000).toString();
}

export function getServerContext(baseUrl: string) {
  const parsed = new URL(baseUrl);
  return {
    url: parsed.host,
    server_protocol: parsed.protocol.replace(":", ""),
    port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
    https_port: "443",
    rtmp_port: "0",
    timezone: "UTC",
    timestamp_now: Math.floor(Date.now() / 1000),
    time_now: new Date().toISOString(),
  };
}

export function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

export function isPublicBaseUrl(value: string) {
  try {
    const normalized = normalizeBaseUrl(value);
    const url = new URL(normalized);
    const hostname = url.hostname.toLowerCase();

    if (!(url.protocol === "http:" || url.protocol === "https:")) {
      return false;
    }

    if (url.pathname !== "" && url.pathname !== "/") {
      return false;
    }

    if (url.search || url.hash) {
      return false;
    }

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
