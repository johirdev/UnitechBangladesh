import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../lib/errors";
import { ok, parse, objectIdStr, objectId } from "../lib/http";
import { basePrice, applyPromo, reservePromo } from "../lib/pricing";
import { autoSms } from "../lib/notify";
import { requireAuth } from "../middleware/auth";
import { User, generateStudentId } from "../models/User";
import { Course, Batch, PromoCode } from "../models/Catalog";
import { Enrollment, Payment } from "../models/Finance";
import { Certificate, Review } from "../models/Content";

const router = Router();
router.use(requireAuth());

// ---------- কোর্সে এনরোল ----------
router.post("/enroll", async (req, res) => {
  const b = parse(
    z.object({
      courseId: objectIdStr,
      batchId: objectIdStr.optional().or(z.literal("")),
      fullName: z.string().trim().min(2, "পূর্ণ নাম দিন").max(80),
      email: z.string().trim().email("সঠিক ইমেইল দিন").max(120).optional().or(z.literal("")),
      education: z.string().trim().max(120).optional(),
      institute: z.string().trim().max(150).optional(),
      address: z.string().trim().max(250).optional(),
      note: z.string().trim().max(500).optional(),
      promoCode: z.string().trim().max(30).optional(),
      paymentMethod: z.enum(["bkash", "nagad", "rocket", "cash", "bank", ""]).optional(),
      paymentTrxId: z.string().trim().max(60).optional(),
    }),
    req.body,
  );

  const user = await User.findById(req.user!._id);
  if (!user) throw new ApiError(401, "আবার লগইন করুন");
  if (!user.isPhoneVerified) throw new ApiError(403, "এনরোল করতে আগে মোবাইল নম্বর OTP দিয়ে যাচাই করুন");

  const course = await Course.findOne({ _id: b.courseId, isPublished: true });
  if (!course) throw new ApiError(404, "কোর্স পাওয়া যায়নি");
  if (!course.enrollmentOpen) throw new ApiError(400, "এই কোর্সে এখন ভর্তি বন্ধ আছে");

  let batch = null;
  if (b.batchId) {
    batch = await Batch.findOne({ _id: b.batchId, course: course._id, isEnrollOpen: true, status: { $in: ["upcoming", "running"] } });
    if (!batch) throw new ApiError(400, "নির্বাচিত ব্যাচে ভর্তি সম্ভব নয়");
    if (batch.seatLimit > 0) {
      const taken = await Enrollment.countDocuments({ batch: batch._id, status: { $in: ["pending", "approved"] } });
      if (taken >= batch.seatLimit) throw new ApiError(400, "এই ব্যাচের সিট পূর্ণ হয়ে গেছে");
    }
  }

  if (course.maxSeats > 0) {
    const taken = await Enrollment.countDocuments({ course: course._id, status: { $in: ["pending", "approved"] } });
    if (taken >= course.maxSeats) throw new ApiError(400, "এই কোর্সের সব সিট পূর্ণ হয়ে গেছে");
  }

  const dup = await Enrollment.exists({ student: user._id, course: course._id, status: { $in: ["pending", "approved"] } });
  if (dup) throw new ApiError(409, "আপনি ইতিমধ্যে এই কোর্সে এনরোল করেছেন — ড্যাশবোর্ডে দেখুন");

  const fee = basePrice(course, batch);
  const { discount, promo } = await applyPromo(b.promoCode, course, fee);

  if (!user.studentId) {
    user.studentId = await generateStudentId();
  }
  // প্রোফাইলের খালি তথ্য এনরোল ফর্ম থেকে পূরণ
  // ইমেইল অন্য অ্যাকাউন্টে থাকলে প্রোফাইলে বসাই না — নইলে ইউনিক ইনডেক্সে আটকে পুরো ভর্তি ব্যর্থ হতো
  if (!user.email && b.email && !(await User.exists({ email: b.email.toLowerCase(), _id: { $ne: user._id } }))) user.email = b.email;
  if (!user.institute && b.institute) user.institute = b.institute;
  if (!user.educationLevel && b.education) user.educationLevel = b.education;
  if (!user.address && b.address) user.address = b.address;
  await user.save();

  // প্রোমো ব্যবহার আগে "বুক" করি — একসাথে অনেক রিকোয়েস্ট এলেও সীমার বেশি ব্যবহার হবে না
  if (promo && !(await reservePromo(promo._id))) throw new ApiError(400, "প্রোমো কোডের ব্যবহার সীমা শেষ");

  let enrollment;
  try {
    enrollment = await Enrollment.create({
    student: user._id,
    course: course._id,
    batch: batch?._id,
    fullName: b.fullName,
    phone: user.phone,
    email: b.email || "",
    education: b.education || "",
    institute: b.institute || "",
    address: b.address || "",
    note: b.note || "",
    fee,
    discount,
    promoCode: promo?.code || "",
    payable: fee - discount,
    paymentMethod: b.paymentMethod || "",
    paymentTrxId: b.paymentTrxId || "",
    source: "online",
    });
  } catch (e) {
    if (promo) await PromoCode.updateOne({ _id: promo._id }, { $inc: { usedCount: -1 } });
    throw e;
  }

  await autoSms("enroll", { ...enrollment.toObject(), course, batch, student: user });
  ok(res, enrollment, "এনরোলমেন্ট সফল! অফিস থেকে শীঘ্রই যোগাযোগ করা হবে", 201);
});

router.get("/dashboard", async (req, res) => {
  const me = req.user!._id;
  const [enrollments, certificates, payments] = await Promise.all([
    Enrollment.find({ student: me }).sort({ createdAt: -1 }).populate("course", "title slug thumbnail").populate("batch", "name startDate schedule status").lean(),
    Certificate.countDocuments({ student: me, isRevoked: false }),
    Payment.find({ student: me }).sort({ paidAt: -1 }).limit(5).populate("course", "title").lean(),
  ]);
  const totalPayable = enrollments.filter((e) => !["cancelled", "rejected"].includes(e.status)).reduce((s, e) => s + e.payable, 0);
  const totalPaid = enrollments.reduce((s, e) => s + e.paid, 0);
  ok(res, { enrollments, certificates, payments, totalPayable, totalPaid, totalDue: Math.max(0, totalPayable - totalPaid) });
});

router.get("/enrollments", async (req, res) => {
  const list = await Enrollment.find({ student: req.user!._id })
    .sort({ createdAt: -1 })
    .populate("course", "title slug thumbnail duration")
    .populate({ path: "batch", select: "name code startDate endDate schedule room status teachers", populate: { path: "teachers", select: "name phone avatar" } })
    .lean();
  ok(res, list);
});

router.get("/payments", async (req, res) => {
  ok(res, await Payment.find({ student: req.user!._id }).sort({ paidAt: -1 }).populate("course", "title").populate("batch", "name").lean());
});

router.get("/certificates", async (req, res) => {
  ok(res, await Certificate.find({ student: req.user!._id, isRevoked: false }).sort({ issueDate: -1 }).lean());
});

router.get("/reviews", async (req, res) => {
  const [reviews, completed] = await Promise.all([
    Review.find({ student: req.user!._id }).populate("course", "title slug").lean(),
    Enrollment.find({ student: req.user!._id, status: "completed" }).populate("course", "title slug").lean(),
  ]);
  ok(res, { reviews, eligibleCourses: completed.map((e) => e.course) });
});

// কোর্স সম্পন্ন করা শিক্ষার্থীরাই রিভিউ দিতে পারবে
router.post("/reviews", async (req, res) => {
  const b = parse(
    z.object({ courseId: objectIdStr, rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().min(10, "কমপক্ষে ১০ অক্ষরে মতামত লিখুন").max(800) }),
    req.body,
  );
  const done = await Enrollment.exists({ student: req.user!._id, course: b.courseId, status: "completed" });
  if (!done) throw new ApiError(403, "কোর্স সম্পন্ন করার পরেই রিভিউ দেওয়া যাবে");
  const review = await Review.findOneAndUpdate(
    { student: req.user!._id, course: b.courseId },
    { $set: { rating: b.rating, comment: b.comment, isApproved: false } },
    { upsert: true, new: true },
  );
  ok(res, review, "ধন্যবাদ! অ্যাডমিন অনুমোদনের পর রিভিউ সাইটে দেখাবে", 201);
});

router.delete("/reviews/:id", async (req, res) => {
  await Review.deleteOne({ _id: objectId(req.params.id), student: req.user!._id });
  ok(res, {}, "রিভিউ মুছে ফেলা হয়েছে");
});

export default router;
