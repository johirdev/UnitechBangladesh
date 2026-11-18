import type { Request, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { ApiError } from "../lib/errors";
import { User, STAFF_ROLES, type Role, type Permission } from "../models/User";

export const COOKIE = "utb_token";

export type AuthUser = {
  _id: string;
  name: string;
  phone: string;
  role: Role;
  permissions: Permission[];
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

const isStaff = (role: string) => (STAFF_ROLES as string[]).includes(role);

const parseDuration = (s: string) => {
  const m = /^(\d+)([smhd])$/.exec(s);
  if (!m) return 24 * 3600 * 1000;
  const n = parseInt(m[1], 10);
  return n * { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2] as "s" | "m" | "h" | "d"];
};

export function issueSession(res: Response, user: { _id: unknown; role: string; tokenVersion?: number }) {
  const expiresIn = isStaff(user.role) ? config.jwt.adminExpiresIn : config.jwt.expiresIn;
  const token = jwt.sign({ sub: String(user._id), tv: user.tokenVersion || 0 }, config.jwt.secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    path: "/",
    maxAge: parseDuration(expiresIn),
  });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE, { httpOnly: true, secure: config.cookieSecure, sameSite: "lax", path: "/" });
}

async function resolveUser(req: Request): Promise<AuthUser | null> {
  const token = req.cookies?.[COOKIE] || (req.get("authorization")?.startsWith("Bearer ") ? req.get("authorization")!.slice(7) : "");
  if (!token) return null;
  let payload: { sub: string; tv: number };
  try {
    payload = jwt.verify(token, config.jwt.secret, { algorithms: ["HS256"] }) as typeof payload;
  } catch {
    return null;
  }
  const u = await User.findById(payload.sub).select("+tokenVersion name phone role permissions isActive").lean();
  // tokenVersion না মিললে (পাসওয়ার্ড বদল/লগআউট-সব) টোকেন বাতিল
  if (!u || !u.isActive || (u.tokenVersion || 0) !== payload.tv) return null;
  return { _id: String(u._id), name: u.name, phone: u.phone, role: u.role as Role, permissions: (u.permissions || []) as Permission[] };
}

/** লগইন থাকলে req.user বসায়, না থাকলেও চলবে */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  req.user = (await resolveUser(req)) || undefined;
  next();
};

export const requireAuth =
  (...roles: Role[]): RequestHandler =>
  async (req, _res, next) => {
    const u = await resolveUser(req);
    if (!u) return next(new ApiError(401, "অনুগ্রহ করে লগইন করুন"));
    if (roles.length && !roles.includes(u.role)) return next(new ApiError(403, "এই কাজের অনুমতি আপনার নেই"));
    req.user = u;
    next();
  };

export const hasPerm = (u: AuthUser | undefined, p: Permission) =>
  !!u && (u.role === "superadmin" || u.role === "ceo" || (u.role === "admin" && u.permissions.includes(p)));

/** স্টাফ (superadmin/ceo/admin) + নির্দিষ্ট পারমিশন */
export const requirePerm =
  (...perms: Permission[]): RequestHandler =>
  async (req, _res, next) => {
    const u = req.user || (await resolveUser(req));
    if (!u) return next(new ApiError(401, "অনুগ্রহ করে লগইন করুন"));
    if (!isStaff(u.role)) return next(new ApiError(403, "এই কাজের অনুমতি আপনার নেই"));
    if (perms.length && !perms.some((p) => hasPerm(u, p))) return next(new ApiError(403, "এই কাজের অনুমতি আপনার নেই"));
    req.user = u;
    next();
  };
