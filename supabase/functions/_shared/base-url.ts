import { normalizeBaseUrl } from "./utils.ts";

export const DEFAULT_PUBLIC_BASE_URL = "https://YOUR-DOMAIN.com";

export async function resolveBaseUrl(supabase: any) {
  const { data } = await supabase.from("settings").select("value").eq("key", "base_url").maybeSingle();
  const configuredBaseUrl = data?.value?.trim();

  if (configuredBaseUrl && !configuredBaseUrl.includes("YOUR-DOMAIN")) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  return DEFAULT_PUBLIC_BASE_URL;
}
