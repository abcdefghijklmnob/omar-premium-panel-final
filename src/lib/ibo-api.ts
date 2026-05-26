import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://gsfzfsylnrirrhdtvjmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZnpmc3lsbnJpcnJoZHR2am1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NzY5MjgsImV4cCI6MjA5NTE1MjkyOH0.31h7kDHADeH_65pgvVyrmvZl219OUV6WMMEL5jQBi1U";
const RPC_BASE_URL = `${SUPABASE_URL}/rest/v1/rpc`;

export type AdminCredentials = {
  username: string;
  password: string;
};

export type IboCounts = {
  devices: number;
  active_devices: number;
  expired_devices: number;
  blocked_devices: number;
  connected_users: number;
  packages: number;
  channels: number;
  movies: number;
  series: number;
};

export type IboDevice = {
  id: string;
  mac_address: string;
  device_key: string;
  user_id: string | null;
  username: string | null;
  package_id: number | null;
  package_name: string | null;
  expiry_date: string | null;
  status: string;
  last_seen: string | null;
  last_ip: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type IboPackage = {
  id: number;
  name: string;
  description: string | null;
  duration_days: number;
  max_connections: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_count: number;
  device_count: number;
  live_stream_ids: number[];
  vod_stream_ids: number[];
  series_ids: number[];
};

export type IboPanelUser = {
  id: string;
  username: string;
  status: string;
  start_date: string;
  expiry_date: string;
  max_connections: number;
  notes: string | null;
  created_at: string;
  subscription_id: string | null;
  subscription_status: string;
  package_id: number | null;
  package_name: string | null;
  subscription_expiry_date: string | null;
  subscription_notes: string | null;
  device_count: number;
  playlist_url: string | null;
  playlist_generated_at: string | null;
  playlist_channel_count: number | null;
};

export type IboSubscription = {
  id: string;
  user_id: string;
  username: string;
  package_id: number | null;
  package_name: string | null;
  status: string;
  expiry_date: string | null;
  max_connections: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type IboPlaylist = {
  id: string;
  user_id: string;
  username: string;
  bucket_name: string;
  storage_path: string;
  public_url: string;
  channel_count: number;
  generated_at: string;
  updated_at: string;
};

export type IboSettings = {
  app_name: string;
  logo_url: string;
  api_base_url: string;
  default_epg_url: string;
  theme_mode: string;
  primary_color: string;
  secondary_color: string;
  maintenance_mode: boolean;
  notifications_enabled: boolean;
};

export type IboLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  message: string;
  created_at: string;
};

export type IboContentRef = {
  id: number;
  name?: string;
  title?: string;
  logo_url?: string | null;
  poster_url?: string | null;
  category_name: string;
};

export type IboPanelData = {
  counts: IboCounts;
  devices: IboDevice[];
  packages: IboPackage[];
  users: IboPanelUser[];
  subscriptions: IboSubscription[];
  playlists: IboPlaylist[];
  settings: IboSettings;
  logs: IboLog[];
  content: {
    live: IboContentRef[];
    vod: IboContentRef[];
    series: IboContentRef[];
  };
};

async function callRpc<T>(functionName: string, payload: Record<string, unknown>): Promise<T> {
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
    throw new Error(data?.message || data?.error || data?.details || text || "Request failed");
  }

  return data as T;
}

function withAdmin(credentials: AdminCredentials, payload: Record<string, unknown>) {
  return {
    p_username: credentials.username,
    p_password: credentials.password,
    ...payload,
  };
}

export function getIboPanelData(credentials: AdminCredentials) {
  return callRpc<IboPanelData>("admin_ibo_panel_data", withAdmin(credentials, {}));
}

export function saveIboPackage(
  credentials: AdminCredentials,
  payload: {
    id?: number;
    name: string;
    description?: string;
    duration_days: number;
    max_connections: number;
    status: string;
    notes?: string;
    live_stream_ids: number[];
    vod_stream_ids: number[];
    series_ids: number[];
  },
) {
  return callRpc("admin_save_ibo_package", withAdmin(credentials, {
    p_id: payload.id ?? null,
    p_name: payload.name,
    p_description: payload.description ?? "",
    p_duration_days: payload.duration_days,
    p_max_connections: payload.max_connections,
    p_status: payload.status,
    p_notes: payload.notes ?? "",
    p_live_stream_ids: payload.live_stream_ids,
    p_vod_stream_ids: payload.vod_stream_ids,
    p_series_ids: payload.series_ids,
  }));
}

export function deleteIboPackage(credentials: AdminCredentials, id: number) {
  return callRpc("admin_delete_ibo_package", withAdmin(credentials, { p_id: id }));
}

export function saveIboDevice(
  credentials: AdminCredentials,
  payload: {
    id?: string;
    mac_address: string;
    device_key: string;
    user_id?: string | null;
    package_id?: number | null;
    status: string;
    expiry_date?: string | null;
    last_seen?: string | null;
    last_ip?: string;
    location?: string;
    notes?: string;
  },
) {
  return callRpc("admin_save_ibo_device", withAdmin(credentials, {
    p_id: payload.id ?? null,
    p_mac_address: payload.mac_address,
    p_device_key: payload.device_key,
    p_user_id: payload.user_id ?? null,
    p_package_id: payload.package_id ?? null,
    p_status: payload.status,
    p_expiry_date: payload.expiry_date ?? null,
    p_last_seen: payload.last_seen ?? null,
    p_last_ip: payload.last_ip ?? "",
    p_location: payload.location ?? "",
    p_notes: payload.notes ?? "",
  }));
}

export function deleteIboDevice(credentials: AdminCredentials, id: string) {
  return callRpc("admin_delete_ibo_device", withAdmin(credentials, { p_id: id }));
}

export function saveIboUserSubscription(
  credentials: AdminCredentials,
  payload: {
    user_id: string;
    package_id?: number | null;
    status: string;
    expiry_date?: string | null;
    max_connections: number;
    notes?: string;
  },
) {
  return callRpc("admin_save_ibo_user_subscription", withAdmin(credentials, {
    p_user_id: payload.user_id,
    p_package_id: payload.package_id ?? null,
    p_status: payload.status,
    p_expiry_date: payload.expiry_date ?? null,
    p_max_connections: payload.max_connections,
    p_notes: payload.notes ?? "",
  }));
}

export function saveIboUser(
  credentials: AdminCredentials,
  payload: {
    user_id: string;
    status: string;
    expiry_date?: string | null;
    max_connections: number;
    notes?: string;
  },
) {
  return callRpc("admin_save_ibo_user", withAdmin(credentials, {
    p_user_id: payload.user_id,
    p_account_status: payload.status,
    p_expiry_date: payload.expiry_date ?? null,
    p_max_connections: payload.max_connections,
    p_notes: payload.notes ?? "",
  }));
}

export function saveIboSettings(credentials: AdminCredentials, payload: IboSettings) {
  return callRpc<IboSettings>("admin_save_ibo_settings", withAdmin(credentials, {
    p_app_name: payload.app_name,
    p_logo_url: payload.logo_url,
    p_api_base_url: payload.api_base_url,
    p_default_epg_url: payload.default_epg_url,
    p_theme_mode: payload.theme_mode,
    p_primary_color: payload.primary_color,
    p_secondary_color: payload.secondary_color,
    p_maintenance_mode: payload.maintenance_mode,
    p_notifications_enabled: payload.notifications_enabled,
  }));
}

export async function generateIboPlaylist(credentials: AdminCredentials, targetUsername: string) {
  const { data, error } = await supabase.functions.invoke<{ playlist?: IboPlaylist; error?: string }>("generate-ibo-playlist", {
    body: {
      adminUsername: credentials.username,
      adminPassword: credentials.password,
      targetUsername,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to generate IBO playlist");
  }

  if (!data?.playlist) {
    throw new Error(data?.error || "Failed to generate IBO playlist");
  }

  return data.playlist;
}
