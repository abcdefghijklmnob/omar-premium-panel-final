const SUPABASE_URL = "https://gsfzfsylnrirrhdtvjmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZnpmc3lsbnJpcnJoZHR2am1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NzY5MjgsImV4cCI6MjA5NTE1MjkyOH0.31h7kDHADeH_65pgvVyrmvZl219OUV6WMMEL5jQBi1U";
const RPC_BASE_URL = `${SUPABASE_URL}/rest/v1/rpc`;

export async function callRpc(functionName: string, payload: Record<string, unknown>) {
  const response = await fetch(`${RPC_BASE_URL}/${functionName}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || data?.details || "RPC request failed";
    throw new Error(errorMessage);
  }

  return data;
}

export function getRequestBaseUrl(req: any) {
  const forwardedProto = req.headers["x-forwarded-proto"] || "https";
  const forwardedHost = req.headers["x-forwarded-host"] || req.headers.host || "YOUR-DOMAIN.com";
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  return `${protocol}://${host}`.replace(/\/$/, "");
}
