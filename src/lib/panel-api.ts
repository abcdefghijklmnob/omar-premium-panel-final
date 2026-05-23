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

export type DashboardData = {
  counts: {
    users: number;
    streams: number;
    categories: number;
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
  streams: Array<{
    id: number;
    name: string;
    stream_url: string;
    logo_url: string | null;
    status: string;
    sort_order: number;
    created_at: string;
    category_id: number | null;
    category_name: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    sort_order: number;
    image_url: string | null;
    created_at: string;
  }>;
  server: ServerSettings;
  admin: {
    id: string;
    username: string;
    display_name: string | null;
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
    throw new Error(data?.message || data?.error || data?.details || "Request failed");
  }

  return data as T;
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
