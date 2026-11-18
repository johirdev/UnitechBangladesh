// Vercel এ Express API চালানোর জন্য — /api/v1/* সব রিকোয়েস্ট সরাসরি server/app এ যায়
import type { NextApiRequest, NextApiResponse } from "next";
import { app } from "../../../../server/app";
import { connectDB } from "../../../../server/lib/db";

export const config = { api: { bodyParser: false, externalResolver: true, responseLimit: false } };

// কোল্ড স্টার্টে একবারই MongoDB কানেক্ট (ব্যর্থ হলে পরের রিকোয়েস্টে আবার চেষ্টা)
let ready: Promise<void> | null = null;
const ensureDB = () => (ready ??= connectDB().catch((e) => { ready = null; throw e; }));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await ensureDB();
  } catch (e) {
    console.error("❌ MongoDB connect ব্যর্থ:", e);
    return res.status(503).json({ success: false, message: "ডেটাবেস সংযোগ ব্যর্থ" });
  }
  return new Promise<void>((resolve) => {
    res.on("finish", resolve);
    res.on("close", resolve);
    app(req as never, res as never);
  });
}
