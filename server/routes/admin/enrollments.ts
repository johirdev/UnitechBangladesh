import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { z } from "zod";
import { config } from "../../config";
import { ApiError } from "../../lib/errors";
import { ok, parse, paging, qstr, escapeRegex, objectId, objectIdStr, phoneSchema, normalizePhone } from "../../lib/http";
import { audit } from "../../lib/audit";
import { autoSms } from "../../lib/notify";
import { sendSms } from "../../lib/sms";
import { basePrice, applyPromo, reservePromo } from "../../lib/pricing";
import { requirePerm, hasPerm } from "../../middleware/auth";
import { User, generateStudentId, nextSeq } from "../../models/User";
import { Course, Batch } from "../../models/Catalog";
import { Enrollment, Payment, PAY_METHODS, receiptUrl } from "../../models/Finance";

type OID = mongoose.Types.ObjectId;
/** populate হোক বা না হোক, ObjectId বের করে */
const idOf = (v: unknown) => ((v as { _id?: OID })?._id ?? v) as OID;

const router = Router();

const populateEnroll = [
  { path: "student", select: "name phone avatar studentId bloodGroup institute" },
  { path: "course", select: "title slug thumbnail" },
  { path: "batch", select: "name code startDate status" },
];

export async function findOrCreateStudent(phone: string, name: string, notify: boolean, sentBy?: unknown) {
  let user = await User.findOne({ phone });
  if (user) {
    if (!user.studentId && user.role === "student") {
      user.studentId = await generateStudentId();
      await user.save();
    }
    return { user, created: false };
  }
  const tempPass = crypto.randomBytes(4).toString("hex"); // ৮ অক্ষরের অস্থায়ী পাসওয়ার্ড
  user = await User.create({
    name,
    phone,
    password: await bcrypt.hash(tempPass, config.bcryptRounds),
    role: "student",
    isPhoneVerified: true,
    studentId: await generateStudentId(),
  });
  if (notify) {
    await sendSms(phone, `${config.appName} এ আপনার অ্যাকাউন্ট খোলা হয়েছে। লগইন: ${phone}, পাসওয়ার্ড: ${tempPass} — লগইন করে পাসওয়ার্ড বদলে নিন।`, "account", sentBy);
  }
  return { user, created: true, tempPass };
}

// ---------- এনরোলমেন্ট লিস্ট ----------
router.get("/enrollments", requirePerm("enrollments", "finance", "certificates", "sms"), async (req, res) => {
  const { page, limit, skip } = paging(req, 500);
  const f: Record<string, unknown> = {};
  for (const k of ["course", "batch", "student"] as const) {
    const v = qstr(req.query[k]);
    if (v && mongoose.isValidObjectId(v)) f[k] = new mongoose.Types.ObjectId(v);
  }
  const st = qstr(req.query.status);
  if (st) f.status = st;
  const q = qstr(req.query.q);
  if (q) {
    const rx = new RegExp(escapeRegex(normalizePhone(q).startsWith("01") ? normalizePhone(q) : q), "i");
    f.$or = [{ fullName: rx }, { phone: rx }, { paymentTrxId: rx }];
  }
  if (req.query.due === "true") f.$expr = { $gt: ["$payable", "$paid"] };

  const [items, total, sum] = await Promise.all([
    Enrollment.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(populateEnroll).lean(),
    Enrollment.countDocuments(f),
    Enrollment.aggregate([{ $match: f }, { $group: { _id: null, payable: { $sum: "$payable" }, paid: { $sum: "$paid" } } }]),
  ]);
  ok(res, items, "সফল", 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    summary: { payable: sum[0]?.payable || 0, paid: sum[0]?.paid || 0, due: Math.max(0, (sum[0]?.payable || 0) - (sum[0]?.paid || 0)) },
  });
});

router.get("/enrollments/:id", requirePerm("enrollments", "finance"), async (req, res) => {
  const e = await Enrollment.findById(objectId(req.params.id)).populate(populateEnroll).lean();
  if (!e) throw new ApiError(404, "এনরোলমেন্ট পাওয়া যায়নি");
  const payments = await Payment.find({ enrollment: e._id }).sort({ paidAt: -1 }).populate("receivedBy", "name").lean();
  ok(res, { ...e, payments });
});

// ---------- অফিস থেকে ম্যানুয়াল ভর্তি ----------
router.post("/enrollments", requirePerm("enrollments"), async (req, res) => {
  const b = parse(
    z.object({
      phone: phoneSchema,
      fullName: z.string().trim().min(2, "নাম দিন").max(80),
      email: z.string().trim().email().max(120).optional().or(z.literal("")),
      courseId: objectIdStr,
      batchId: objectIdStr.optional().or(z.literal("")),
      education: z.string().trim().max(120).optional(),
      institute: z.string().trim().max(150).optional(),
      address: z.string().trim().max(250).optional(),
      fee: z.coerce.number().min(0).optional(),
      discount: z.coerce.number().min(0).optional(),
      promoCode: z.string().trim().max(30).optional(),
      note: z.string().trim().max(500).optional(),
      status: z.enum(["pending", "approved"]).default("approved"),
      initialPayment: z.coerce.number().min(0).optional(),
      method: z.enum(PAY_METHODS).optional(),
      trxId: z.string().trim().max(60).optional(),
      notify: z.boolean().default(true),
    }),
    req.body,
  );
  const course = await Course.findById(b.courseId);
  if (!course) throw new ApiError(404, "কোর্স পাওয়া যায়নি");
  const batch = b.batchId ? await Batch.findOne({ _id: b.batchId, course: course._id }) : null;
  if (b.batchId && !batch) throw new ApiError(400, "ব্যাচটি এই কোর্সের নয়");

  const { user, created } = await findOrCreateStudent(b.phone, b.fullName, b.notify, req.user!._id);
  if (user.role !== "student") throw new ApiError(400, "এই নম্বরটি একজন স্টাফের — শিক্ষার্থী হিসেবে ভর্তি করা যাবে না");
  if (await Enrollment.exists({ student: user._id, course: course._id, status: { $in: ["pending", "approved"] } }))
    throw new ApiError(409, "এই শিক্ষার্থী ইতিমধ্যে এই কোর্সে ভর্তি আছে");

  const fee = b.fee ?? basePrice(course, batch);
  let discount = b.discount || 0;
  let promoCode = "";
  if (b.promoCode) {
    const p = await applyPromo(b.promoCode, course, fee);
    discount += p.discount;
    promoCode = p.promo?.code || "";
    if (p.promo && !(await reservePromo(p.promo._id))) throw new ApiError(400, "প্রোমো কোডের ব্যবহার সীমা শেষ");
  }
  discount = Math.min(discount, fee);

  const e = await Enrollment.create({
    student: user._id,
    course: course._id,
    batch: batch?._id,
    fullName: b.fullName,
    phone: user.phone,
    email: b.email || user.email || "",
    education: b.education || "",
    institute: b.institute || "",
    address: b.address || "",
    note: b.note || "",
    fee,
    discount,
    promoCode,
    payable: fee - discount,
    status: b.status,
    source: "admin",
  });

  if (b.initialPayment && b.initialPayment > 0) {
    await addPayment(e._id, { amount: b.initialPayment, method: b.method || "cash", trxId: b.trxId || "", note: "ভর্তির সময় জমা" }, req.user!._id, false);
  }
  const fresh = await Enrollment.findById(e._id).populate(populateEnroll);
  if (b.notify) await autoSms(b.status === "approved" ? "approve" : "enroll", fresh!.toObject() as never, {}, req.user!._id);
  audit(req, "create", "Enrollment", e._id, `${b.fullName} → ${course.title}${created ? " (নতুন অ্যাকাউন্ট)" : ""}`);
  ok(res, fresh, created ? "ভর্তি সম্পন্ন — নতুন অ্যাকাউন্ট খোলা হয়েছে" : "ভর্তি সম্পন্ন", 201);
});

router.patch("/enrollments/:id", requirePerm("enrollments"), async (req, res) => {
  const b = parse(
    z.object({
      batch: objectIdStr.or(z.literal("")).optional(),
      status: z.enum(["pending", "approved", "completed", "cancelled", "rejected"]).optional(),
      fee: z.coerce.number().min(0).optional(),
      discount: z.coerce.number().min(0).optional(),
      fullName: z.string().trim().min(2).max(80).optional(),
      email: z.string().trim().max(120).optional(),
      education: z.string().trim().max(120).optional(),
      institute: z.string().trim().max(150).optional(),
      address: z.string().trim().max(250).optional(),
      note: z.string().trim().max(500).optional(),
      notify: z.boolean().optional(),
    }),
    req.body,
  );
  const e = await Enrollment.findById(objectId(req.params.id));
  if (!e) throw new ApiError(404, "এনরোলমেন্ট পাওয়া যায়নি");
  const prevStatus = e.status;

  if (b.batch !== undefined) {
    if (b.batch) {
      const batch = await Batch.findOne({ _id: b.batch, course: e.course });
      if (!batch) throw new ApiError(400, "ব্যাচটি এই কোর্সের নয়");
      e.batch = batch._id;
    } else e.batch = undefined;
  }
  if ((b.fee !== undefined || b.discount !== undefined) && !hasPerm(req.user, "finance") && !hasPerm(req.user, "enrollments"))
    throw new ApiError(403, "ফি পরিবর্তনের অনুমতি নেই");
  if (b.fee !== undefined) e.fee = b.fee;
  if (b.discount !== undefined) e.discount = Math.min(b.discount, e.fee);
  e.payable = Math.max(0, e.fee - e.discount);
  for (const k of ["fullName", "email", "education", "institute", "address", "note"] as const) if (b[k] !== undefined) e[k] = b[k]!;
  if (b.status) {
    e.status = b.status;
    if (b.status === "completed" && !e.completedAt) e.completedAt = new Date();
  }
  await e.save();
  await e.populate(populateEnroll);

  if (b.notify !== false && b.status && b.status !== prevStatus) {
    if (b.status === "approved") await autoSms("approve", e.toObject() as never, {}, req.user!._id);
    if (b.status === "completed") await autoSms("complete", e.toObject() as never, {}, req.user!._id);
  }
  audit(req, "update", "Enrollment", e._id, b.status ? `status: ${prevStatus} → ${b.status}` : "");
  ok(res, e, "এনরোলমেন্ট আপডেট হয়েছে");
});

router.delete("/enrollments/:id", requirePerm("finance"), async (req, res) => {
  const id = objectId(req.params.id);
  const paid = await Payment.countDocuments({ enrollment: id });
  if (paid > 0) throw new ApiError(400, "এই এনরোলমেন্টে পেমেন্ট আছে — আগে পেমেন্টগুলো মুছুন অথবা স্ট্যাটাস 'cancelled' করুন");
  await Enrollment.findByIdAndDelete(id);
  audit(req, "delete", "Enrollment", id);
  ok(res, {}, "এনরোলমেন্ট মুছে ফেলা হয়েছে");
});

// ---------- পেমেন্ট ----------
async function addPayment(
  enrollmentId: unknown,
  p: { amount: number; method: (typeof PAY_METHODS)[number]; trxId?: string; note?: string; paidAt?: Date },
  receivedBy: unknown,
  notify: boolean,
) {
  const e = await Enrollment.findById(enrollmentId).populate(populateEnroll);
  if (!e) throw new ApiError(404, "এনরোলমেন্ট পাওয়া যায়নি");
  const due = Math.max(0, e.payable - e.paid);
  if (p.amount > due) throw new ApiError(400, `বকেয়া ৳${due} এর বেশি জমা নেওয়া যাবে না`);
  const yr = String(new Date().getFullYear()).slice(2);
  const payment = await Payment.create({
    enrollment: e._id,
    student: idOf(e.student),
    course: idOf(e.course),
    batch: e.batch ? idOf(e.batch) : undefined,
    amount: p.amount,
    method: p.method,
    trxId: p.trxId || "",
    note: p.note || "",
    paidAt: p.paidAt || new Date(),
    receiptNo: `R${yr}${String(await nextSeq(`receipt-${yr}`)).padStart(5, "0")}`,
    receivedBy: receivedBy as OID,
  });
  e.paid += p.amount;
  if (e.status === "pending") e.status = "approved";
  await e.save();
  if (notify) await autoSms("payment", e.toObject() as never, { amount: p.amount, receipt: receiptUrl(payment.receiptToken!) }, receivedBy);
  return { payment, enrollment: e };
}

router.post("/enrollments/:id/payments", requirePerm("enrollments", "finance"), async (req, res) => {
  const b = parse(
    z.object({
      amount: z.coerce.number().min(1, "টাকার পরিমাণ দিন"),
      method: z.enum(PAY_METHODS).default("cash"),
      trxId: z.string().trim().max(60).optional(),
      note: z.string().trim().max(300).optional(),
      paidAt: z.union([z.coerce.date(), z.literal("")]).optional().transform((v) => v || undefined),
      notify: z.boolean().default(true),
    }),
    req.body,
  );
  const r = await addPayment(objectId(req.params.id), b, req.user!._id, b.notify);
  audit(req, "create", "Payment", r.payment._id, `৳${b.amount} (${b.method})`);
  ok(res, r, `৳${b.amount} জমা নেওয়া হয়েছে`, 201);
});

router.get("/payments", requirePerm("finance", "enrollments"), async (req, res) => {
  const { page, limit, skip } = paging(req, 500);
  const f: Record<string, unknown> = {};
  for (const k of ["course", "batch", "student"] as const) {
    const v = qstr(req.query[k]);
    if (v && mongoose.isValidObjectId(v)) f[k] = new mongoose.Types.ObjectId(v);
  }
  const m = qstr(req.query.method);
  if (m) f.method = m;
  const from = qstr(req.query.from),
    to = qstr(req.query.to);
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from && !isNaN(Date.parse(from))) range.$gte = new Date(from);
    if (to && !isNaN(Date.parse(to))) range.$lte = new Date(new Date(to).getTime() + 86_399_999);
    f.paidAt = range;
  }
  const q = qstr(req.query.q);
  if (q) f.$or = [{ receiptNo: new RegExp(escapeRegex(q), "i") }, { trxId: new RegExp(escapeRegex(q), "i") }];
  const [items, total, sum] = await Promise.all([
    Payment.find(f)
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("student", "name phone studentId")
      .populate("course", "title")
      .populate("batch", "name")
      .populate("receivedBy", "name")
      .lean(),
    Payment.countDocuments(f),
    Payment.aggregate([{ $match: f }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
  ]);
  ok(res, items, "সফল", 200, { page, limit, total, pages: Math.ceil(total / limit), sum: sum[0]?.total || 0 });
});

router.delete("/payments/:id", requirePerm("finance"), async (req, res) => {
  const p = await Payment.findById(objectId(req.params.id));
  if (!p) throw new ApiError(404, "পেমেন্ট পাওয়া যায়নি");
  await Enrollment.updateOne({ _id: p.enrollment }, { $inc: { paid: -p.amount } });
  await p.deleteOne();
  audit(req, "delete", "Payment", p._id, `৳${p.amount} receipt ${p.receiptNo}`);
  ok(res, {}, "পেমেন্ট মুছে ফেলা হয়েছে");
});

export default router;
