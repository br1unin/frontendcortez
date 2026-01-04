import { apiFetch } from "./client";

export async function listResource<T>(resourcePath: string, args?: { skip?: number; limit?: number }) {
  const skip = args?.skip ?? 0;
  const limit = args?.limit ?? 200;
  return apiFetch<T>(resourcePath, { params: { skip, limit } });
}

export async function getResource<T>(resourcePath: string, id: string | number) {
  return apiFetch<T>(`${resourcePath}${encodeURIComponent(String(id))}`);
}

export async function createResource<T>(resourcePath: string, payload: any) {
  return apiFetch<T>(resourcePath, { method: "POST", body: payload });
}

export async function updateResource<T>(resourcePath: string, id: string | number, payload: any) {
  return apiFetch<T>(`${resourcePath}${encodeURIComponent(String(id))}`, { method: "PUT", body: payload });
}

export async function deleteResource<T>(resourcePath: string, id: string | number) {
  return apiFetch<T>(`${resourcePath}${encodeURIComponent(String(id))}`, { method: "DELETE" });
}
