import clsx, { type ClassValue } from "clsx";

export const cn = (...c: ClassValue[]) => clsx(c);

const bnDigits = "০১২৩৪৫৬৭৮৯";
export const bn = (v: string | number) => String(v).replace(/\d/g, (d) => bnDigits[+d]);

export const money = (n?: number | null) => `৳${(n || 0).toLocaleString("en-IN")}`;

export const fmtDate = (d?: string | Date | null, withTime = false) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Dhaka",
  });
};

export const toInputDate = (d?: string | Date | null) => {
  if (!d) return "";
  const date = new Date(d);
  return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

export const finalPrice = (c: { price: number; discountPrice?: number }) =>
  c.discountPrice && c.discountPrice > 0 && c.discountPrice < c.price ? c.discountPrice : c.price;

export const discountPct = (c: { price: number; discountPrice?: number }) =>
  c.discountPrice && c.discountPrice > 0 && c.discountPrice < c.price ? Math.round(((c.price - c.discountPrice) / c.price) * 100) : 0;

/** YouTube লিংক থেকে ভিডিও আইডি */
export function youtubeId(url?: string) {
  if (!url) return "";
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : "";
}

export const ENROLL_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "অপেক্ষমাণ", cls: "bg-amber-50 text-amber-700" },
  approved: { label: "ভর্তি নিশ্চিত", cls: "bg-emerald-50 text-emerald-700" },
  completed: { label: "সম্পন্ন", cls: "bg-blue-50 text-blue-700" },
  cancelled: { label: "বাতিল", cls: "bg-gray-100 text-gray-600" },
  rejected: { label: "প্রত্যাখ্যাত", cls: "bg-red-50 text-red-700" },
};

export const BATCH_STATUS: Record<string, { label: string; cls: string }> = {
  upcoming: { label: "আসন্ন", cls: "bg-amber-50 text-amber-700" },
  running: { label: "চলমান", cls: "bg-emerald-50 text-emerald-700" },
  completed: { label: "সম্পন্ন", cls: "bg-blue-50 text-blue-700" },
  cancelled: { label: "বাতিল", cls: "bg-gray-100 text-gray-600" },
};

export const PAY_METHODS: Record<string, string> = { cash: "নগদ (অফিস)", bkash: "বিকাশ", nagad: "নগদ (Nagad)", rocket: "রকেট", bank: "ব্যাংক", other: "অন্যান্য" };

export const EXPENSE_TYPES: Record<string, string> = {
  teacher_payment: "শিক্ষক পেমেন্ট",
  salary: "স্টাফ বেতন",
  rent: "অফিস ভাড়া",
  utility: "বিল (বিদ্যুৎ/ইন্টারনেট)",
  marketing: "মার্কেটিং",
  equipment: "যন্ত্রপাতি",
  other: "অন্যান্য",
};

export const ROLE_LABEL: Record<string, string> = { superadmin: "Super Admin", ceo: "CEO", admin: "Admin", teacher: "শিক্ষক", student: "শিক্ষার্থী" };

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const dashboardPath = (role?: string) =>
  role === "student" ? "/dashboard" : role === "teacher" ? "/teacher" : role ? "/admin" : "/login";
