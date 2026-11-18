import mongoose, { Schema } from "mongoose";

const bannerSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 150, default: "" },
    subtitle: { type: String, trim: true, maxlength: 300, default: "" },
    image: { type: String, required: true },
    buttonText: { type: String, trim: true, default: "" },
    buttonLink: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Banner = mongoose.model("Banner", bannerSchema);

const gallerySchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 400, default: "" },
    image: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Gallery = mongoose.model("Gallery", gallerySchema);

const topperSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    batch: { type: Schema.Types.ObjectId, ref: "Batch" },
    title: { type: String, trim: true, default: "Semester Topper" }, // যেমন "১ম স্থান"
    project: { type: String, trim: true, maxlength: 150, default: "" },
    image: { type: String, default: "" }, // সার্টিফিকেট প্রদানের ছবি
    quote: { type: String, trim: true, maxlength: 300, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Topper = mongoose.model("Topper", topperSchema);

const attachmentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    department: { type: String, trim: true, default: "" }, // Computer / Civil / Architecture
    image: { type: String, default: "" },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    link: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Attachment = mongoose.model("Attachment", attachmentSchema);

const reviewSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true, trim: true, maxlength: 800 },
    isApproved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
reviewSchema.index({ student: 1, course: 1 }, { unique: true });
export const Review = mongoose.model("Review", reviewSchema);

const certificateSchema = new Schema(
  {
    certificateNo: { type: String, required: true, unique: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, unique: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch" },
    studentName: { type: String, required: true },
    courseTitle: { type: String, required: true },
    batchName: { type: String, default: "" },
    grade: { type: String, trim: true, default: "" },
    isTopper: { type: Boolean, default: false },
    issueDate: { type: Date, default: Date.now },
    teacherName: { type: String, default: "" },
    teacherDesignation: { type: String, default: "Course Instructor" },
    teacherSignature: { type: String, default: "" },
    ceoName: { type: String, default: "" },
    ceoSignature: { type: String, default: "" },
    isRevoked: { type: Boolean, default: false },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
export const Certificate = mongoose.model("Certificate", certificateSchema);

const settingSchema = new Schema(
  {
    key: { type: String, default: "site", unique: true },
    siteName: { type: String, default: "Unitech Bangladesh" },
    tagline: { type: String, default: "দক্ষ হবো ইউনিটেক এর সাথে" },
    logo: { type: String, default: "/images/logo.png" },
    phone: { type: String, default: "01705100763" },
    phone2: { type: String, default: "01830-330129" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    mapEmbedUrl: { type: String, default: "" },
    facebook: { type: String, default: "" },
    youtube: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    aboutText: { type: String, default: "" },
    // পেমেন্ট নির্দেশনা (এনরোল পেজে দেখাবে)
    paymentInstructions: { type: String, default: "" },
    bkashNumber: { type: String, default: "" },
    nagadNumber: { type: String, default: "" },
    // সার্টিফিকেট
    ceoName: { type: String, default: "" },
    ceoTitle: { type: String, default: "Chief Executive Officer" },
    ceoSignature: { type: String, default: "" },
    certificateText: {
      type: String,
      default: "has successfully completed the course with dedication and excellence.",
    },
    // এসএমএস টেমপ্লেট — {name} {course} {batch} {payable} {paid} {due} {amount} {studentId} {date} {time} {site}
    sms: {
      enrollEnabled: { type: Boolean, default: true },
      enrollTemplate: {
        type: String,
        default: "প্রিয় {name}, {course} কোর্সে আপনার এনরোলমেন্ট গ্রহণ করা হয়েছে। মোট ফি {payable} টাকা। বিকাশ/নগদ/অফিসে পেমেন্ট করুন। -{site}",
      },
      approveEnabled: { type: Boolean, default: true },
      approveTemplate: {
        type: String,
        default: "প্রিয় {name}, {course} ({batch}) কোর্সে আপনার ভর্তি নিশ্চিত হয়েছে। স্টুডেন্ট আইডি: {studentId}। -{site}",
      },
      paymentEnabled: { type: Boolean, default: true },
      paymentTemplate: {
        type: String,
        default: "প্রিয় {name}, {amount} টাকা পেমেন্ট গ্রহণ করা হয়েছে। মোট জমা {paid} টাকা, বকেয়া {due} টাকা। রসিদ: {receipt} -{site}",
      },
      dueTemplate: {
        type: String,
        default: "প্রিয় {name}, {course} কোর্সে আপনার {due} টাকা বকেয়া আছে। দ্রুত পরিশোধ করার অনুরোধ রইল। -{site}",
      },
      batchTemplate: {
        type: String,
        default: "প্রিয় {name}, {course} ({batch}) এর ক্লাস শুরু {date}, সময় {time}। সময়মতো উপস্থিত থাকুন। -{site}",
      },
      completeTemplate: {
        type: String,
        default: "অভিনন্দন {name}! {course} কোর্স সফলভাবে সম্পন্ন হয়েছে। সার্টিফিকেট যাচাই: {site}",
      },
    },
    stats: {
      students: { type: String, default: "5000+" },
      courses: { type: String, default: "15+" },
      batches: { type: String, default: "200+" },
      jobPlacement: { type: String, default: "80%" },
    },
  },
  { timestamps: true },
);
export const Setting = mongoose.model("Setting", settingSchema);

export async function getSettings() {
  let s = await Setting.findOne({ key: "site" });
  if (!s) s = await Setting.create({ key: "site" });
  return s;
}
