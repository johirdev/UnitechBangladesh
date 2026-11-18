import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import { config } from "../../config";
import { ApiError } from "../../lib/errors";
import { ok, parse, paging, qstr, escapeRegex, objectId, phoneSchema, passwordSchema, imageUrl, normalizePhone } from "../../lib/http";
import { audit } from "../../lib/audit";
import { sendSms } from "../../lib/sms";
import { requirePerm, type AuthUser } from "../../middleware/auth";
import { User, ROLES, PERMISSIONS, STAFF_ROLES, generateStudentId, type Role } from "../../models/User";
import { Enrollment, Payment, Expense } from "../../models/Finance";
import { Batch } from "../../models/Catalog";

const router = Router();

const isSuper = (u?: AuthUser) => u?.role === "superadmin";
/** স্টাফ রোল (admin/ceo/superadmin) শুধু superadmin সামলাতে পারবে */
const assertCanManageRole = (actor: AuthUser | undefined, role: string) => {
  if ((STAFF_ROLES as string[]).includes(role) && !isSuper(actor)) throw new ApiError(403, "অ্যাডমিন/সিইও শুধুমাত্র Super Admin পরিচালনা করতে পারেন");
};

const profile = {
  name: z.string().trim().min(2, "নাম দিন").max(80),
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(120).optional().or(z.literal("")),
  avatar: imageUrl.optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  dateOfBirth: z.union([z.coerce.date(), z.literal(""), z.null()]).optional().transform((v) => v || undefined),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""]).optional(),
  institute: z.string().trim().max(150).optional(),
  department: z.string().trim().max(100).optional(),
  semester: z.string().trim().max(40).optional(),
  educationLevel: z.string().trim().max(80).optional(),
  fatherName: z.string().trim().max(80).optional(),
  guardianPhone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(250).optional(),
  designation: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(600).optional(),
  signature: imageUrl.optional(),
};

router.get("/users", requirePerm("students", "enrollments", "content", "finance", "courses"), async (req, res) => {
  const { page, limit, skip } = paging(req, 500);
  const f: Record<string, unknown> = {};
  const role = qstr(req.query.role);
  if (role === "staff") {
    if (!isSuper(req.user) && req.user!.role !== "ceo") throw new ApiError(403, "অনুমতি নেই");
    f.role = { $in: STAFF_ROLES };
  } else if (role && (ROLES as readonly string[]).includes(role)) {
    if ((STAFF_ROLES as string[]).includes(role) && !isSuper(req.user) && req.user!.role !== "ceo") throw new ApiError(403, "অনুমতি নেই");
    f.role = role;
  } else f.role = { $in: ["student", "teacher"] };
  const q = qstr(req.query.q);
  if (q) {
    const p = normalizePhone(q);
    const rx = new RegExp(escapeRegex(/^01\d+$/.test(p) ? p : q), "i");
    f.$or = [{ name: rx }, { phone: rx }, { studentId: rx }, { institute: rx }];
  }
  if (req.query.active === "false") f.isActive = false;
  const bg = qstr(req.query.bloodGroup);
  if (bg) f.bloodGroup = bg;
  const [items, total] = await Promise.all([User.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), User.countDocuments(f)]);
  ok(
    res,
    items.map((u) => ({ ...u, password: undefined, tokenVersion: undefined })),
    "সফল",
    200,
    { page, limit, total, pages: Math.ceil(total / limit) },
  );
});

router.get("/users/:id", requirePerm("students", "enrollments"), async (req, res) => {
  const user = await User.findById(objectId(req.params.id));
  if (!user) throw new ApiError(404, "ইউজার পাওয়া যায়নি");
  if ((STAFF_ROLES as string[]).includes(user.role) && !isSuper(req.user) && req.user!.role !== "ceo") throw new ApiError(403, "অনুমতি নেই");
  const [enrollments, payments, batches, earnings] = await Promise.all([
    Enrollment.find({ student: user._id }).sort({ createdAt: -1 }).populate("course", "title").populate("batch", "name").lean(),
    Payment.find({ student: user._id }).sort({ paidAt: -1 }).populate("course", "title").lean(),
    user.role === "teacher" ? Batch.find({ teachers: user._id }).populate("course", "title").lean() : [],
    user.role === "teacher" ? Expense.find({ teacher: user._id }).sort({ spentAt: -1 }).populate("batch", "name").lean() : [],
  ]);
  ok(res, { user, enrollments, payments, batches, earnings });
});

router.post("/users", requirePerm("students"), async (req, res) => {
  const b = parse(
    z.object({
      ...profile,
      phone: phoneSchema,
      role: z.enum(ROLES).default("student"),
      permissions: z.array(z.enum(PERMISSIONS)).optional(),
      password: passwordSchema.optional().or(z.literal("")),
      notify: z.boolean().default(true),
    }),
    req.body,
  );
  assertCanManageRole(req.user, b.role);
  if (await User.exists({ phone: b.phone })) throw new ApiError(409, "এই নম্বরে আগেই অ্যাকাউন্ট আছে");
  const plain = b.password || crypto.randomBytes(4).toString("hex");
  const { notify, password: _p, ...data } = b;
  const user = await User.create({
    ...data,
    permissions: b.role === "admin" ? b.permissions || [] : [],
    password: await bcrypt.hash(plain, config.bcryptRounds),
    isPhoneVerified: true,
    studentId: b.role === "student" ? await generateStudentId() : undefined,
  });
  if (notify) await sendSms(b.phone, `${config.appName} এ আপনার অ্যাকাউন্ট খোলা হয়েছে। লগইন: ${b.phone}, পাসওয়ার্ড: ${plain} — লগইন করে পাসওয়ার্ড বদলে নিন।`, "account", req.user!._id);
  audit(req, "create", "User", user._id, `${user.name} (${user.role})`);
  ok(res, { user, tempPassword: b.password ? undefined : plain }, "অ্যাকাউন্ট তৈরি হয়েছে", 201);
});

router.patch("/users/:id", requirePerm("students"), async (req, res) => {
  const b = parse(
    z
      .object({
        ...profile,
        phone: phoneSchema,
        role: z.enum(ROLES),
        permissions: z.array(z.enum(PERMISSIONS)),
        isActive: z.boolean(),
      })
      .partial(),
    req.body,
  );
  const user = await User.findById(objectId(req.params.id)).select("+tokenVersion");
  if (!user) throw new ApiError(404, "ইউজার পাওয়া যায়নি");
  assertCanManageRole(req.user, user.role);
  if (b.role) assertCanManageRole(req.user, b.role);
  if ((b.permissions || b.role) && !isSuper(req.user)) throw new ApiError(403, "রোল/পারমিশন শুধু Super Admin বদলাতে পারেন");
  if (String(user._id) === req.user!._id && (b.role || b.isActive === false)) throw new ApiError(400, "নিজের রোল বা স্ট্যাটাস বদলানো যাবে না");
  if (user.role === "superadmin" && (b.role && b.role !== "superadmin" || b.isActive === false)) {
    const supers = await User.countDocuments({ role: "superadmin", isActive: true });
    if (supers <= 1) throw new ApiError(400, "অন্তত একজন সক্রিয় Super Admin থাকতে হবে");
  }
  if (b.phone && b.phone !== user.phone && (await User.exists({ phone: b.phone }))) throw new ApiError(409, "এই নম্বরে আগেই অ্যাকাউন্ট আছে");

  const roleChanged = b.role && b.role !== user.role;
  Object.assign(user, b);
  if (b.role && b.role !== "admin") user.permissions = [];
  if (user.role === "student" && !user.studentId) user.studentId = await generateStudentId();
  // রোল বদলালে বা বন্ধ করলে পুরোনো সেশন বাতিল
  if (roleChanged || b.isActive === false || b.permissions) user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  audit(req, "update", "User", user._id, roleChanged ? `role → ${b.role}` : b.isActive === false ? "deactivated" : "");
  ok(res, user, "আপডেট হয়েছে");
});

router.post("/users/:id/reset-password", requirePerm("students"), async (req, res) => {
  const b = parse(z.object({ password: passwordSchema.optional().or(z.literal("")), notify: z.boolean().default(true) }), req.body);
  const user = await User.findById(objectId(req.params.id)).select("+tokenVersion");
  if (!user) throw new ApiError(404, "ইউজার পাওয়া যায়নি");
  assertCanManageRole(req.user, user.role as Role);
  const plain = b.password || crypto.randomBytes(4).toString("hex");
  user.password = await bcrypt.hash(plain, config.bcryptRounds);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.passwordChangedAt = new Date();
  await user.save();
  await User.updateOne({ _id: user._id }, { $set: { failedLogins: 0 }, $unset: { lockUntil: 1 } });
  if (b.notify) await sendSms(user.phone, `${config.appName}: আপনার নতুন পাসওয়ার্ড ${plain} — লগইন করে বদলে নিন।`, "account", req.user!._id);
  audit(req, "reset-password", "User", user._id);
  ok(res, { tempPassword: plain }, "পাসওয়ার্ড রিসেট হয়েছে");
});

router.delete("/users/:id", requirePerm("students"), async (req, res) => {
  if (!isSuper(req.user)) throw new ApiError(403, "অ্যাকাউন্ট মুছতে পারেন শুধু Super Admin");
  const id = objectId(req.params.id);
  if (id === req.user!._id) throw new ApiError(400, "নিজের অ্যাকাউন্ট মুছা যাবে না");
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "ইউজার পাওয়া যায়নি");
  const [e, p] = await Promise.all([Enrollment.countDocuments({ student: id }), Payment.countDocuments({ student: id })]);
  if (e || p) throw new ApiError(400, "এই অ্যাকাউন্টে এনরোলমেন্ট/পেমেন্ট আছে — মুছার বদলে বন্ধ (Deactivate) করুন");
  if (user.role === "superadmin" && (await User.countDocuments({ role: "superadmin" })) <= 1) throw new ApiError(400, "শেষ Super Admin মুছা যাবে না");
  await user.deleteOne();
  audit(req, "delete", "User", id, `${user.name} (${user.role})`);
  ok(res, {}, "অ্যাকাউন্ট মুছে ফেলা হয়েছে");
});

export default router;
