import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { crudRouter } from "../../lib/crud";
import { ok, qstr, objectIdStr } from "../../lib/http";
import { ApiError } from "../../lib/errors";
import { requirePerm, hasPerm } from "../../middleware/auth";
import { User } from "../../models/User";
import { Course, Batch } from "../../models/Catalog";
import { Enrollment, Payment, Expense, EXPENSE_TYPES, PAY_METHODS } from "../../models/Finance";
import { Visit } from "../../models/System";
import { Review } from "../../models/Content";

const router = Router();

const dhakaMonthStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 6 * 3600_000);
};
const dhakaDayStart = () => {
  const now = new Date(Date.now() + 6 * 3600_000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 6 * 3600_000);
};
const sumOf = async (model: typeof Payment | typeof Expense, field: string, match: Record<string, unknown> = {}) =>
  ((await (model as typeof Payment).aggregate([{ $match: match }, { $group: { _id: null, t: { $sum: `$${field}` } } }]))[0]?.t as number) || 0;

function dateRange(fromS?: string, toS?: string) {
  const r: Record<string, Date> = {};
  if (fromS && !isNaN(Date.parse(fromS))) r.$gte = new Date(fromS);
  if (toS && !isNaN(Date.parse(toS))) r.$lte = new Date(new Date(toS).getTime() + 86_399_999);
  return Object.keys(r).length ? r : undefined;
}

// ---------- ড্যাশবোর্ড ----------
router.get("/dashboard", requirePerm(), async (req, res) => {
  const u = req.user!;
  const monthStart = dhakaMonthStart();
  const today = dhakaDayStart();
  const [students, teachers, courses, runningBatches, upcomingBatches, pendingEnroll, totalEnroll, pendingReviews, recentEnrollments] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "teacher" }),
    Course.countDocuments({}),
    Batch.countDocuments({ status: "running" }),
    Batch.countDocuments({ status: "upcoming" }),
    Enrollment.countDocuments({ status: "pending" }),
    Enrollment.countDocuments({}),
    Review.countDocuments({ isApproved: false }),
    hasPerm(u, "enrollments")
      ? Enrollment.find({}).sort({ createdAt: -1 }).limit(6).populate("course", "title").populate("batch", "name").lean()
      : Promise.resolve([]),
  ]);
  const data: Record<string, unknown> = {
    counts: { students, teachers, courses, runningBatches, upcomingBatches, pendingEnroll, totalEnroll, pendingReviews },
    recentEnrollments,
  };

  if (hasPerm(u, "finance")) {
    const [income, incomeMonth, expense, expenseMonth, dueAgg] = await Promise.all([
      sumOf(Payment, "amount"),
      sumOf(Payment, "amount", { paidAt: { $gte: monthStart } }),
      sumOf(Expense, "amount"),
      sumOf(Expense, "amount", { spentAt: { $gte: monthStart } }),
      Enrollment.aggregate([{ $match: { status: { $in: ["pending", "approved", "completed"] } } }, { $group: { _id: null, p: { $sum: "$payable" }, d: { $sum: "$paid" } } }]),
    ]);
    // গত ১২ মাসের আয়-ব্যয়
    const since = new Date(monthStart);
    since.setUTCMonth(since.getUTCMonth() - 11);
    const fmt = { $dateToString: { format: "%Y-%m", date: "$d", timezone: "Asia/Dhaka" } };
    const [inc, exp] = await Promise.all([
      Payment.aggregate([{ $match: { paidAt: { $gte: since } } }, { $project: { d: "$paidAt", amount: 1 } }, { $group: { _id: fmt, t: { $sum: "$amount" } } }]),
      Expense.aggregate([{ $match: { spentAt: { $gte: since } } }, { $project: { d: "$spentAt", amount: 1 } }, { $group: { _id: fmt, t: { $sum: "$amount" } } }]),
    ]);
    const months: { month: string; income: number; expense: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(since.getTime() + 7 * 3600_000);
      d.setUTCMonth(d.getUTCMonth() + i);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      months.push({ month: key, income: inc.find((x) => x._id === key)?.t || 0, expense: exp.find((x) => x._id === key)?.t || 0 });
    }
    data.finance = {
      income,
      incomeMonth,
      expense,
      expenseMonth,
      profit: income - expense,
      due: Math.max(0, (dueAgg[0]?.p || 0) - (dueAgg[0]?.d || 0)),
      months,
    };
    data.recentPayments = await Payment.find({}).sort({ paidAt: -1 }).limit(6).populate("student", "name").populate("course", "title").lean();
  }
  if (hasPerm(u, "analytics")) {
    const [total, todayCount, uniqueToday] = await Promise.all([
      Visit.countDocuments({}),
      Visit.countDocuments({ createdAt: { $gte: today } }),
      Visit.distinct("visitorId", { createdAt: { $gte: today } }).then((x) => x.length),
    ]);
    data.visits = { total, today: todayCount, uniqueToday };
  }
  ok(res, data);
});

// ---------- আয়-ব্যয় রিপোর্ট ----------
router.get("/finance/report", requirePerm("finance"), async (req, res) => {
  const pr = dateRange(qstr(req.query.from), qstr(req.query.to));
  const pm: Record<string, unknown> = pr ? { paidAt: pr } : {};
  const em: Record<string, unknown> = pr ? { spentAt: pr } : {};
  const [byCourse, byBatch, byMethod, expByType, teacherPay, income, expense] = await Promise.all([
    Payment.aggregate([
      { $match: pm },
      { $group: { _id: "$course", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $lookup: { from: "courses", localField: "_id", foreignField: "_id", as: "c" } },
      { $project: { total: 1, count: 1, title: { $ifNull: [{ $first: "$c.title" }, "—"] } } },
      { $sort: { total: -1 } },
    ]),
    Payment.aggregate([
      { $match: pm },
      { $group: { _id: "$batch", total: { $sum: "$amount" } } },
      { $lookup: { from: "batches", localField: "_id", foreignField: "_id", as: "b" } },
      { $lookup: { from: "courses", localField: "b.course", foreignField: "_id", as: "c" } },
      { $project: { total: 1, name: { $ifNull: [{ $first: "$b.name" }, "ব্যাচ নেই"] }, course: { $first: "$c.title" } } },
      { $sort: { total: -1 } },
    ]),
    Payment.aggregate([{ $match: pm }, { $group: { _id: "$method", total: { $sum: "$amount" }, count: { $sum: 1 } } }, { $sort: { total: -1 } }]),
    Expense.aggregate([{ $match: em }, { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } }, { $sort: { total: -1 } }]),
    Expense.aggregate([
      { $match: { ...em, teacher: { $ne: null } } },
      { $group: { _id: "$teacher", total: { $sum: "$amount" } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "t" } },
      { $project: { total: 1, name: { $first: "$t.name" } } },
      { $sort: { total: -1 } },
    ]),
    sumOf(Payment, "amount", pm),
    sumOf(Expense, "amount", em),
  ]);
  ok(res, { income, expense, profit: income - expense, byCourse, byBatch, byMethod, expByType, teacherPay });
});

// ---------- খরচ (শিক্ষক পেমেন্ট, ভাড়া ইত্যাদি) ----------
router.use(
  "/expenses",
  crudRouter({
    model: Expense,
    entity: "খরচ",
    perm: "finance",
    schema: z.object({
      type: z.enum(EXPENSE_TYPES),
      title: z.string().trim().min(2, "বিবরণ দিন").max(150),
      amount: z.coerce.number().min(1, "টাকার পরিমাণ দিন"),
      teacher: objectIdStr.optional().or(z.literal("")).transform((v) => v || undefined),
      batch: objectIdStr.optional().or(z.literal("")).transform((v) => v || undefined),
      method: z.enum(PAY_METHODS).optional(),
      note: z.string().trim().max(300).optional(),
      spentAt: z.union([z.coerce.date(), z.literal("")]).optional().transform((v) => v || undefined),
    }),
    searchFields: ["title", "note"],
    sort: { spentAt: -1 },
    populate: [
      { path: "teacher", select: "name phone" },
      { path: "batch", select: "name" },
      { path: "createdBy", select: "name" },
    ],
    filters: (req) => {
      const f: Record<string, unknown> = {};
      const t = qstr(req.query.type);
      if (t) f.type = t;
      for (const k of ["teacher", "batch"]) {
        const v = qstr(req.query[k]);
        if (v && mongoose.isValidObjectId(v)) f[k] = v;
      }
      const r = dateRange(qstr(req.query.from), qstr(req.query.to));
      if (r) f.spentAt = r;
      return f;
    },
    beforeSave: async (d, req) => {
      if (d.type === "teacher_payment" && !d.teacher && req.method === "POST") throw new ApiError(400, "শিক্ষক নির্বাচন করুন");
      if (d.teacher && !(await User.exists({ _id: d.teacher, role: "teacher" }))) throw new ApiError(400, "শিক্ষক পাওয়া যায়নি");
      if (req.method === "POST") d.createdBy = req.user!._id;
      return d;
    },
  }),
);

export default router;
