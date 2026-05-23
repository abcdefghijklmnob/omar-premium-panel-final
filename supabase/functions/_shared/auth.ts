type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => any;
  };
};

export type AuthResult<T> = {
  ok: boolean;
  status: number;
  message: string;
  data: T | null;
};

export async function validateAdmin(
  supabase: any,
  username: string | null,
  password: string | null,
): Promise<AuthResult<any>> {
  if (!username || !password) {
    return { ok: false, status: 401, message: "Missing admin credentials", data: null };
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, username, display_name, is_active")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 401, message: "Invalid admin credentials", data: null };
  }

  if (!data.is_active) {
    return { ok: false, status: 403, message: "Admin account is disabled", data: null };
  }

  return { ok: true, status: 200, message: "OK", data };
}

export async function validateIptvUser(
  supabase: any,
  username: string | null,
  password: string | null,
): Promise<AuthResult<any>> {
  if (!username || !password) {
    return { ok: false, status: 401, message: "Missing IPTV credentials", data: null };
  }

  const { data, error } = await supabase
    .from("iptv_users")
    .select("id, username, password, status, start_date, expiry_date, max_connections, notes, created_at")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 401, message: "Invalid username or password", data: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryDate = new Date(`${data.expiry_date}T23:59:59Z`);
  let effectiveStatus = data.status;

  if (effectiveStatus !== "Banned" && expiryDate.getTime() < today.getTime()) {
    effectiveStatus = "Expired";
  }

  if (effectiveStatus !== "Active") {
    return {
      ok: false,
      status: effectiveStatus === "Banned" ? 403 : 402,
      message: effectiveStatus,
      data: { ...data, effectiveStatus },
    };
  }

  return {
    ok: true,
    status: 200,
    message: "OK",
    data: { ...data, effectiveStatus },
  };
}
