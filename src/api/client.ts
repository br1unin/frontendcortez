const API_BASE = import.meta.env.VITE_API_URL || ""; 
export function getApiBase() {
  return API_BASE as string;
}

export async function apiFetch<T>(
  path: string,
  opts: { method?: string; body?: any; params?: Record<string, any> } = {}
): Promise<T> {
  const { method = "GET", body, params } = opts;

  const base = (API_BASE || "").replace(/\/$/, "");
  const url = new URL(base + path);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${method} ${path} failed (${res.status}): ${text || res.statusText}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null as any;
  return res.json();
}
