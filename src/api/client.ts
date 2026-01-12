const API_BASE = import.meta.env.VITE_API_URL || "";
export function getApiBase() {
  return API_BASE as string;
}

type ApiFetchOptions = {
  method?: string;
  body?: any;
  params?: Record<string, any>;
};

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", body, params } = opts;

  const base = (API_BASE || "").replace(/\/$/, "");
  const url = new URL(base + path);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const token = localStorage.getItem("auth_token");
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("auth_token");
      if (typeof window !== "undefined") {
        const isAdminPath = window.location.pathname.startsWith("/admin");
        const target = isAdminPath ? "/admin/login" : "/login";
        if (window.location.pathname !== target) {
          window.location.assign(target);
        }
      }
    }

    const text = await res.text().catch(() => "");
    let message = text || res.statusText;
    try {
      const data = text ? JSON.parse(text) : null;
      const detail = data.detail;
      if (Array.isArray(detail)) {
        const parts = detail?.map((item: any) => {
            const loc = Array.isArray(item.loc) ? item.loc.join(".") : "";
            const msg = item.msg || item.message || "";
            if (loc && msg) return `${loc}: ${msg}`;
            return msg || loc;
          })
          .filter(Boolean);
        if (parts.length) message = parts.join(" | ");
      } else if (typeof detail === "string") {
        message = detail;
      }
    } catch {
      // keep raw text
    }
    const normalized = message.toLowerCase();
    if (normalized.includes("email") && normalized.includes("not a valid email")) {
      message = "El email no es valido.";
    } else if (normalized.includes("field required")) {
      message = "Faltan campos obligatorios.";
    } else if (normalized.includes("credenciales invalidas") || normalized.includes("invalid credentials")) {
      message = "Credenciales invalidas.";
    } else if (normalized.includes("token invalido") || normalized.includes("invalid token")) {
      message = "Token invalido.";
    }
    throw new Error(message);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null as any;
  return res.json();
}
