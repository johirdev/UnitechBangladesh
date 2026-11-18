import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, trim: true },
    image: { type: String, default: "" },
    description: { type: String, trim: true, maxlength: 400, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Category = mongoose.model("Category", categorySchema);

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    thumbnail: { type: String, default: "" },
    images: { type: [String], default: [] },
    introVideo: { type: String, default: "" }, // YouTube লিংক
    videos: { type: [{ title: String, url: String }], default: [] },
    shortDescription: { type: String, trim: true, maxlength: 300, default: "" },
    description: { type: String, trim: true, maxlength: 10000, default: "" },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0, default: 0 }, // 0 = ডিসকাউন্ট নেই
    offerText: { type: String, trim: true, maxlength: 120, default: "" },
    offerEndsAt: Date,
    duration: { type: String, trim: true, default: "" },
    totalClasses: { type: Number, default: 0 },
    classSchedule: { type: String, trim: true, default: "" },
    mode: { type: String, enum: ["offline", "online", "hybrid"], default: "offline" },
    level: { type: String, trim: true, default: "" },
    language: { type: String, trim: true, default: "বাংলা" },
    tools: { type: [{ name: String, icon: String }], default: [] },
    projects: { type: [{ title: String, description: String, image: String }], default: [] },
    curriculum: { type: [{ title: String, lessons: [String] }], default: [] },
    features: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    whoFor: { type: [String], default: [] },
    faqs: { type: [{ q: String, a: String }], default: [] },
    instructors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isPublished: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    enrollmentOpen: { type: Boolean, default: true },
    maxSeats: { type: Number, min: 0, default: 0 }, // 0 = খোলা ব্যাচগুলোর সিট যোগফল (না থাকলে সীমাহীন)
    order: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);
courseSchema.virtual("finalPrice").get(function () {
  const d = this.discountPrice || 0;
  return d > 0 && d < this.price ? d : this.price;
});
courseSchema.set("toJSON", { virtuals: true });
export const Course = mongoose.model("Course", courseSchema);

const batchSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    code: { type: String, trim: true, maxlength: 30, default: "" },
    teachers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    startDate: Date,
    endDate: Date,
    schedule: { type: String, trim: true, default: "" },
    room: { type: String, trim: true, default: "" },
    seatLimit: { type: Number, default: 0 }, // 0 = সীমাহীন
    fee: { type: Number, min: 0, default: 0 }, // 0 = কোর্সের দাম প্রযোজ্য
    status: { type: String, enum: ["upcoming", "running", "completed", "cancelled"], default: "upcoming", index: true },
    isEnrollOpen: { type: Boolean, default: true },
    note: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);
export const Batch = mongoose.model("Batch", batchSchema);

const promoSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 30 },
    type: { type: String, enum: ["percent", "flat"], default: "percent" },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: 0 },
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }], // খালি = সব কোর্স
    maxUses: { type: Number, default: 0 }, // 0 = সীমাহীন
    usedCount: { type: Number, default: 0 },
    validFrom: Date,
    validTo: Date,
    isActive: { type: Boolean, default: true },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);
export const PromoCode = mongoose.model("PromoCode", promoSchema);
