/**
 * ডিফল্ট লগইন অ্যাকাউন্ট — লগইন পেজে দেখানো হয় (কপি করে লগইন করা যায়)
 * এবং `npm run seed` এগুলোই ডেটাবেসে তৈরি করে।
 *
 * লগইন পেজ থেকে লুকাতে: .env এ NEXT_PUBLIC_SHOW_DEMO_LOGIN=false
 * ⚠️ সাইট লাইভ হলে লুকিয়ে ফেলুন এবং পাসওয়ার্ড বদলে দিন।
 */
export type DemoAccount = {
  key: "superadmin" | "teacher" | "student";
  label: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  designation?: string;
};

export const MASTER_ADMIN: DemoAccount = {
  key: "superadmin",
  label: "মাস্টার অ্যাডমিন",
  name: "Unitech Bangladesh",
  email: "unitechbangladesh@gmail.com",
  phone: "01705100763",
  password: "unitechbangladesh2026",
  designation: "Master Admin",
};

export const DEMO_TEACHER: DemoAccount = {
  key: "teacher",
  label: "শিক্ষক",
  name: "Demo Teacher",
  email: "teacher@unitechbangladesh.com",
  phone: "01700000001",
  password: "Teacher@2026",
  designation: "Instructor",
};

export const DEMO_STUDENT: DemoAccount = {
  key: "student",
  label: "শিক্ষার্থী",
  name: "Demo Student",
  email: "student@unitechbangladesh.com",
  phone: "01700000002",
  password: "Student@2026",
};

export const showDemoLogin = process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN !== "false";
