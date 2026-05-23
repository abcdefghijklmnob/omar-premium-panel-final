const FUNCTIONS_BASE_URL = "https://gsfzfsylnrirrhdtvjmg.supabase.co/functions/v1";
const ADMIN_PANEL_URL = `${FUNCTIONS_BASE_URL}/admin-panel`;

export type AdminCredentials = {
  username: string;
  password: string;
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
  server: {
    baseUrl: string;
    playerApi: string;
    m3u: string;
    xmltv: string;
    live: string;
  };
  admin: {
    id: string;
    username: string;
    display_name: string | null;
  };
};

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload as T;
}

async function callAdminPanel<T>(body: Record<string, unknown>, credentials?: AdminCredentials) {
  const response = await fetch(ADMIN_PANEL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(credentials
        ? {
            "x-admin-username": credentials.username,
            "x-admin-password": credentials.password,
          }
        : {}),
    },
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export function loginAdmin(credentials: AdminCredentials) {
  return callAdminPanel<{ admin: DashboardData["admin"] }>({
    action: "login",
    username: credentials.username,
    password: credentials.password,
  });
}

export function getDashboard(credentials: AdminCredentials) {
  return callAdminPanel<DashboardData>({ action: "dashboard" }, credentials);
}

export function createIptvUser(
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
  return callAdminPanel({ action: "create_user", ...payload }, credentials);
}

export function createCategory(
  credentials: AdminCredentials,
  payload: { name: string; sort_order: number; image_url?: string },
) {
  return callAdminPanel({ action: "create_category", ...payload }, credentials);
}

export function createStream(
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
  return callAdminPanel({ action: "create_stream", ...payload }, credentials);
}
