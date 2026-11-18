import mongoose, { Schema } from "mongoose";

export const ROLES = ["superadmin", "ceo", "admin", "teacher", "student"] as const;
export type Role = (typeof ROLES)[number];
export const STAFF_ROLES: Role[] = ["superadmin", "ceo", "admin"];

/** অ্যাডমিনদের জন্য আলাদা আলাদা অনুমতি (superadmin ও ceo সব পায়) */
export const PERMISSIONS = [
  "content", // ব্যানার, ক্যাটাগরি, গ্যালারি, টপার, ইন্ডাস্ট্রিয়াল এটাচমেন্ট, রিভিউ
  "courses", // কোর্স, ব্যাচ, প্রোমো কোড
  "students", // শিক্ষার্থী ও শিক্ষক তালিকা
  "enrollments", // এনরোলমেন্ট ও পেমেন্ট গ্রহণ
  "finance", // আয়-ব্যয় রিপোর্ট, খরচ, পেমেন্ট মুছা
  "sms", // এসএমএস পাঠানো
  "certificates",
  "analytics",
  "settings",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, unique: true, trim: true, match: /^01[3-9]\d{8}$/ },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, default: "" },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "student", index: true },
    permissions: { type: [String], enum: PERMISSIONS, default: [] },
    avatar: { type: String, default: "" },
    studentId: { type: String, unique: true, sparse: true },
    // প্রোফাইল
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    dateOfBirth: Date,
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""], default: "" },
    institute: { type: String, trim: true, maxlength: 150, default: "" },
    department: { type: String, trim: true, maxlength: 100, default: "" },
    semester: { type: String, trim: true, maxlength: 40, default: "" },
    educationLevel: { type: String, trim: true, maxlength: 80, default: "" },
    fatherName: { type: String, trim: true, maxlength: 80, default: "" },
    guardianPhone: { type: String, trim: true, maxlength: 20, default: "" },
    address: { type: String, trim: true, maxlength: 250, default: "" },
    // শিক্ষক / সিইও
    designation: { type: String, trim: true, maxlength: 80, default: "" },
    bio: { type: String, trim: true, maxlength: 600, default: "" },
    signature: { type: String, default: "" }, // সার্টিফিকেটে স্বাক্ষরের ছবি
    // নিরাপত্তা
    isPhoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0, select: false },
    failedLogins: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    lastLoginAt: Date,
    passwordChangedAt: Date,
  },
  { timestamps: true },
);

// ইমেইল দিয়ে লগইন করা যায় তাই খালি না হলে ইউনিক
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $gt: "" } } });

userSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.password;
    delete ret.failedLogins;
    delete ret.lockUntil;
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model("User", userSchema);

const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });
export const Counter = mongoose.model("Counter", counterSchema);

/** ক্রমিক নম্বর (যেমন স্টুডেন্ট আইডি, সার্টিফিকেট নম্বর) */
export async function nextSeq(key: string) {
  const c = await Counter.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return c!.seq as number;
}

export async function generateStudentId() {
  const year = new Date().getFullYear();
  const n = await nextSeq(`student-${year}`);
  return `UTB${String(year).slice(2)}${String(n).padStart(4, "0")}`;
}

const otpSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    purpose: { type: String, enum: ["register", "reset"], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);
export const Otp = mongoose.model("Otp", otpSchema);
