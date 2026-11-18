import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config";
import { requireAuth } from "../middleware/auth";
import { uploadLimiter } from "../middleware/security";
import { ApiError } from "../lib/errors";
import { ok } from "../lib/http";

const configured = !!(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);
if (configured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => (ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new ApiError(400, "শুধু JPG, PNG, WEBP বা GIF ছবি দেওয়া যাবে"))),
});

/** ফাইলের আসল ধরন (magic bytes) যাচাই — শুধু এক্সটেনশন বদলে ক্ষতিকর ফাইল দেওয়া ঠেকায় */
function isRealImage(b: Buffer) {
  if (b.length < 12) return false;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true; // jpg
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true; // png
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return true; // webp
  if (b.subarray(0, 4).toString() === "GIF8") return true;
  return false;
}

const FOLDERS = ["general", "avatars", "categories", "courses", "banners", "gallery", "toppers", "attachments", "signatures", "projects", "tools"];

const router = Router();

router.post("/", uploadLimiter, requireAuth(), upload.single("file"), async (req, res) => {
  if (!configured) throw new ApiError(503, "ছবি আপলোড চালু নেই — .env এ CLOUDINARY_* সেট করুন");
  if (!req.file) throw new ApiError(400, "কোনো ফাইল পাওয়া যায়নি");
  if (!isRealImage(req.file.buffer)) throw new ApiError(400, "ফাইলটি সঠিক ছবি নয়");

  const folderReq = String(req.body?.folder || "general");
  // শিক্ষার্থী শুধু নিজের প্রোফাইল ছবি আপলোড করতে পারবে
  const isStudent = req.user!.role === "student";
  const folder = isStudent ? "avatars" : FOLDERS.includes(folderReq) ? folderReq : "general";

  const result = await new Promise<{ secure_url: string; public_id: string; width: number; height: number }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `unitech/${folder}`, resource_type: "image", overwrite: false, transformation: [{ width: 2400, height: 2400, crop: "limit", quality: "auto", fetch_format: "auto" }] },
      (err, r) => (err || !r ? reject(err || new Error("upload failed")) : resolve(r as never)),
    );
    stream.end(req.file!.buffer);
  });

  ok(res, { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height }, "ছবি আপলোড হয়েছে", 201);
});

export default router;
