import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { config } from "../config";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ডুপ্লিকেট এররে ফিল্ডের নাম বাংলায়
const FIELD_LABEL: Record<string, string> = { email: "ইমেইল", phone: "মোবাইল নম্বর", slug: "লিংক (slug)", code: "কোড", studentId: "স্টুডেন্ট আইডি", certificateNo: "সার্টিফিকেট নম্বর", name: "নাম" };

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ success: false, message: `পাওয়া যায়নি: ${req.method} ${req.originalUrl}` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let message = "সার্ভারে সমস্যা হয়েছে, পরে আবার চেষ্টা করুন";
  let errors: { path: string; message: string }[] | undefined;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
  } else if (err instanceof ZodError) {
    status = 400;
    errors = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    message = errors[0]?.message || "ইনপুট সঠিক নয়";
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    errors = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    message = errors[0]?.message || "ইনপুট সঠিক নয়";
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = "অবৈধ আইডি";
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `এই ${FIELD_LABEL[field] || field || "তথ্য"} আগেই অন্য কেউ ব্যবহার করছে`;
  } else if (err?.type === "entity.too.large") {
    status = 413;
    message = "রিকোয়েস্ট অনেক বড়";
  } else if (err?.code === "LIMIT_FILE_SIZE") {
    status = 413;
    message = "ফাইল অনেক বড় (সর্বোচ্চ ৫MB)";
  }

  if (status >= 500) console.error("[error]", err);
  res.status(status).json({
    success: false,
    message,
    errors,
    ...(config.isProd || status < 500 ? {} : { stack: err?.stack }),
  });
};
