import crypto from "crypto";
import mongoose, { Schema } from "mongoose";
import { config } from "../config";

export const ENROLL_STATUS = ["pending", "approved", "completed", "cancelled", "rejected"] as const;

const enrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", index: true },
    // ফর্মের তথ্য (এনরোলের সময়কার)
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    education: { type: String, trim: true, maxlength: 120, default: "" },
    institute: { type: String, trim: true, maxlength: 150, default: "" },
    address: { type: String, trim: true, maxlength: 250, default: "" },
    note: { type: String, trim: true, maxlength: 500, default: "" },
    // টাকা-পয়সা
    fee: { type: Number, required: true, min: 0 }, // মূল দাম
    discount: { type: Number, default: 0, min: 0 }, // প্রোমো + অ্যাডমিন ছাড়
    promoCode: { type: String, default: "" },
    payable: { type: Number, required: true, min: 0 },
    paid: { type: Number, default: 0, min: 0 },
    // শিক্ষার্থী যে পেমেন্ট তথ্য দিয়েছে (অ্যাডমিন যাচাই করবে)
    paymentMethod: { type: String, default: "" },
    paymentTrxId: { type: String, trim: true, maxlength: 60, default: "" },
    status: { type: String, enum: ENROLL_STATUS, default: "pending", index: true },
    completedAt: Date,
    source: { type: String, enum: ["online", "admin"], default: "online" },
  },
  { timestamps: true },
);
enrollmentSchema.virtual("due").get(function () {
  return Math.max(0, (this.payable || 0) - (this.paid || 0));
});
enrollmentSchema.set("toJSON", { virtuals: true });
enrollmentSchema.index({ student: 1, course: 1 });
export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export const PAY_METHODS = ["cash", "bkash", "nagad", "rocket", "bank", "other"] as const;

export const newReceiptToken = () => crypto.randomBytes(16).toString("base64url");

const paymentSchema = new Schema(
  {
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", index: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: PAY_METHODS, default: "cash" },
    trxId: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, maxlength: 300, default: "" },
    receiptNo: { type: String, unique: true },
    // রসিদের পাবলিক লিংকের গোপন কোড — রসিদ নম্বর ক্রমিক বলে অনুমান করা যায়, তাই আলাদা টোকেন
    receiptToken: { type: String, unique: true, sparse: true, default: newReceiptToken },
    paidAt: { type: Date, default: Date.now, index: true },
    receivedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
export const Payment = mongoose.model("Payment", paymentSchema);

export const receiptUrl = (token: string) => `${config.siteUrl}/receipt/${token}`;

/** পুরোনো পেমেন্টে (টোকেন ফিচারের আগের) টোকেন বসায় — সার্ভার চালুর সময় একবার */
export async function backfillReceiptTokens() {
  const old = await Payment.find({ receiptToken: { $exists: false } }).select("_id").lean();
  for (const p of old) await Payment.updateOne({ _id: p._id }, { $set: { receiptToken: newReceiptToken() } });
  if (old.length) console.log(`🧾 ${old.length}টি পুরোনো পেমেন্টে রসিদ লিংক যোগ হয়েছে`);
  const oldEx = await mongoose.model("Expense").find({ receiptToken: { $exists: false } }).select("_id").lean<{ _id: unknown }[]>();
  for (const x of oldEx) await mongoose.model("Expense").updateOne({ _id: x._id }, { $set: { receiptToken: newReceiptToken() } });
}

export const EXPENSE_TYPES = ["teacher_payment", "rent", "utility", "marketing", "salary", "equipment", "other"] as const;

const expenseSchema = new Schema(
  {
    type: { type: String, enum: EXPENSE_TYPES, default: "other", index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    amount: { type: Number, required: true, min: 1 },
    teacher: { type: Schema.Types.ObjectId, ref: "User", index: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", index: true },
    method: { type: String, enum: PAY_METHODS, default: "cash" },
    note: { type: String, trim: true, maxlength: 300, default: "" },
    spentAt: { type: Date, default: Date.now, index: true },
    // শিক্ষক পেমেন্টের রসিদ লিংকের গোপন কোড
    receiptToken: { type: String, unique: true, sparse: true, default: newReceiptToken },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
export const Expense = mongoose.model("Expense", expenseSchema);
