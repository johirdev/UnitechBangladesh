/** সাইটের পূর্ণ ঠিকানা — sitemap, robots ও মেটাডেটার জন্য */
export const siteUrl = (
  process.env.FRONTEND_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000"
)
  .split(",")[0]
  .trim()
  .replace(/\/+$/, "");
