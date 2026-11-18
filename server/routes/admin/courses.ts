import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { ApiError } from "../../lib/errors";
import { ok, parse, paging, qstr, escapeRegex, objectId, objectIdStr, imageUrl, linkUrl, slugify } from "../../lib/http";
import { audit } from "../../lib/audit";
import { requirePerm } from "../../middleware/auth";
import { Course, Batch } from "../../models/Catalog";
import { Enrollment, Payment, Expense } from "../../models/Finance";

const router = Router();
const s = (max: number) => z.string().trim().max(max);
const strList = (max: number) => z.array(s(max)).max(60).optional();

const courseSchema = z.object({
  title: s(150).min(3, "কোর্সের নাম দিন"),
  slug: s(80).optional(),
  category: objectIdStr,
  thumbnail: imageUrl.optional(),
  images: z.array(imageUrl).max(20).optional(),
  introVideo: linkUrl.optional(),
  videos: z.array(z.object({ title: s(150), url: linkUrl })).max(30).optional(),
  shortDescription: s(300).optional(),
  description: s(10000).optional(),
  price: z.coerce.number().min(0, "দাম দিন"),
  discountPrice: z.coerce.number().min(0).optional(),
  offerText: s(120).optional(),
  offerEndsAt: z.union([z.coerce.date(), z.literal(""), z.null()]).optional().transform((v) => v || null),
  duration: s(60).optional(),
  totalClasses: z.coerce.number().int().min(0).optional(),
  classSchedule: s(200).optional(),
  mode: z.enum(["offline", "online", "hybrid"]).optional(),
  level: s(60).optional(),
  language: s(40).optional(),
  tools: z.array(z.object({ name: s(60), icon: imageUrl.optional() })).max(40).optional(),
  projects: z.array(z.object({ title: s(150), description: s(500).optional(), image: imageUrl.optional() })).max(40).optional(),
  curriculum: z.array(z.object({ title: s(150), lessons: z.array(s(200)).max(60) })).max(60).optional(),
  features: strList(200),
  requirements: strList(200),
  whoFor: strList(200),
  faqs: z.array(z.object({ q: s(250), a: s(1000) })).max(40).optional(),
  instructors: z.array(objectIdStr).max(20).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  enrollmentOpen: z.boolean().optional(),
  maxSeats: z.coerce.number().int().min(0).max(100000).optional(),
  order: z.coerce.number().int().min(0).optional(),
});

async function uniqueSlug(base: string, id?: string) {
  let slug = slugify(base);
  if (await Course.exists({ slug, ...(id ? { _id: { $ne: id } } : {}) })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  return slug;
}

// ---------- কোর্স ----------
router.get("/courses", requirePerm("courses", "enrollments", "finance", "certificates", "content"), async (req, res) => {
  const { page, limit, skip } = paging(req, 500);
  const f: Record<string, unknown> = {};
  const q = qstr(req.query.q);
  if (q) f.title = new RegExp(escapeRegex(q), "i");
  const cat = qstr(req.query.category);
  if (cat && mongoose.isValidObjectId(cat)) f.category = cat;
  const [items, total] = await Promise.all([
    Course.find(f).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).select("-description -curriculum -faqs").populate("category", "name").lean(),
    Course.countDocuments(f),
  ]);
  const ids = items.map((c) => c._id);
  const counts = await Enrollment.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: "$course", n: { $sum: 1 } } }]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  ok(
    res,
    items.map((c) => ({ ...c, enrollments: map.get(String(c._id)) || 0 })),
    "সফল",
    200,
    { page, limit, total, pages: Math.ceil(total / limit) },
  );
});

router.get("/courses/:id", requirePerm("courses"), async (req, res) => {
  const c = await Course.findById(objectId(req.params.id)).lean();
  if (!c) throw new ApiError(404, "কোর্স পাওয়া যায়নি");
  ok(res, c);
});

router.post("/courses", requirePerm("courses"), async (req, res) => {
  const d = parse(courseSchema, req.body);
  d.slug = await uniqueSlug(d.slug || d.title);
  const c = await Course.create(d);
  audit(req, "create", "Course", c._id, c.title);
  ok(res, c, "কোর্স তৈরি হয়েছে", 201);
});

router.patch("/courses/:id", requirePerm("courses"), async (req, res) => {
  const id = objectId(req.params.id);
  const d = parse(courseSchema.partial(), req.body);
  if (d.slug !== undefined) d.slug = await uniqueSlug(d.slug || d.title || "course", id);
  const c = await Course.findByIdAndUpdate(id, { $set: d }, { new: true, runValidators: true });
  if (!c) throw new ApiError(404, "কোর্স পাওয়া যায়নি");
  audit(req, "update", "Course", id, c.title);
  ok(res, c, "কোর্স আপডেট হয়েছে");
});

router.delete("/courses/:id", requirePerm("courses"), async (req, res) => {
  const id = objectId(req.params.id);
  const n = await Enrollment.countDocuments({ course: id });
  if (n > 0) throw new ApiError(400, `এই কোর্সে ${n}টি এনরোলমেন্ট আছে — মুছা যাবে না, বরং "Unpublish" করুন`);
  await Batch.deleteMany({ course: id });
  await Course.findByIdAndDelete(id);
  audit(req, "delete", "Course", id);
  ok(res, {}, "কোর্স মুছে ফেলা হয়েছে");
});

// ---------- ব্যাচ ----------
const batchSchema = z.object({
  course: objectIdStr,
  name: s(80).min(1, "ব্যাচের নাম দিন"),
  code: s(30).optional(),
  teachers: z.array(objectIdStr).max(10).optional(),
  startDate: z.union([z.coerce.date(), z.literal(""), z.null()]).optional().transform((v) => v || null),
  endDate: z.union([z.coerce.date(), z.literal(""), z.null()]).optional().transform((v) => v || null),
  schedule: s(200).optional(),
  room: s(60).optional(),
  seatLimit: z.coerce.number().int().min(0).optional(),
  fee: z.coerce.number().min(0).optional(),
  status: z.enum(["upcoming", "running", "completed", "cancelled"]).optional(),
  isEnrollOpen: z.boolean().optional(),
  note: s(500).optional(),
});

/** প্রতিটি ব্যাচের আয়-ব্যয়ের হিসাব */
export async function batchFinance(ids: mongoose.Types.ObjectId[]) {
  const [enr, pay, exp] = await Promise.all([
    Enrollment.aggregate([
      { $match: { batch: { $in: ids }, status: { $in: ["pending", "approved", "completed"] } } },
      {
        $group: {
          _id: "$batch",
          students: { $sum: { $cond: [{ $in: ["$status", ["approved", "completed"]] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          payable: { $sum: "$payable" },
        },
      },
    ]),
    Payment.aggregate([{ $match: { batch: { $in: ids } } }, { $group: { _id: "$batch", collected: { $sum: "$amount" } } }]),
    Expense.aggregate([{ $match: { batch: { $in: ids } } }, { $group: { _id: "$batch", expense: { $sum: "$amount" } } }]),
  ]);
  const m = new Map<string, { students: number; pending: number; payable: number; collected: number; expense: number; due: number; profit: number }>();
  for (const id of ids) m.set(String(id), { students: 0, pending: 0, payable: 0, collected: 0, expense: 0, due: 0, profit: 0 });
  for (const e of enr) Object.assign(m.get(String(e._id))!, { students: e.students, pending: e.pending, payable: e.payable });
  for (const p of pay) m.get(String(p._id))!.collected = p.collected;
  for (const x of exp) m.get(String(x._id))!.expense = x.expense;
  for (const v of m.values()) {
    v.due = Math.max(0, v.payable - v.collected);
    v.profit = v.collected - v.expense;
  }
  return m;
}

router.get("/batches", requirePerm("courses", "enrollments", "finance", "sms", "certificates", "content"), async (req, res) => {
  const f: Record<string, unknown> = {};
  const course = qstr(req.query.course);
  if (course && mongoose.isValidObjectId(course)) f.course = course;
  const st = qstr(req.query.status);
  if (st) f.status = st;
  const q = qstr(req.query.q);
  if (q) f.name = new RegExp(escapeRegex(q), "i");
  const items = await Batch.find(f).sort({ startDate: -1, createdAt: -1 }).limit(500).populate("course", "title price discountPrice").populate("teachers", "name").lean();
  const fin = await batchFinance(items.map((b) => b._id as mongoose.Types.ObjectId));
  ok(res, items.map((b) => ({ ...b, stats: fin.get(String(b._id)) })));
});

router.get("/batches/:id", requirePerm("courses", "enrollments", "finance"), async (req, res) => {
  const id = objectId(req.params.id);
  const batch = await Batch.findById(id).populate("course", "title slug price discountPrice").populate("teachers", "name phone avatar designation").lean();
  if (!batch) throw new ApiError(404, "ব্যাচ পাওয়া যায়নি");
  const [enrollments, payments, expenses, fin] = await Promise.all([
    Enrollment.find({ batch: id }).sort({ createdAt: -1 }).populate("student", "name avatar studentId phone").lean(),
    Payment.find({ batch: id }).sort({ paidAt: -1 }).populate("student", "name").lean(),
    Expense.find({ batch: id }).sort({ spentAt: -1 }).populate("teacher", "name").lean(),
    batchFinance([batch._id as mongoose.Types.ObjectId]),
  ]);
  ok(res, { batch, enrollments, payments, expenses, stats: fin.get(String(batch._id)) });
});

router.post("/batches", requirePerm("courses"), async (req, res) => {
  const d = parse(batchSchema, req.body);
  if (!(await Course.exists({ _id: d.course }))) throw new ApiError(400, "কোর্স পাওয়া যায়নি");
  const b = await Batch.create(d);
  audit(req, "create", "Batch", b._id, b.name);
  ok(res, b, "ব্যাচ তৈরি হয়েছে", 201);
});

router.patch("/batches/:id", requirePerm("courses"), async (req, res) => {
  const id = objectId(req.params.id);
  const d = parse(batchSchema.partial(), req.body);
  const b = await Batch.findByIdAndUpdate(id, { $set: d }, { new: true, runValidators: true });
  if (!b) throw new ApiError(404, "ব্যাচ পাওয়া যায়নি");
  audit(req, "update", "Batch", id, b.name);
  ok(res, b, "ব্যাচ আপডেট হয়েছে");
});

router.delete("/batches/:id", requirePerm("courses"), async (req, res) => {
  const id = objectId(req.params.id);
  const n = await Enrollment.countDocuments({ batch: id });
  if (n > 0) throw new ApiError(400, `এই ব্যাচে ${n} জন শিক্ষার্থী আছে — মুছা যাবে না, স্ট্যাটাস "cancelled" করুন`);
  await Batch.findByIdAndDelete(id);
  audit(req, "delete", "Batch", id);
  ok(res, {}, "ব্যাচ মুছে ফেলা হয়েছে");
});

export default router;
