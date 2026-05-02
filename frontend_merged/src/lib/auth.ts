type SupabaseAuthResponse = {
  access_token?: string;
  user?: {
    id?: string;
    email?: string;
  };
  error?: string;
  msg?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function requireSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase login is not configured on this deployment.");
  }
}

async function supabaseAuthFetch(path: string, body: object): Promise<SupabaseAuthResponse> {
  requireSupabaseConfig();

  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as SupabaseAuthResponse;

  if (!response.ok) {
    throw new Error(data.error || data.msg || `Supabase auth failed with ${response.status}`);
  }

  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  return supabaseAuthFetch("signup", { email, password });
}

export async function signInWithEmail(email: string, password: string) {
  return supabaseAuthFetch("token?grant_type=password", { email, password });
}

export function saveAuthSession(data: SupabaseAuthResponse) {
  if (data.access_token) {
    localStorage.setItem("studymind:access_token", data.access_token);
  }

  if (data.user?.id) {
    localStorage.setItem("studymind:user_id", data.user.id);
  }

  if (data.user?.email) {
    localStorage.setItem("studymind:email", data.user.email);
  }
}
