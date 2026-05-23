import { normalizeBaseUrl } from "./utils.ts";

export async function resolveBaseUrl(supabase: any, req: Request) {
  const { data } = await supabase.from("settings").select("value").eq("key", "base_url").maybeSingle();
  const configuredBaseUrl = data?.value?.trim();

  if (configuredBaseUrl && !configuredBaseUrl.includes("YOUR-DOMAIN")) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host") ?? new URL(req.url).host;
  const proto = forwardedProto ?? "https";

  return `${proto}://${host}`;
}
