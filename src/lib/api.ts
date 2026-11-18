// ব্রাউজার থেকে API কল — সবসময় একই ডোমেইনের /api/v1 (Next rewrite) দিয়ে, তাই কুকি নিরাপদ থাকে

export class ApiError extends Error {
  status: number;
  errors?: { path: string; message: string }[];
  constructor(status: number, message: string, errors?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export type ApiResponse<T> = { success: boolean; message: string; data: T; meta?: Meta };
export type Meta = { page: number; limit: number; total: number; pages: number; [k: string]: unknown };

type Opts = { method?: string; body?: unknown; query?: Record<string, string | number | boolean | undefined | null> };

export function qs(query?: Opts["query"]) {
  if (!query) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<ApiResponse<T>> {
  const res = await fetch(`/api/v1${path}${qs(opts.query)}`, {
    method: opts.method || "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-Requested-With": "utb-web" },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  if (res.status === 204) return { success: true, message: "", data: undefined as T };
  let json: ApiResponse<T> & { errors?: { path: string; message: string }[] };
  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.status, res.status >= 500 ? "সার্ভারের সাথে সংযোগ হচ্ছে না (API চালু আছে তো?)" : "অপ্রত্যাশিত উত্তর");
  }
  if (!res.ok || !json.success) throw new ApiError(res.status, json.message || "কিছু একটা সমস্যা হয়েছে", json.errors);
  return json;
}

export const get = <T>(path: string, query?: Opts["query"]) => api<T>(path, { query });
export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: "POST", body: body ?? {} });
export const patch = <T>(path: string, body?: unknown) => api<T>(path, { method: "PATCH", body: body ?? {} });
export const del = <T>(path: string) => api<T>(path, { method: "DELETE" });

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "কিছু একটা সমস্যা হয়েছে");

/** ছবি আপলোড (Cloudinary) */
export async function uploadImage(file: Blob, folder = "general"): Promise<string> {
  const fd = new FormData();
  fd.append("folder", folder);
  fd.append("file", file, "image.webp");
  const res = await fetch("/api/v1/upload", { method: "POST", body: fd, credentials: "include", headers: { "X-Requested-With": "utb-web" } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new ApiError(res.status, json.message || "আপলোড ব্যর্থ");
  return json.data.url as string;
}
