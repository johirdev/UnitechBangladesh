import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { ApiError } from "../lib/errors";
import { config } from "../config";

/** development এ টেস্ট করতে যাতে আটকে না যায় — লিমিট ২০ গুণ */
const L = (n: number) => (config.isDev ? n * 20 : n);

/** NoSQL injection: '$' দিয়ে শুরু বা '.' আছে এমন key সরিয়ে দেয় */
function clean(v: unknown, depth = 0): unknown {
  if (depth > 10) return undefined;
  if (Array.isArray(v)) return v.map((x) => clean(x, depth + 1));
  if (v && typeof v === "object" && !(v instanceof Date) && !Buffer.isBuffer(v)) {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      if (k.startsWith("$") || k.includes(".") || k === "__proto__" || k === "constructor" || k === "prototype") continue;
      out[k] = clean(val, depth + 1);
    }
    return out;
  }
  return v;
}

export const sanitize: RequestHandler = (req, _res, next) => {
  if (req.body) req.body = clean(req.body);
  Object.defineProperty(req, "query", { value: clean({ ...req.query }), writable: true, configurable: true });
  if (req.params) req.params = clean(req.params) as typeof req.params;
  next();
};

/**
 * CSRF সুরক্ষা: পরিবর্তনকারী রিকোয়েস্টে কাস্টম হেডার বাধ্যতামূলক।
 * অন্য সাইট থেকে কাস্টম হেডারসহ রিকোয়েস্ট CORS preflight ছাড়া সম্ভব নয়।
 */
export const requireClientHeader: RequestHandler = (req, _res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.get("x-requested-with") !== "utb-web") return next(new ApiError(403, "অননুমোদিত রিকোয়েস্ট"));
  next();
};

const msg = (m: string) => ({ success: false, message: m });

export const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: L(300),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: msg("অনেক বেশি রিকোয়েস্ট, একটু পরে চেষ্টা করুন"),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: L(20),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: msg("অনেকবার চেষ্টা করেছেন, ১৫ মিনিট পর আবার চেষ্টা করুন"),
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: L(6),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: msg("এক ঘণ্টায় সর্বোচ্চ ৬ বার OTP চাওয়া যায়"),
});

export const trackLimiter = rateLimit({ windowMs: 60_000, limit: L(60), standardHeaders: "draft-8", legacyHeaders: false, message: msg("") });
export const uploadLimiter = rateLimit({ windowMs: 60_000, limit: L(30), standardHeaders: "draft-8", legacyHeaders: false, message: msg("অনেক বেশি আপলোড") });
