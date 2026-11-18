import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { ApiError } from "../../lib/errors";
import { ok, parse, paging, qstr, objectId, objectIdStr, imageUrl, linkUrl, phoneSchema, escapeRegex } from "../../lib/http";
import { audit } from "../../lib/audit";
import { sendBulk, fillTemplate } from "../../lib/sms";
import { enrollVars } from "../../lib/notify";
import { requirePerm } from "../../middleware/auth";
import { nextSeq } from "../../models/User";
import { Enrollment } from "../../models/Finance";
import { Certificate, Setting, getSettings } from "../../models/Content";
import { Visit, SmsLog, AuditLog } from "../../models/System";

const router = Router();

// =============== এসএমএস ===============

// যেকোনো নম্বরে কাস্টম মেসেজ
router.post("/sms/custom", requirePerm("sms"), async (req, res) => {
  const b = parse(z.object({ phones: z.array(phoneSchema).min(1, "নম্বর দিন").max(500), message: z.string().trim().min(2, "মেসেজ লিখুন").max(1000) }), req.body);
  const s = await getSettings();
  const r = await sendBulk([...new Set(b.phones)].map((to) => ({ to, message: fillTemplate(b.message, { site: s.siteName }) })), "custom", req.user!._id);
  audit(req, "sms", "custom", "", `${r.sent}/${r.total}`);
  ok(res, r, `${r.sent} টি এসএমএস পাঠানো হয়েছে${r.failed ? `, ${r.failed} টি ব্যর্থ` : ""}${r.skipped ? `, ${r.skipped} টি SMS বন্ধ থাকায় পাঠানো হয়নি` : ""}`);
});

// নির্বাচিত এনরোলমেন্টে টেমপ্লেট মেসেজ (বকেয়া রিমাইন্ডার / ব্যাচ ক্লাসের সময়)
router.post("/sms/enrollments", requirePerm("sms"), async (req, res) => {
  const b = parse(
    z.object({
      enrollmentIds: z.array(objectIdStr).min(1, "শিক্ষার্থী নির্বাচন করুন").max(1000),
      message: z.string().trim().min(2, "মেসেজ লিখুন").max(1000),
      type: z.enum(["due", "batch", "custom"]).default("custom"),
      date: z.string().trim().max(40).optional(),
      time: z.string().trim().max(40).optional(),
      onlyDue: z.boolean().optional(),
    }),
    req.body,
  );
  const s = await getSettings();
  let list = await Enrollment.find({ _id: { $in: b.enrollmentIds } }).populate("course", "title").populate("batch", "name startDate").populate("student", "studentId").lean();
  if (b.onlyDue || b.type === "due") list = list.filter((e) => e.payable - e.paid > 0);
  if (!list.length) throw new ApiError(400, "পাঠানোর মতো কোনো শিক্ষার্থী নেই");
  const items = list.map((e) => ({
    to: e.phone,
    message: fillTemplate(b.message, { ...enrollVars(e as never, {}, s.siteName || ""), ...(b.date ? { date: b.date } : {}), ...(b.time ? { time: b.time } : {}) }),
  }));
  const r = await sendBulk(items, b.type, req.user!._id);
  audit(req, "sms", b.type, "", `${r.sent}/${r.total}`);
  ok(res, r, `${r.sent} টি এসএমএস পাঠানো হয়েছে${r.failed ? `, ${r.failed} টি ব্যর্থ` : ""}${r.skipped ? `, ${r.skipped} টি SMS বন্ধ থাকায় পাঠানো হয়নি` : ""}`);
});

router.get("/sms/logs", requirePerm("sms"), async (req, res) => {
  const { page, limit, skip } = paging(req, 200);
  const f: Record<string, unknown> = {};
  const t = qstr(req.query.type);
  if (t) f.type = t;
  const st = qstr(req.query.status);
  if (st) f.status = st;
  const q = qstr(req.query.q);
  if (q) f.to = new RegExp(escapeRegex(q));
  const [items, total, stats] = await Promise.all([
    SmsLog.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("sentBy", "name").lean(),
    SmsLog.countDocuments(f),
    SmsLog.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  ok(res, items, "সফল", 200, { page, limit, total, pages: Math.ceil(total / limit), stats });
});

// =============== সার্টিফিকেট ===============
router.get("/certificates", requirePerm("certificates"), async (req, res) => {
  const { page, limit, skip } = paging(req, 200);
  const f: Record<string, unknown> = {};
  const q = qstr(req.query.q);
  if (q) f.$or = [{ certificateNo: new RegExp(escapeRegex(q), "i") }, { studentName: new RegExp(escapeRegex(q), "i") }];
  const [items, total] = await Promise.all([
    Certificate.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("student", "studentId phone").lean(),
    Certificate.countDocuments(f),
  ]);
  ok(res, items, "সফল", 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

// সম্পন্ন এনরোলমেন্ট থেকে সার্টিফিকেট ইস্যু (একসাথে অনেকগুলো)
router.post("/certificates/issue", requirePerm("certificates"), async (req, res) => {
  const b = parse(
    z.object({
      enrollmentIds: z.array(objectIdStr).min(1, "শিক্ষার্থী নির্বাচন করুন").max(300),
      grade: z.string().trim().max(30).optional(),
      issueDate: z.union([z.coerce.date(), z.literal("")]).optional().transform((v) => v || new Date()),
      topperIds: z.array(objectIdStr).optional(),
    }),
    req.body,
  );
  const s = await getSettings();
  const enrollments = await Enrollment.find({ _id: { $in: b.enrollmentIds } })
    .populate("course", "title")
    .populate({ path: "batch", select: "name teachers", populate: { path: "teachers", select: "name designation signature" } })
    .populate("student", "name")
    .lean();
  let issued = 0;
  const skipped: string[] = [];
  for (const e of enrollments) {
    if (await Certificate.exists({ enrollment: e._id })) {
      skipped.push(`${e.fullName} (আগেই ইস্যু করা)`);
      continue;
    }
    if (e.status !== "completed") {
      await Enrollment.updateOne({ _id: e._id }, { status: "completed", completedAt: new Date() });
    }
    const batch = e.batch as unknown as { _id: mongoose.Types.ObjectId; name: string; teachers?: { name: string; designation?: string; signature?: string }[] } | undefined;
    const teacher = batch?.teachers?.[0];
    const yr = new Date().getFullYear();
    await Certificate.create({
      certificateNo: `UTB-${yr}-${String(await nextSeq(`cert-${yr}`)).padStart(5, "0")}`,
      student: (e.student as unknown as { _id: mongoose.Types.ObjectId })._id,
      enrollment: e._id,
      course: (e.course as unknown as { _id: mongoose.Types.ObjectId })._id,
      batch: batch?._id,
      studentName: e.fullName,
      courseTitle: (e.course as unknown as { title: string }).title,
      batchName: batch?.name || "",
      grade: b.grade || "",
      isTopper: !!b.topperIds?.includes(String(e._id)),
      issueDate: b.issueDate,
      teacherName: teacher?.name || "",
      teacherDesignation: teacher?.designation || "Course Instructor",
      teacherSignature: teacher?.signature || "",
      ceoName: s.ceoName || "",
      ceoSignature: s.ceoSignature || "",
      issuedBy: req.user!._id,
    });
    issued++;
  }
  audit(req, "issue", "Certificate", "", `${issued} issued`);
  ok(res, { issued, skipped }, `${issued} টি সার্টিফিকেট ইস্যু হয়েছে${skipped.length ? ` (${skipped.length} টি বাদ)` : ""}`, 201);
});

router.patch("/certificates/:id", requirePerm("certificates"), async (req, res) => {
  const b = parse(
    z
      .object({
        studentName: z.string().trim().min(2).max(80),
        grade: z.string().trim().max(30),
        isTopper: z.boolean(),
        issueDate: z.coerce.date(),
        teacherName: z.string().trim().max(80),
        teacherDesignation: z.string().trim().max(80),
        teacherSignature: imageUrl,
        ceoName: z.string().trim().max(80),
        ceoSignature: imageUrl,
        isRevoked: z.boolean(),
      })
      .partial(),
    req.body,
  );
  const c = await Certificate.findByIdAndUpdate(objectId(req.params.id), { $set: b }, { new: true });
  if (!c) throw new ApiError(404, "সার্টিফিকেট পাওয়া যায়নি");
  audit(req, b.isRevoked ? "revoke" : "update", "Certificate", c._id, c.certificateNo);
  ok(res, c, "সার্টিফিকেট আপডেট হয়েছে");
});

router.delete("/certificates/:id", requirePerm("certificates"), async (req, res) => {
  const c = await Certificate.findByIdAndDelete(objectId(req.params.id));
  if (!c) throw new ApiError(404, "সার্টিফিকেট পাওয়া যায়নি");
  audit(req, "delete", "Certificate", c._id, c.certificateNo);
  ok(res, {}, "সার্টিফিকেট মুছে ফেলা হয়েছে");
});

// =============== ভিজিটর অ্যানালিটিক্স ===============
function visitFilter(fromS?: string, toS?: string) {
  const f: Record<string, unknown> = {};
  const r: Record<string, Date> = {};
  if (fromS && !isNaN(Date.parse(fromS))) r.$gte = new Date(fromS);
  if (toS && !isNaN(Date.parse(toS))) r.$lte = new Date(new Date(toS).getTime() + 86_399_999);
  if (Object.keys(r).length) f.createdAt = r;
  return f;
}

router.get("/analytics", requirePerm("analytics"), async (req, res) => {
  const f = visitFilter(qstr(req.query.from), qstr(req.query.to));
  const since30 = new Date(Date.now() - 29 * 86_400_000);
  const [total, unique, byPage, byCourse, byDevice, byBrowser, byRef, daily] = await Promise.all([
    Visit.countDocuments(f),
    Visit.distinct("visitorId", f).then((x) => x.length),
    Visit.aggregate([{ $match: f }, { $group: { _id: "$path", views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } }, { $project: { views: 1, visitors: { $size: "$visitors" } } }, { $sort: { views: -1 } }, { $limit: 30 }]),
    Visit.aggregate([
      { $match: { ...f, course: { $ne: null } } },
      { $group: { _id: "$course", views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
      { $lookup: { from: "courses", localField: "_id", foreignField: "_id", as: "c" } },
      { $project: { views: 1, visitors: { $size: "$visitors" }, title: { $first: "$c.title" } } },
      { $sort: { views: -1 } },
    ]),
    Visit.aggregate([{ $match: f }, { $group: { _id: "$device", n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
    Visit.aggregate([{ $match: f }, { $group: { _id: "$browser", n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
    Visit.aggregate([
      { $match: { ...f, referrer: { $nin: ["", null] } } },
      { $project: { host: { $arrayElemAt: [{ $split: [{ $arrayElemAt: [{ $split: ["$referrer", "//"] }, -1] }, "/"] }, 0] } } },
      { $group: { _id: "$host", n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: 15 },
    ]),
    Visit.aggregate([
      { $match: f.createdAt ? f : { createdAt: { $gte: since30 } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Dhaka" } }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
      { $project: { views: 1, visitors: { $size: "$visitors" } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  ok(res, { total, unique, byPage, byCourse, byDevice, byBrowser, byRef, daily });
});

router.get("/analytics/visits", requirePerm("analytics"), async (req, res) => {
  const { page, limit, skip } = paging(req, 200);
  const f = visitFilter(qstr(req.query.from), qstr(req.query.to));
  const p = qstr(req.query.path);
  if (p) f.path = p;
  const [items, total] = await Promise.all([
    Visit.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "name phone").populate("course", "title").lean(),
    Visit.countDocuments(f),
  ]);
  ok(res, items, "সফল", 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

// ভিজিটর ডেটা মুছা — নির্দিষ্ট আইডি, তারিখ সীমা, পেজ অথবা সব
router.post("/analytics/delete", requirePerm("analytics"), async (req, res) => {
  const b = parse(
    z.object({
      ids: z.array(objectIdStr).max(1000).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      path: z.string().max(300).optional(),
      all: z.boolean().optional(),
    }),
    req.body,
  );
  let filter: Record<string, unknown>;
  if (b.ids?.length) filter = { _id: { $in: b.ids.map((i) => new mongoose.Types.ObjectId(i)) } };
  else if (b.all) filter = {};
  else {
    filter = visitFilter(b.from, b.to);
    if (b.path) filter.path = b.path;
    if (!Object.keys(filter).length) throw new ApiError(400, "কী মুছবেন নির্বাচন করুন");
  }
  const r = await Visit.deleteMany(filter);
  audit(req, "delete", "Visit", "", `${r.deletedCount} records`);
  ok(res, { deleted: r.deletedCount }, `${r.deletedCount} টি ভিজিট রেকর্ড মুছে ফেলা হয়েছে`);
});

// =============== সেটিংস ===============
router.get("/settings", requirePerm(), async (_req, res) => ok(res, await getSettings()));

router.patch("/settings", requirePerm("settings"), async (req, res) => {
  const t = (n: number) => z.string().trim().max(n).optional();
  const b = parse(
    z.object({
      siteName: t(80),
      tagline: t(200),
      logo: imageUrl.optional(),
      phone: t(30),
      phone2: t(30),
      email: t(120),
      address: t(300),
      mapEmbedUrl: linkUrl.optional().refine((v) => !v || v.startsWith("https://www.google.com/maps/embed"), "শুধু Google Maps embed লিংক"),
      facebook: linkUrl.optional(),
      youtube: linkUrl.optional(),
      whatsapp: t(30),
      linkedin: linkUrl.optional(),
      aboutText: t(3000),
      paymentInstructions: t(1500),
      bkashNumber: t(20),
      nagadNumber: t(20),
      ceoName: t(80),
      ceoTitle: t(80),
      ceoSignature: imageUrl.optional(),
      certificateText: t(300),
      sms: z
        .object({
          enrollEnabled: z.boolean(),
          enrollTemplate: t(600),
          approveEnabled: z.boolean(),
          approveTemplate: t(600),
          paymentEnabled: z.boolean(),
          paymentTemplate: t(600),
          dueTemplate: t(600),
          batchTemplate: t(600),
          completeTemplate: t(600),
        })
        .partial()
        .optional(),
      stats: z.object({ students: t(20), courses: t(20), batches: t(20), jobPlacement: t(20) }).partial().optional(),
    }),
    req.body,
  );
  const s = await getSettings();
  const { sms, stats, ...rest } = b;
  const set: Record<string, unknown> = { ...rest };
  for (const [k, v] of Object.entries(sms || {})) set[`sms.${k}`] = v;
  for (const [k, v] of Object.entries(stats || {})) set[`stats.${k}`] = v;
  const updated = await Setting.findByIdAndUpdate(s._id, { $set: set }, { new: true });
  audit(req, "update", "Setting");
  ok(res, updated, "সেটিংস সেভ হয়েছে");
});

// =============== অডিট লগ ===============
router.get("/audit-logs", requirePerm(), async (req, res) => {
  if (!["superadmin", "ceo"].includes(req.user!.role)) throw new ApiError(403, "অনুমতি নেই");
  const { page, limit, skip } = paging(req, 200);
  const [items, total] = await Promise.all([AuditLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("actor", "name role").lean(), AuditLog.countDocuments({})]);
  ok(res, items, "সফল", 200, { page, limit, total, pages: Math.ceil(total / limit) });
});


export default router;
