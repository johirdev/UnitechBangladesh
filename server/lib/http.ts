import type { Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { ApiError } from "./errors";

export const ok = (res: Response, data: unknown, message = "সফল", status = 200, meta?: unknown) =>
  res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });

export const parse = <T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> => schema.parse(data);

export const objectId = (id: unknown, label = "আইডি") => {
  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) throw new ApiError(400, `অবৈধ ${label}`);
  return id;
};

export const paging = (req: Request, maxLimit = 100) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

export const escapeRegex = (s: string) => s.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const qstr = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** বাংলাদেশি মোবাইল নম্বর → 01XXXXXXXXX */
export const normalizePhone = (raw: string) => {
  let p = String(raw || "").replace(/[\s-]/g, "");
  // বাংলা অঙ্ক → ইংরেজি
  p = p.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
  if (p.startsWith("+880")) p = p.slice(3);
  else if (p.startsWith("880")) p = p.slice(2);
  return p;
};
export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .refine((p) => /^01[3-9]\d{8}$/.test(p), "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)");

export const passwordSchema = z
  .string()
  .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে")
  .max(72, "পাসওয়ার্ড অনেক বড়")
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "পাসওয়ার্ডে অক্ষর ও সংখ্যা দুটোই থাকতে হবে");

/** ছবির লিংক: শুধু https বা সাইটের নিজস্ব /images/ পাথ (javascript: ইত্যাদি ঠেকাতে) */
export const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\//.test(v) || /^\/images\/[\w\-./]+$/.test(v), "অবৈধ ছবির লিংক");

export const linkUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//.test(v) || /^\/[\w\-./?=&#%]*$/.test(v), "অবৈধ লিংক");

export const objectIdStr = z.string().refine((v) => mongoose.isValidObjectId(v), "অবৈধ আইডি");

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `item-${Date.now()}`;

export const clientIp = (req: Request) => req.ip || req.socket.remoteAddress || "";
