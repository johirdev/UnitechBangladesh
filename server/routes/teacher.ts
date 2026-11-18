import { Router } from "express";
import mongoose from "mongoose";
import { ApiError } from "../lib/errors";
import { ok, objectId } from "../lib/http";
import { requireAuth } from "../middleware/auth";
import { Batch } from "../models/Catalog";
import { Enrollment, Expense } from "../models/Finance";

const router = Router();
router.use(requireAuth("teacher"));

router.get("/overview", async (req, res) => {
  const me = req.user!._id;
  const batches = await Batch.find({ teachers: me }).sort({ startDate: -1 }).populate("course", "title slug thumbnail").lean();
  const ids = batches.map((b) => b._id);
  const [studentCount, earnings, recentPayments] = await Promise.all([
    Enrollment.countDocuments({ batch: { $in: ids }, status: { $in: ["approved", "completed"] } }),
    Expense.aggregate([{ $match: { teacher: new mongoose.Types.ObjectId(me) } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Expense.find({ teacher: me }).sort({ spentAt: -1 }).limit(5).populate("batch", "name").lean(),
  ]);
  const totalEarned = earnings[0]?.total || 0;
  ok(res, {
    batches,
    stats: {
      totalBatches: batches.length,
      running: batches.filter((b) => b.status === "running").length,
      upcoming: batches.filter((b) => b.status === "upcoming").length,
      completed: batches.filter((b) => b.status === "completed").length,
      students: studentCount,
      totalEarned,
    },
    recentPayments,
  });
});

router.get("/batches/:id", async (req, res) => {
  const batch = await Batch.findOne({ _id: objectId(req.params.id), teachers: req.user!._id }).populate("course", "title slug").lean();
  if (!batch) throw new ApiError(404, "ব্যাচ পাওয়া যায়নি");
  const students = await Enrollment.find({ batch: batch._id, status: { $in: ["approved", "completed"] } })
    .select("fullName phone status student")
    .populate("student", "name avatar studentId institute bloodGroup")
    .sort({ fullName: 1 })
    .lean();
  ok(res, { batch, students });
});

router.get("/earnings", async (req, res) => {
  const list = await Expense.find({ teacher: req.user!._id }).sort({ spentAt: -1 }).populate("batch", "name").lean();
  ok(res, { list, total: list.reduce((s, e) => s + e.amount, 0) });
});

export default router;
