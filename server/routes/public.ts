import { Router } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import { z } from "zod";
import { config } from "../config";
import { ApiError } from "../lib/errors";
import { ok, parse, escapeRegex, qstr, paging, clientIp, objectIdStr } from "../lib/http";
import { basePrice, applyPromo } from "../lib/pricing";
import { optionalAuth } from "../middleware/auth";
import { trackLimiter } from "../middleware/security";
import { Category, Course, Batch } from "../models/Catalog";
import { Banner, Gallery, Topper, Attachment, Review, Certificate, Setting, getSettings } from "../models/Content";
import { User } from "../models/User";
import { Enrollment, Payment, Expense } from "../models/Finance";
import { Visit } from "../models/System";
import { getArchitectural } from "../models/Architectural";

const router = Router();

const PUBLIC_SETTINGS =
  "siteName tagline logo phone phone2 email address mapEmbedUrl facebook youtube whatsapp linkedin aboutText paymentInstructions bkashNumber nagadNumber stats";

const courseCard = "title slug thumbnail shortDescription price discountPrice offerText duration totalClasses mode category isFeatured views maxSeats enrollmentOpen";

const ACTIVE = ["pending", "approved"];
const COUNTED = ["pending", "approved", "completed"];

/** কোর্স কার্ডে — মোট ভর্তি (সম্পন্নসহ) ও বর্তমানে সিট নেওয়া শিক্ষার্থী */
async function withEnrollCounts<T extends { _id: unknown; maxSeats?: number }>(courses: T[]) {
  if (!courses.length) return courses;
  const rows = await Enrollment.aggregate([
    { $match: { course: { $in: courses.map((c) => c._id) }, status: { $in: COUNTED } } },
    { $group: { _id: "$course", students: { $sum: 1 }, active: { $sum: { $cond: [{ $in: ["$status", ACTIVE] }, 1, 0] } } } },
  ]);
  const map = new Map(rows.map((r) => [String(r._id), r]));
  return courses.map((c) => {
    const r = map.get(String(c._id));
    return { ...c, enrolledCount: r?.students || 0, seatsTaken: r?.active || 0 };
  });
}

const reviewQuery = (filter: Record<string, unknown>, limit: number) =>
  Review.find({ ...filter, isApproved: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({ path: "student", select: "name avatar institute" })
    .populate({ path: "course", select: "title slug" })
    .lean();

router.get("/settings", async (_req, res) => {
  const s = await getSettings();
  ok(res, await Setting.findById(s._id).select(PUBLIC_SETTINGS).lean());
});

router.get("/home", async (_req, res) => {
  const s = await getSettings();
  const [settings, banners, categories, courses, gallery, toppers, attachments, reviews] = await Promise.all([
    Setting.findById(s._id).select(PUBLIC_SETTINGS).lean(),
    Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean(),
    Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
    Course.find({ isPublished: true }).sort({ isFeatured: -1, order: 1, createdAt: -1 }).limit(8).select(courseCard).populate("category", "name slug").lean(),
    Gallery.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).limit(12).lean(),
    Topper.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(12)
      .populate({ path: "student", select: "name avatar studentId institute" })
      .populate({ path: "course", select: "title slug" })
      .populate({ path: "batch", select: "name code" })
      .lean(),
    Attachment.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean(),
    reviewQuery({}, 12),
  ]);
  const [coursesWithCounts, courseCounts, architectural] = await Promise.all([
    withEnrollCounts(courses),
    Course.aggregate([{ $match: { isPublished: true } }, { $group: { _id: "$category", n: { $sum: 1 } } }]),
    getArchitectural(),
  ]);
  const catCount = new Map(courseCounts.map((r) => [String(r._id), r.n as number]));
  ok(res, {
    settings,
    banners,
    categories: categories.map((c) => ({ ...c, courseCount: catCount.get(String(c._id)) || 0 })),
    courses: coursesWithCounts,
    gallery,
    toppers,
    attachments,
    reviews,
    architectural: architectural.isActive ? { hero: architectural.hero, services: architectural.services.slice(0, 4), projects: architectural.projects.slice(0, 3) } : null,
  });
});

router.get("/categories", async (_req, res) => {
  ok(res, await Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean());
});

router.get("/courses", async (req, res) => {
  const { page, limit, skip } = paging(req, 60);
  const filter: Record<string, unknown> = { isPublished: true };
  const cat = qstr(req.query.category);
  if (cat) {
    const c = await Category.findOne({ slug: cat }).select("_id").lean();
    filter.category = c?._id || new mongoose.Types.ObjectId();
  }
  const q = qstr(req.query.q);
  if (q) filter.title = new RegExp(escapeRegex(q), "i");
  const [items, total] = await Promise.all([
    Course.find(filter).sort({ isFeatured: -1, order: 1, createdAt: -1 }).skip(skip).limit(limit).select(courseCard).populate("category", "name slug").lean(),
    Course.countDocuments(filter),
  ]);
  ok(res, await withEnrollCounts(items), "সফল", 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

router.get("/courses/:slug", async (req, res) => {
  const course = await Course.findOne({ slug: String(req.params.slug), isPublished: true })
    .populate("category", "name slug")
    .populate({ path: "instructors", select: "name avatar designation bio" })
    .lean();
  if (!course) throw new ApiError(404, "কোর্স পাওয়া যায়নি");
  const [batches, reviews, ratingAgg, related] = await Promise.all([
    Batch.find({ course: course._id, status: { $in: ["upcoming", "running"] }, isEnrollOpen: true })
      .sort({ startDate: 1 })
      .select("name code startDate schedule seatLimit fee status")
      .lean(),
    reviewQuery({ course: course._id }, 20),
    Review.aggregate([{ $match: { course: course._id, isApproved: true } }, { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }]),
    Course.find({ isPublished: true, category: course.category, _id: { $ne: course._id } }).limit(3).select(courseCard).lean(),
  ]);
  // সিট ও ভর্তির হিসাব
  const batchIds = batches.map((b) => b._id);
  const [counts, batchCounts] = await Promise.all([
    Enrollment.aggregate([
      { $match: { course: course._id, status: { $in: COUNTED } } },
      { $group: { _id: null, students: { $sum: 1 }, active: { $sum: { $cond: [{ $in: ["$status", ACTIVE] }, 1, 0] } } } },
    ]),
    batchIds.length
      ? Enrollment.aggregate([{ $match: { batch: { $in: batchIds }, status: { $in: ACTIVE } } }, { $group: { _id: "$batch", n: { $sum: 1 } } }])
      : Promise.resolve([] as { _id: unknown; n: number }[]),
  ]);
  const bMap = new Map(batchCounts.map((r) => [String(r._id), r.n as number]));
  const batchesOut = batches.map((b) => ({ ...b, enrolled: bMap.get(String(b._id)) || 0 }));
  const batchSeats = batches.every((b) => (b.seatLimit || 0) > 0) ? batches.reduce((a, b) => a + (b.seatLimit || 0), 0) : 0;
  const seats = {
    enrolled: counts[0]?.students || 0, // মোট ভর্তি (সম্পন্নসহ)
    taken: course.maxSeats ? counts[0]?.active || 0 : batchesOut.reduce((a, b) => a + b.enrolled, 0), // এখনকার ইনটেকে সিট নেওয়া
    max: course.maxSeats || batchSeats, // 0 = সীমাহীন
  };
  ok(res, { ...course, batches: batchesOut, seats, reviews, rating: ratingAgg[0] ? { avg: Math.round(ratingAgg[0].avg * 10) / 10, count: ratingAgg[0].count } : { avg: 0, count: 0 }, related: await withEnrollCounts(related) });
});

router.get("/architectural", async (_req, res) => {
  const a = await getArchitectural();
  if (!a.isActive) throw new ApiError(404, "Page not available");
  ok(res, a);
});

router.get("/gallery", async (_req, res) => ok(res, await Gallery.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean()));
router.get("/attachments", async (_req, res) => ok(res, await Attachment.find({ isActive: true }).sort({ order: 1 }).lean()));
router.get("/reviews", async (_req, res) => ok(res, await reviewQuery({}, 60)));
router.get("/toppers", async (_req, res) =>
  ok(
    res,
    await Topper.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .populate({ path: "student", select: "name avatar studentId institute" })
      .populate({ path: "course", select: "title slug" })
      .populate({ path: "batch", select: "name code" })
      .lean(),
  ),
);

// প্রোমো কোড যাচাই (এনরোল পেজে)
router.post("/promo/validate", trackLimiter, async (req, res) => {
  const { code, courseId, batchId } = parse(z.object({ code: z.string().trim().min(1).max(30), courseId: objectIdStr, batchId: objectIdStr.optional().or(z.literal("")) }), req.body);
  const course = await Course.findById(courseId).lean();
  if (!course) throw new ApiError(404, "কোর্স পাওয়া যায়নি");
  const batch = batchId ? await Batch.findOne({ _id: batchId, course: course._id }).lean() : null;
  const fee = basePrice(course, batch);
  const { discount, promo } = await applyPromo(code, course, fee);
  ok(res, { fee, discount, payable: fee - discount, code: promo?.code }, `প্রোমো কোড প্রয়োগ হয়েছে — ৳${discount} ছাড়`);
});

// সার্টিফিকেট যাচাই — সার্টিফিকেট নম্বর বা স্টুডেন্ট আইডি দিয়ে
router.get("/certificates/verify", trackLimiter, async (req, res) => {
  const q = qstr(req.query.q)?.toUpperCase().slice(0, 40);
  if (!q) throw new ApiError(400, "সার্টিফিকেট নম্বর বা স্টুডেন্ট আইডি দিন");
  const student = await User.findOne({ studentId: q }).select("_id").lean();
  const certs = await Certificate.find({ isRevoked: false, $or: [{ certificateNo: q }, ...(student ? [{ student: student._id }] : [])] })
    .select("certificateNo studentName courseTitle batchName issueDate grade isTopper")
    .sort({ issueDate: -1 })
    .lean();
  ok(res, certs, certs.length ? "সার্টিফিকেট পাওয়া গেছে" : "কোনো সার্টিফিকেট পাওয়া যায়নি");
});

router.get("/certificates/:no", trackLimiter, async (req, res) => {
  const cert = await Certificate.findOne({ certificateNo: String(req.params.no).toUpperCase().slice(0, 40), isRevoked: false })
    .populate({ path: "student", select: "name studentId avatar" })
    .lean();
  if (!cert) throw new ApiError(404, "সার্টিফিকেট পাওয়া যায়নি");
  const s = await getSettings();
  ok(res, { ...cert, siteName: s.siteName, logo: s.logo, certificateText: s.certificateText, ceoTitle: s.ceoTitle });
});

// ---------- পেমেন্ট রসিদ (এসএমএসের লিংক থেকে) ----------
const maskPhone = (p: string) => (p.length > 6 ? `${p.slice(0, 3)}${"*".repeat(p.length - 6)}${p.slice(-3)}` : p);

router.get("/receipts/:token", trackLimiter, async (req, res) => {
  const token = String(req.params.token);
  if (!/^[\w-]{8,40}$/.test(token)) throw new ApiError(404, "রসিদ পাওয়া যায়নি");
  // রসিদ ব্রাউজার/প্রক্সিতে ক্যাশ হবে না, সার্চ ইঞ্জিনেও যাবে না
  res.set({ "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" });
  const s = await getSettings();
  const site = { name: s.siteName, logo: s.logo, phone: s.phone, phone2: s.phone2, email: s.email, address: s.address };

  const p = await Payment.findOne({ receiptToken: token })
    .populate("course", "title")
    .populate("batch", "name")
    .populate("student", "studentId")
    .populate("receivedBy", "name")
    .lean();
  if (!p) {
    // শিক্ষকের পেমেন্ট রসিদ
    const x = await Expense.findOne({ receiptToken: token, type: "teacher_payment", teacher: { $exists: true } })
      .populate("teacher", "name phone")
      .populate("batch", "name")
      .populate("createdBy", "name")
      .lean();
    if (!x) throw new ApiError(404, "রসিদ পাওয়া যায়নি");
    const t = (x.teacher as { name?: string; phone?: string } | null) || {};
    return ok(res, {
      kind: "teacher",
      receiptNo: `TP${String(x._id).slice(-8).toUpperCase()}`,
      amount: x.amount,
      method: x.method,
      note: x.title + (x.note ? ` — ${x.note}` : ""),
      paidAt: x.spentAt,
      receivedBy: (x.createdBy as { name?: string } | null)?.name || "",
      batch: (x.batch as { name?: string } | null)?.name || "",
      name: t.name || "",
      phone: maskPhone(t.phone || ""),
      site,
    });
  }
  const e = await Enrollment.findById(p.enrollment).select("fullName phone payable").lean();
  // এই রসিদ পর্যন্ত মোট জমা (পরের পেমেন্ট বাদে)
  const upto = await Payment.aggregate([
    { $match: { enrollment: p.enrollment, $or: [{ paidAt: { $lt: p.paidAt } }, { paidAt: p.paidAt, _id: { $lte: p._id } }] } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const paidUpto = upto[0]?.total || p.amount;
  const payable = e?.payable || 0;
  ok(res, {
    kind: "student",
    receiptNo: p.receiptNo,
    amount: p.amount,
    method: p.method,
    trxId: p.trxId,
    note: p.note,
    paidAt: p.paidAt,
    receivedBy: (p.receivedBy as { name?: string } | null)?.name || "",
    course: (p.course as { title?: string } | null)?.title || "",
    batch: (p.batch as { name?: string } | null)?.name || "",
    studentId: (p.student as { studentId?: string } | null)?.studentId || "",
    name: e?.fullName || "",
    phone: maskPhone(e?.phone || ""),
    payable,
    paid: paidUpto,
    due: Math.max(0, payable - paidUpto),
    site,
  });
});

// ---------- ভিজিটর ট্র্যাকিং ----------
const deviceOf = (ua: string) =>
  /bot|crawl|spider|slurp|lighthouse/i.test(ua) ? "bot" : /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop";
const browserOf = (ua: string) =>
  /edg\//i.test(ua) ? "Edge" : /opr\//i.test(ua) ? "Opera" : /chrome/i.test(ua) ? "Chrome" : /firefox/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Other";

router.post("/track", trackLimiter, optionalAuth, async (req, res) => {
  const body = parse(
    z.object({
      path: z.string().trim().min(1).max(300),
      visitorId: z.string().trim().max(64).regex(/^[\w-]*$/).optional(),
      referrer: z.string().trim().max(300).optional(),
      courseSlug: z.string().trim().max(100).optional(),
    }),
    req.body,
  );
  const ua = req.get("user-agent") || "";
  const device = deviceOf(ua);
  if (device !== "bot" && !body.path.startsWith("/admin")) {
    let course;
    if (body.courseSlug) {
      course = await Course.findOneAndUpdate({ slug: body.courseSlug }, { $inc: { views: 1 } }).select("_id").lean();
    }
    const ipHash = crypto.createHmac("sha256", config.jwt.secret).update(clientIp(req)).digest("hex").slice(0, 32);
    await Visit.create({
      path: body.path,
      visitorId: body.visitorId || ipHash,
      ipHash,
      user: req.user?._id,
      course: course?._id,
      referrer: body.referrer || "",
      device,
      browser: browserOf(ua),
    });
  }
  res.status(204).end();
});

export default router;
