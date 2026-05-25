import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://gsfzfsylnrirrhdtvjmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZnpmc3lsbnJpcnJoZHR2am1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NzY5MjgsImV4cCI6MjA5NTE1MjkyOH0.31h7kDHADeH_65pgvVyrmvZl219OUV6WMMEL5jQBi1U";

const RPC_BASE_URL = `${SUPABASE_URL}/rest/v1/rpc`;

export type AdminCredentials = {
  username: string;
  password: string;
};

export type ServerSettings = {
  brandName: string;
  configuredBaseUrl: string;
  baseUrl: string;
  isConfigured: boolean;
  isLocalhostBaseUrl: boolean;
  warning: string | null;
  playerApi: string;
  m3u: string;
  xmltv: string;
  live: string;
  placeholderBaseUrl?: string;
};

export type LiveCategory = {
  id: number;
  name: string;
  sort_order: number;
  image_url: string | null;
  created_at: string;
};

export type LiveStream = {
  id: number;
  name: string;
  stream_url: string;
  logo_url: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  category_id: number | null;
  category_name: string;
};

export type VodCategory = {
  id: number;
  name: string;
  sort_order: number;
  status: string;
  created_at: string;
};

export type VodStream = {
  id: number;
  title: string;
  stream_url: string;
  poster_url: string | null;
  backdrop_url: string | null;
  category_id: number | null;
  category_name: string;
  description: string | null;
  genre: string | null;
  release_year: number | null;
  rating: string | null;
  duration: string | null;
  sort_order: number;
  status: string;
  created_at: string;
};

export type SeriesCategory = {
  id: number;
  name: string;
  sort_order: number;
  status: string;
  created_at: string;
};

export type SeriesRecord = {
  id: number;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  category_id: number | null;
  category_name: string;
  description: string | null;
  genre: string | null;
  release_year: number | null;
  rating: string | null;
  sort_order: number;
  status: string;
  created_at: string;
};

export type SeriesSeason = {
  id: number;
  series_id: number;
  series_title: string;
  season_number: number;
  name: string | null;
  sort_order: number;
  created_at: string;
};

export type SeriesEpisode = {
  id: number;
  series_id: number;
  series_title: string;
  season_id: number;
  season_number: number;
  episode_title: string;
  episode_number: number;
  stream_url: string;
  duration: string | null;
  poster_url: string | null;
  status: string;
  created_at: string;
};

export type DashboardData = {
  counts: {
    users: number;
    streams: number;
    categories: number;
    movies: number;
    series: number;
    episodes: number;
  };
  latestUsers: Array<{
    id: string;
    username: string;
    status: string;
    expiry_date: string;
    max_connections: number;
    created_at: string;
  }>;
  users: Array<{
    id: string;
    username: string;
    status: string;
    start_date: string;
    expiry_date: string;
    max_connections: number;
    notes: string | null;
    created_at: string;
  }>;
  streams: LiveStream[];
  categories: LiveCategory[];
  vod_categories: VodCategory[];
  vod_streams: VodStream[];
  series_categories: SeriesCategory[];
  series: SeriesRecord[];
  series_seasons: SeriesSeason[];
  series_episodes: SeriesEpisode[];
  server: ServerSettings;
  admin: {
    id: string;
    username: string;
    display_name: string | null;
  };
};

export type IboPlaylistRecord = {
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

export async function loginAdmin(credentials: AdminCredentials) {
  const admin = await callRpc<DashboardData["admin"]>("admin_login", {
    p_username: credentials.username,
    p_password: credentials.password,
  });

  return { admin };
}

export function getDashboard(credentials: AdminCredentials) {
  return callRpc<DashboardData>("admin_dashboard", {
    p_username: credentials.username,
    p_password: credentials.password,
  });
}

export async function updateServerBaseUrl(credentials: AdminCredentials, baseUrl: string) {
  const server = await callRpc<ServerSettings>("admin_update_base_url", {
    p_username: credentials.username,
    p_password: credentials.password,
    p_base_url: baseUrl,
  });

  return { server };
}

export async function createIptvUser(
  credentials: AdminCredentials,
  payload: {
    username: string;
    password: string;
    status: string;
    expiry_date: string;
    max_connections: number;
    notes?: string;
  },
) {
  const user = await callRpc("admin_create_user", {
    p_username: credentials.username,
    p_password: credentials.password,
    p_new_username: payload.username,
    p_new_password: payload.password,
    p_status: payload.status,
    p_expiry_date: payload.expiry_date,
    p_max_connections: payload.max_connections,
    p_notes: payload.notes ?? "",
  });

  return { user };
}

export async function createCategory(
  credentials: AdminCredentials,
  payload: { name: string; sort_order: number; image_url?: string },
) {
  const category = await callRpc("admin_create_category", {
    p_username: credentials.username,
    p_password: credentials.password,
    p_name: payload.name,
    p_sort_order: payload.sort_order,
    p_image_url: payload.image_url ?? "",
  });

  return { category };
}

export async function createStream(
  credentials: AdminCredentials,
  payload: {
    name: string;
    stream_url: string;
    logo_url?: string;
    category_id: number;
    status: string;
    sort_order: number;
  },
) {
  const stream = await callRpc("admin_create_stream", {
    p_username: credentials.username,
    p_password: credentials.password,
    p_name: payload.name,
    p_stream_url: payload.stream_url,
    p_logo_url: payload.logo_url ?? "",
    p_category_id: payload.category_id,
    p_status: payload.status,
    p_sort_order: payload.sort_order,
  });

  return { stream };
}

export function saveVodCategory(
  credentials: AdminCredentials,
  payload: { id?: number; name: string; sort_order: number; status: string },
) {
  return callRpc("admin_save_vod_category", withAdmin(credentials, {
    p_id: payload.id ?? null,
    p_name: payload.name,
    p_sort_order: payload.sort_order,
    p_status: payload.status,
  }));
}

export function deleteVodCategory(credentials: AdminCredentials, id: number) {
  return callRpc("admin_delete_vod_category", withAdmin(credentials, { p_id: id }));
}

export function saveVodStream(
  credentials: AdminCredentials,
  payload: {
    id?: number;
    title: string;
    stream_url: string;
    poster_url?: string;
    backdrop_url?: string;
    category_id?: number | null;
    description?: string;
    genre?: string;
    release_year?: number | null;
    rating?: string;
    duration?: string;
    sort_order: number;
    status: string;
  },
) {
  return callRpc("admin_save_vod_stream", withAdmin(credentials, {
    p_id: payload.id ?? null,
    p_title: payload.title,
    p_stream_url: payload.stream_url,
    p_poster_url: payload.poster_url ?? "",
    p_backdrop_url: payload.backdrop_url ?? "",
    p_category_id: payload.category_id ?? null,
    p_description: payload.description ?? "",
    p_genre: payload.genre ?? "",
    p_release_year: payload.release_year ?? null,
    p_rating: payload.rating ?? "",
    p_duration: payload.duration ?? "",
    p_sort_order: payload.sort_order,
    p_status: payload.status,
  }));
}

export function deleteVodStream(credentials: AdminCredentials, id: number) {
  return callRpc("admin_delete_vod_stream", withAdmin(credentials, { p_id: id }));
}

export function saveSeriesCategory(
  credentials: AdminCredentials,
  payload: { id?: number; name: string; sort_order: number; status: string },
) {
  return callRpc("admin_save_series_category", withAdmin(credentials, {
    p_id: payload.id ?? null,
    p_name: payload.name,
    p_sort_order: payload.sort_order,
    p_status: payload.status,
  }));
}

export function deleteSeriesCategory(credentials: AdminCredentials, id: number) {
  return callRpc("admin_delete_series_category", withAdmin(credentials, { p_id: id }));
}

export function saveSeries(
  credentials: AdminCredentials,
  payload: {
    id?: number;
    title: string;
    poster_url?: string;
    backdrop_url?: string;
    category_id?: number | null;
    description?: string;
    genre?: string;
    release_year?: number | null;
    rating?: string;
    sort_order: number;
    status: string;
  },
) {
  return callRpc("admin_save_series", withAdmin(credentials, {
    p_id: payload.id ?? null,
    p_title: payload.title,
    p_poster_url: payload.poster_url ?? "",
    p_backdrop_url: payload.backdrop_url ?? "",
    p_category_id: payload.category_id ?? null,
    p_description: payload.description ?? "",
    p_genre: payload.genre ?? "",
    p_release_year: payload.release_year ?? null,
    p_rating: payload.rating ?? "",
    p_sort_order: payload.sort_order,
    p_status: payload.status,
  }));
}

export function deleteSeries(credentials: AdminCredentials, id: number) {
  return callRpc("admin_delete_series", withAdmin(credentials, { p_id: id }));
}

export function saveSeriesSeason(
  credentials: AdminCredentials,
  payload: {
    id?: number;
    series_id: number;
    season_number: number;
    name?: string;
    sort_order: number;
  },
) {
  return callRpc("admin_save_series_season", withAdmin(credentials, {
    p_id: payload.id ?? null,
    p_series_id: payload.series_id,
    p_season_number: payload.season_number,
    p_name: payload.name ?? "",
    p_sort_order: payload.sort_order,
  }));
}

export function deleteSeriesSeason(credentials: AdminCredentials, id: number) {
  return callRpc("admin_delete_series_season", withAdmin(credentials, { p_id: id }));
}

export function saveSeriesEpisode(
  credentials: AdminCredentials,
  payload: {
    id?: number;
    series_id: number;
    season_id: number;
    episode_title: string;
    episode_number: number;
    stream_url: string;
    duration?: string;
    poster_url?: string;
    status: string;
  },
) {
  return callRpc("admin_save_series_episode", withAdmin(credentials, {
    p_id: payload.id ?? null,
    p_series_id: payload.series_id,
    p_season_id: payload.season_id,
    p_episode_title: payload.episode_title,
    p_episode_number: payload.episode_number,
    p_stream_url: payload.stream_url,
    p_duration: payload.duration ?? "",
    p_poster_url: payload.poster_url ?? "",
    p_status: payload.status,
  }));
}

export function deleteSeriesEpisode(credentials: AdminCredentials, id: number) {
  return callRpc("admin_delete_series_episode", withAdmin(credentials, { p_id: id }));
}

export function getIboPlaylists(credentials: AdminCredentials) {
  return callRpc<IboPlaylistRecord[]>("admin_list_ibo_playlists", withAdmin(credentials, {}));
}

export async function generateIboPlaylist(credentials: AdminCredentials, targetUsername: string) {
  const { data, error } = await supabase.functions.invoke<{ playlist?: IboPlaylistRecord; error?: string }>("generate-ibo-playlist", {
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

  return data.playlist as IboPlaylistRecord;
}
