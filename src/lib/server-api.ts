
// Vercel এ নিজের ডিপ্লয়মেন্টের API, লোকালে NEXT_PUBLIC_API_URL
const API = (
  (process.env.VERCEL ? "" : process.env.NEXT_PUBLIC_API_URL) ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:3000"
).trim().replace(/\/+$/, "");

/** সার্ভার কম্পোনেন্ট থেকে পাবলিক ডেটা আনা (SEO এর জন্য) — API বন্ধ থাকলে null */
export async function serverGet<T>(path: string, revalidate = 30): Promise<T | null> {
  try {
    const res = await fetch(`${API}/api/v1${path}`, { next: { revalidate }, headers: { "X-Requested-With": "utb-web" } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? (json.data as T) : null;
  } catch {
    return null;
  }
}
