import mongoose, { Schema } from "mongoose";

const visitSchema = new Schema(
  {
    path: { type: String, required: true, maxlength: 300, index: true },
    visitorId: { type: String, maxlength: 64, index: true },
    ipHash: { type: String, maxlength: 64 },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    course: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    referrer: { type: String, maxlength: 300, default: "" },
    device: { type: String, enum: ["mobile", "tablet", "desktop", "bot"], default: "desktop" },
    browser: { type: String, maxlength: 40, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
visitSchema.index({ createdAt: -1 });
export const Visit = mongoose.model("Visit", visitSchema);

const smsLogSchema = new Schema(
  {
    to: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "custom", index: true }, // otp, enroll, payment, due, batch, custom
    status: { type: String, enum: ["sent", "failed", "skipped"], default: "sent", index: true },
    response: { type: String, default: "" },
    sentBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
export const SmsLog = mongoose.model("SmsLog", smsLogSchema);

const auditSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", index: true },
    action: { type: String, required: true },
    entity: { type: String, default: "" },
    entityId: { type: String, default: "" },
    detail: { type: String, default: "" },
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
auditSchema.index({ createdAt: -1 });
export const AuditLog = mongoose.model("AuditLog", auditSchema);
