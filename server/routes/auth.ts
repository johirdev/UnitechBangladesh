import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config";
import { ApiError } from "../lib/errors";
import { ok, parse, phoneSchema, passwordSchema, clientIp, normalizePhone } from "../lib/http";
import { sendSms } from "../lib/sms";
import { audit } from "../lib/audit";
import { User, Otp, generateStudentId } from "../models/User";
import { authLimiter, otpLimiter } from "../middleware/security";
import { issueSession, clearSession, requireAuth } from "../middleware/auth";

const router = Router();

const OTP_TTL_MS = 5 * 60_000;
const OTP_COOLDOWN_MS = 60_000;
const MAX_OTP_ATTEMPTS = 5;
const MAX_LOGIN_FAILS = 5;
const LOCK_MS = 15 * 60_000;
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

const hashOtp = (phone: string, code: string) => crypto.createHmac("sha256", config.jwt.secret).update(`${phone}:${code}`).digest("hex");

const otpTokenSecret = config.jwt.secret + ":otp";

// ---------- OTP পাঠানো ----------
router.post("/otp/send", otpLimiter, async (req, res) => {
  const { phone, purpose } = parse(z.object({ phone: phoneSchema, purpose: z.enum(["register", "reset"]) }), req.body);

  const exists = await User.exists({ phone });
  if (purpose === "register" && exists) throw new ApiError(409, "এই নম্বর দিয়ে আগেই অ্যাকাউন্ট খোলা আছে, লগইন করুন");
  if (purpose === "reset" && !exists) throw new ApiError(404, "এই নম্বরে কোনো অ্যাকাউন্ট নেই");

  const last = await Otp.findOne({ phone, purpose }).sort({ createdAt: -1 });
  if (last && Date.now() - last.createdAt!.getTime() < OTP_COOLDOWN_MS) {
    const wait = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - last.createdAt!.getTime())) / 1000);
    throw new ApiError(429, `${wait} সেকেন্ড পর আবার OTP চাইতে পারবেন`);
  }

  const code = String(crypto.randomInt(100000, 1000000));
  await Otp.deleteMany({ phone, purpose });
  await Otp.create({ phone, purpose, codeHash: hashOtp(phone, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) });

  const message = `${config.appName}: আপনার OTP কোড ${code}। ৫ মিনিটের মধ্যে ব্যবহার করুন। কাউকে এই কোড দেবেন না।`;
  const r = await sendSms(phone, message, "otp");
  if (r.status === "failed") throw new ApiError(502, `OTP পাঠানো যায়নি: ${r.error}`);

  // ডেভেলপমেন্টে SMS বন্ধ থাকলে টেস্টের জন্য কোড ফেরত দিই
  // development মোডে OTP ফেরত দিই যাতে ফর্মে নিজে বসে যায়; production এ কখনো না
  if (config.isDev) console.log(`🔑 [DEV OTP] ${phone} (${purpose}): ${code}`);
  ok(res, config.isDev ? { devOtp: code, mode: "development" } : {}, config.isDev ? "Development মোড — OTP নিজে বসে গেছে" : "OTP পাঠানো হয়েছে");
});

// ---------- OTP যাচাই ----------
router.post("/otp/verify", authLimiter, async (req, res) => {
  const { phone, purpose, code } = parse(
    z.object({ phone: phoneSchema, purpose: z.enum(["register", "reset"]), code: z.string().regex(/^\d{6}$/, "৬ সংখ্যার OTP দিন") }),
    req.body,
  );
  const otp = await Otp.findOne({ phone, purpose }).sort({ createdAt: -1 });
  if (!otp || otp.expiresAt < new Date()) throw new ApiError(400, "OTP এর মেয়াদ শেষ, আবার OTP নিন");
  if (otp.attempts >= MAX_OTP_ATTEMPTS) throw new ApiError(429, "অনেকবার ভুল OTP দিয়েছেন, নতুন OTP নিন");

  const a = Buffer.from(otp.codeHash, "hex");
  const b = Buffer.from(hashOtp(phone, code), "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    otp.attempts += 1;
    await otp.save();
    throw new ApiError(400, `ভুল OTP (আর ${MAX_OTP_ATTEMPTS - otp.attempts} বার চেষ্টা করতে পারবেন)`);
  }
  await Otp.deleteOne({ _id: otp._id });
  const otpToken = jwt.sign({ phone, purpose }, otpTokenSecret, { expiresIn: "15m" });
  ok(res, { otpToken }, "নম্বর যাচাই সম্পন্ন");
});

const readOtpToken = (token: string, purpose: string) => {
  try {
    const p = jwt.verify(token, otpTokenSecret) as { phone: string; purpose: string };
    if (p.purpose !== purpose) throw new Error();
    return p.phone;
  } catch {
    throw new ApiError(400, "যাচাইয়ের মেয়াদ শেষ, আবার OTP দিয়ে চেষ্টা করুন");
  }
};

// ---------- রেজিস্ট্রেশন ----------
router.post("/register", authLimiter, async (req, res) => {
  const body = parse(
    z.object({
      otpToken: z.string().min(10),
      name: z.string().trim().min(2, "নাম দিন").max(80),
      password: passwordSchema,
      email: z.string().trim().email("সঠিক ইমেইল দিন").max(120).optional().or(z.literal("")),
    }),
    req.body,
  );
  const phone = readOtpToken(body.otpToken, "register");
  if (await User.exists({ phone })) throw new ApiError(409, "এই নম্বর দিয়ে আগেই অ্যাকাউন্ট খোলা আছে");

  const user = await User.create({
    name: body.name,
    phone,
    email: body.email || "",
    password: await bcrypt.hash(body.password, config.bcryptRounds),
    role: "student",
    isPhoneVerified: true,
    studentId: await generateStudentId(),
  });
  issueSession(res, user);
  ok(res, user.toJSON(), "রেজিস্ট্রেশন সফল হয়েছে", 201);
});

// ---------- লগইন ----------
router.post("/login", authLimiter, async (req, res) => {
  // ফোন নম্বর অথবা ইমেইল — দুটো দিয়েই লগইন করা যায়
  const { phone: login, password } = parse(
    z.object({ phone: z.string().trim().min(3, "মোবাইল নম্বর বা ইমেইল দিন").max(120), password: z.string().min(1, "পাসওয়ার্ড দিন").max(72) }),
    req.body,
  );
  const isEmail = login.includes("@");
  const query = isEmail ? { email: login.toLowerCase() } : { phone: normalizePhone(login) };
  if (!isEmail && !/^01[3-9]\d{8}$/.test(query.phone!)) throw new ApiError(400, "সঠিক মোবাইল নম্বর বা ইমেইল দিন");
  const user = await User.findOne(query).select("+password +failedLogins +lockUntil +tokenVersion");

  if (user?.lockUntil && user.lockUntil > new Date()) {
    const mins = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw new ApiError(423, `নিরাপত্তার জন্য অ্যাকাউন্ট ${mins} মিনিট লক করা আছে`);
  }
  const valid = await bcrypt.compare(password, user?.password || DUMMY_HASH);
  if (!user || !valid) {
    if (user) {
      user.failedLogins = (user.failedLogins || 0) + 1;
      if (user.failedLogins >= MAX_LOGIN_FAILS) {
        user.lockUntil = new Date(Date.now() + LOCK_MS);
        user.failedLogins = 0;
      }
      await user.save();
    }
    throw new ApiError(401, "মোবাইল নম্বর বা পাসওয়ার্ড ভুল");
  }
  if (!user.isActive) throw new ApiError(403, "আপনার অ্যাকাউন্ট বন্ধ করা আছে, অফিসে যোগাযোগ করুন");

  user.failedLogins = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();
  issueSession(res, user);
  if (user.role !== "student") {
    req.user = { _id: String(user._id), name: user.name, phone: user.phone, role: user.role, permissions: user.permissions as never };
    audit(req, "login", "User", user._id, `IP ${clientIp(req)}`);
  }
  ok(res, user.toJSON(), "লগইন সফল");
});

// ---------- পাসওয়ার্ড রিসেট ----------
router.post("/reset-password", authLimiter, async (req, res) => {
  const { otpToken, password } = parse(z.object({ otpToken: z.string().min(10), password: passwordSchema }), req.body);
  const phone = readOtpToken(otpToken, "reset");
  const user = await User.findOne({ phone }).select("+tokenVersion");
  if (!user) throw new ApiError(404, "অ্যাকাউন্ট পাওয়া যায়নি");
  user.password = await bcrypt.hash(password, config.bcryptRounds);
  user.tokenVersion = (user.tokenVersion || 0) + 1; // সব ডিভাইস থেকে লগআউট
  user.passwordChangedAt = new Date();
  user.isPhoneVerified = true;
  await User.updateOne({ _id: user._id }, { $set: { failedLogins: 0 }, $unset: { lockUntil: 1 } });
  await user.save();
  ok(res, {}, "পাসওয়ার্ড পরিবর্তন হয়েছে, এখন লগইন করুন");
});

router.post("/logout", (_req, res) => {
  clearSession(res);
  ok(res, {}, "লগআউট হয়েছে");
});

router.post("/logout-all", requireAuth(), async (req, res) => {
  await User.updateOne({ _id: req.user!._id }, { $inc: { tokenVersion: 1 } });
  clearSession(res);
  ok(res, {}, "সব ডিভাইস থেকে লগআউট হয়েছে");
});

router.get("/me", requireAuth(), async (req, res) => {
  const user = await User.findById(req.user!._id);
  ok(res, user);
});

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(120).optional().or(z.literal("")),
  avatar: z.string().trim().max(500).optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""]).optional(),
  institute: z.string().trim().max(150).optional(),
  department: z.string().trim().max(100).optional(),
  semester: z.string().trim().max(40).optional(),
  educationLevel: z.string().trim().max(80).optional(),
  fatherName: z.string().trim().max(80).optional(),
  guardianPhone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(250).optional(),
  bio: z.string().trim().max(600).optional(),
  designation: z.string().trim().max(80).optional(),
  signature: z.string().trim().max(500).optional(),
});

router.patch("/me", requireAuth(), async (req, res) => {
  const data = parse(profileSchema, req.body);
  if (req.user!.role === "student") {
    delete data.designation;
    delete data.signature;
  }
  for (const k of ["avatar", "signature"] as const) {
    if (data[k] && !/^(https:\/\/|\/images\/)/.test(data[k]!)) throw new ApiError(400, "অবৈধ ছবির লিংক");
  }
  const user = await User.findByIdAndUpdate(req.user!._id, { $set: data }, { new: true, runValidators: true });
  ok(res, user, "প্রোফাইল আপডেট হয়েছে");
});

router.post("/change-password", requireAuth(), authLimiter, async (req, res) => {
  const { currentPassword, newPassword } = parse(z.object({ currentPassword: z.string().min(1).max(72), newPassword: passwordSchema }), req.body);
  const user = await User.findById(req.user!._id).select("+password +tokenVersion");
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) throw new ApiError(400, "বর্তমান পাসওয়ার্ড ভুল");
  user.password = await bcrypt.hash(newPassword, config.bcryptRounds);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.passwordChangedAt = new Date();
  await user.save();
  issueSession(res, user);
  ok(res, {}, "পাসওয়ার্ড পরিবর্তন হয়েছে");
});

export default router;
