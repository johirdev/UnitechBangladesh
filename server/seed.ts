/**
 * প্রথমবার ডেটাবেস সাজানো:  npm run seed
 * - Master Admin (.env এর MASTER_ADMIN_*, না থাকলে src/lib/demo-accounts.ts), ডিফল্ট শিক্ষক ও শিক্ষার্থী তৈরি করে
 * - খালি থাকলে ক্যাটাগরি, কোর্স, ব্যাচ, ব্যানার, গ্যালারি, ইন্ডাস্ট্রিয়াল এটাচমেন্ট, সেটিংস যোগ করে
 * - পাসওয়ার্ড আবার .env অনুযায়ী সেট করতে:  npm run seed -- --reset-admin
 */
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { config } from "./config";
import { connectDB } from "./lib/db";
import { slugify } from "./lib/http";
import { User } from "./models/User";
import { Category, Course, Batch } from "./models/Catalog";
import { Banner, Gallery, Attachment, getSettings, Setting } from "./models/Content";

import { MASTER_ADMIN, DEMO_TEACHER, DEMO_STUDENT, type DemoAccount } from "../src/lib/demo-accounts";

const env = (k: string, d = "") => (process.env[k] || d).trim();

/** ডিফল্ট শিক্ষক/শিক্ষার্থী — না থাকলে তৈরি, --reset-admin দিলে পাসওয়ার্ড আবার ডিফল্টে */
async function seedDemoUser(a: DemoAccount, role: "teacher" | "student") {
  const reset = process.argv.includes("--reset-admin");
  const email = a.email.toLowerCase();
  let u = await User.findOne({ $or: [{ email }, { phone: a.phone }] }).select("+tokenVersion");
  if (!u) {
    await User.create({
      name: a.name,
      email,
      phone: a.phone,
      password: await bcrypt.hash(a.password, config.bcryptRounds),
      role,
      designation: a.designation || "",
      isPhoneVerified: true,
    });
    console.log(`✅ ডিফল্ট ${a.label} তৈরি হয়েছে: ${email} / ${a.password}`);
    return;
  }
  u.role = role;
  u.isActive = true;
  if (reset) {
    u.password = await bcrypt.hash(a.password, config.bcryptRounds);
    u.tokenVersion = (u.tokenVersion || 0) + 1;
    console.log(`🔑 ${a.label} পাসওয়ার্ড ডিফল্টে রিসেট হয়েছে`);
  }
  await u.save();
  console.log(`ℹ️  ডিফল্ট ${a.label} আগেই আছে: ${email}`);
}

async function seedAdmin() {
  const email = env("MASTER_ADMIN_EMAIL", MASTER_ADMIN.email).toLowerCase();
  const password = env("MASTER_ADMIN_PASSWORD", MASTER_ADMIN.password);
  const phone = env("MASTER_ADMIN_PHONE", MASTER_ADMIN.phone);
  const name = env("MASTER_ADMIN_NAME", MASTER_ADMIN.name);
  if (!email || !password) throw new Error(".env এ MASTER_ADMIN_EMAIL ও MASTER_ADMIN_PASSWORD দিন");
  if (password.length < 8) throw new Error("MASTER_ADMIN_PASSWORD কমপক্ষে ৮ অক্ষরের দিন");

  const reset = process.argv.includes("--reset-admin");
  let admin = await User.findOne({ $or: [{ email }, { phone }] }).select("+tokenVersion");
  if (!admin) {
    admin = await User.create({
      name,
      email,
      phone,
      password: await bcrypt.hash(password, config.bcryptRounds),
      role: "superadmin",
      designation: "Master Admin",
      isPhoneVerified: true,
    });
    console.log(`✅ Master Admin তৈরি হয়েছে: ${email} / ${phone}`);
  } else {
    admin.role = "superadmin";
    admin.isActive = true;
    admin.email = email;
    if (reset) {
      admin.password = await bcrypt.hash(password, config.bcryptRounds);
      admin.tokenVersion = (admin.tokenVersion || 0) + 1;
      console.log("🔑 Master Admin পাসওয়ার্ড .env অনুযায়ী রিসেট হয়েছে");
    }
    await admin.save();
    console.log(`ℹ️  Master Admin আগেই আছে: ${email}`);
  }
}

const CATEGORIES = [
  { name: "Web Development", image: "/images/category/web.png", description: "HTML, CSS, JavaScript, React দিয়ে প্রফেশনাল ওয়েবসাইট তৈরি" },
  { name: "Graphic Design", image: "/images/category/graphic.png", description: "Photoshop, Illustrator দিয়ে ক্রিয়েটিভ ডিজাইন" },
  { name: "Basic Computer", image: "/images/category/basic-computer.png", description: "অফিস অ্যাপ্লিকেশন ও কম্পিউটারের মৌলিক দক্ষতা" },
  { name: "AutoCAD Basic & Premium", image: "/images/category/autocad.png", description: "সিভিল ও আর্কিটেকচারাল 2D ড্রয়িং" },
  { name: "AutoCAD 3D", image: "/images/category/autocad-3d.png", description: "3D মডেলিং ও রেন্ডারিং" },
  { name: "Digital Marketing", image: "/images/category/digital-marketing.png", description: "Facebook, Google, SEO ও কনটেন্ট মার্কেটিং" },
  { name: "UX/UI Design", image: "/images/category/graphic.png", description: "Figma দিয়ে ইউজার এক্সপেরিয়েন্স ও ইন্টারফেস ডিজাইন" },
  { name: "Video Editing", image: "/images/category/video.webp", description: "Premiere Pro ও After Effects দিয়ে ভিডিও এডিটিং" },
];

type CourseSeed = {
  cat: string;
  title: string;
  price: number;
  discountPrice: number;
  duration: string;
  totalClasses: number;
  thumbnail: string;
  tools: string[];
  projects: string[];
  modules: [string, string[]][];
};

const COURSES: CourseSeed[] = [
  {
    cat: "AutoCAD Basic & Premium",
    title: "AutoCAD Basic to Premium (Civil & Architecture)",
    price: 8000,
    discountPrice: 6000,
    duration: "৩ মাস",
    totalClasses: 36,
    thumbnail: "/images/gallery/autocad.jpg",
    tools: ["AutoCAD", "Excel", "PDF Plot"],
    projects: ["ডুপ্লেক্স বাড়ির ফ্লোর প্ল্যান", "RAJUK অনুমোদন উপযোগী ড্রয়িং", "স্ট্রাকচারাল ডিটেইলিং (বিম/কলাম)", "ইলেকট্রিক্যাল লে-আউট"],
    modules: [
      ["AutoCAD পরিচিতি", ["ইন্টারফেস ও সেটআপ", "Draw ও Modify কমান্ড", "লেয়ার ম্যানেজমেন্ট"]],
      ["আর্কিটেকচারাল ড্রয়িং", ["ফ্লোর প্ল্যান", "এলিভেশন ও সেকশন", "ডাইমেনশন ও টেক্সট"]],
      ["সিভিল ড্রয়িং", ["ফাউন্ডেশন প্ল্যান", "বিম-কলাম ডিটেইল", "রিইনফোর্সমেন্ট ড্রয়িং"]],
      ["প্রেজেন্টেশন ও প্রিন্ট", ["Layout ও Viewport", "প্লট/PDF তৈরি", "ফাইনাল প্রজেক্ট"]],
    ],
  },
  {
    cat: "AutoCAD 3D",
    title: "AutoCAD 3D Modeling & Rendering",
    price: 9000,
    discountPrice: 7000,
    duration: "২ মাস",
    totalClasses: 24,
    thumbnail: "/images/misc/architectural.jpg",
    tools: ["AutoCAD 3D", "3ds Max", "Lumion"],
    projects: ["৩ তলা ভবনের 3D মডেল", "ইন্টেরিয়র রেন্ডার", "এক্সটেরিয়র ওয়াকথ্রু"],
    modules: [
      ["3D বেসিক", ["UCS ও ভিউ", "Solid ও Surface মডেলিং"]],
      ["রেন্ডারিং", ["ম্যাটেরিয়াল ও লাইট", "ক্যামেরা ও রেন্ডার সেটিং"]],
    ],
  },
  {
    cat: "Web Development",
    title: "Professional Web Development",
    price: 15000,
    discountPrice: 12000,
    duration: "৬ মাস",
    totalClasses: 72,
    thumbnail: "/images/misc/post-1.jpg",
    tools: ["HTML", "CSS", "Tailwind CSS", "JavaScript", "React", "Next.js", "Node.js", "MongoDB", "Git & GitHub"],
    projects: ["পার্সোনাল পোর্টফোলিও ওয়েবসাইট", "ই-কমার্স ওয়েবসাইট", "কোর্স ম্যানেজমেন্ট ড্যাশবোর্ড", "REST API তৈরি"],
    modules: [
      ["ওয়েব ফান্ডামেন্টাল", ["HTML5", "CSS3 ও Flexbox/Grid", "রেসপন্সিভ ডিজাইন"]],
      ["JavaScript", ["বেসিক থেকে অ্যাডভান্সড", "DOM", "ES6+ ও Async"]],
      ["React ও Next.js", ["কম্পোনেন্ট ও Hooks", "রাউটিং", "API ইন্টিগ্রেশন"]],
      ["ব্যাকএন্ড", ["Node.js ও Express", "MongoDB", "অথেন্টিকেশন", "ডিপ্লয়মেন্ট"]],
    ],
  },
  {
    cat: "Graphic Design",
    title: "Graphic Design Mastery",
    price: 10000,
    discountPrice: 7500,
    duration: "৪ মাস",
    totalClasses: 48,
    thumbnail: "/images/misc/post-2.jpg",
    tools: ["Adobe Photoshop", "Adobe Illustrator", "Canva"],
    projects: ["লোগো ও ব্র্যান্ড আইডেন্টিটি", "সোশ্যাল মিডিয়া পোস্ট", "ব্যানার ও লিফলেট", "প্যাকেজিং ডিজাইন"],
    modules: [
      ["ডিজাইন প্রিন্সিপাল", ["কালার থিওরি", "টাইপোগ্রাফি", "লে-আউট"]],
      ["Photoshop", ["ফটো এডিটিং", "ম্যানিপুলেশন"]],
      ["Illustrator", ["ভেক্টর", "লোগো ডিজাইন"]],
      ["ফ্রিল্যান্সিং", ["Fiverr ও Upwork প্রোফাইল", "পোর্টফোলিও"]],
    ],
  },
  {
    cat: "Basic Computer",
    title: "Basic Computer & Office Application",
    price: 4000,
    discountPrice: 3000,
    duration: "২ মাস",
    totalClasses: 24,
    thumbnail: "/images/gallery/1.jpg",
    tools: ["MS Word", "MS Excel", "MS PowerPoint", "Internet & Email", "বাংলা টাইপিং"],
    projects: ["অফিস লেটার ও সিভি তৈরি", "Excel দিয়ে হিসাব শিট", "প্রেজেন্টেশন তৈরি"],
    modules: [
      ["কম্পিউটার পরিচিতি", ["Windows", "ফাইল ম্যানেজমেন্ট", "টাইপিং"]],
      ["MS Office", ["Word", "Excel", "PowerPoint"]],
    ],
  },
  {
    cat: "Digital Marketing",
    title: "Digital Marketing Pro",
    price: 9000,
    discountPrice: 6500,
    duration: "৩ মাস",
    totalClasses: 30,
    thumbnail: "/images/gallery/6.jpg",
    tools: ["Facebook Ads Manager", "Google Ads", "SEO Tools", "Canva", "Google Analytics"],
    projects: ["ফেসবুক পেজ গ্রোথ ক্যাম্পেইন", "SEO অডিট রিপোর্ট", "Google Ads ক্যাম্পেইন সেটআপ"],
    modules: [
      ["সোশ্যাল মিডিয়া মার্কেটিং", ["পেজ সেটআপ", "কনটেন্ট প্ল্যান", "Ads"]],
      ["SEO", ["কিওয়ার্ড রিসার্চ", "On-page", "Off-page"]],
    ],
  },
  {
    cat: "UX/UI Design",
    title: "UX/UI Design with Figma",
    price: 12000,
    discountPrice: 9000,
    duration: "৩ মাস",
    totalClasses: 36,
    thumbnail: "/images/gallery/5.jpg",
    tools: ["Figma", "FigJam", "Adobe XD"],
    projects: ["মোবাইল অ্যাপ UI", "ওয়েবসাইট ল্যান্ডিং পেজ", "ডিজাইন সিস্টেম"],
    modules: [
      ["UX রিসার্চ", ["ইউজার পারসোনা", "ওয়্যারফ্রেম"]],
      ["UI ডিজাইন", ["কম্পোনেন্ট", "প্রোটোটাইপ"]],
    ],
  },
  {
    cat: "Video Editing",
    title: "Video Editing (Basic & Premium)",
    price: 9000,
    discountPrice: 7000,
    duration: "৩ মাস",
    totalClasses: 30,
    thumbnail: "/images/gallery/4.jpg",
    tools: ["Adobe Premiere Pro", "After Effects", "CapCut"],
    projects: ["YouTube ভিডিও এডিট", "প্রোমো/অ্যাড ভিডিও", "মোশন গ্রাফিক্স ইন্ট্রো"],
    modules: [
      ["Premiere Pro", ["কাটিং ও ট্রানজিশন", "কালার গ্রেডিং", "অডিও"]],
      ["After Effects", ["মোশন গ্রাফিক্স", "টেক্সট অ্যানিমেশন"]],
    ],
  },
];

async function seedContent() {
  if ((await Category.countDocuments()) === 0) {
    await Category.insertMany(CATEGORIES.map((c, i) => ({ ...c, slug: slugify(c.name), order: i })));
    console.log("✅ ক্যাটাগরি যোগ হয়েছে");
  }
  if ((await Course.countDocuments()) === 0) {
    const cats = await Category.find().lean();
    for (const [i, c] of COURSES.entries()) {
      const cat = cats.find((x) => x.name === c.cat);
      if (!cat) continue;
      const course = await Course.create({
        title: c.title,
        slug: slugify(c.title),
        category: cat._id,
        thumbnail: c.thumbnail,
        shortDescription: `${c.title} — হাতে-কলমে প্রজেক্টভিত্তিক শেখা, অভিজ্ঞ মেন্টর ও জব প্লেসমেন্ট সাপোর্ট।`,
        description: `এই কোর্সে আপনি একদম শুরু থেকে প্রফেশনাল লেভেল পর্যন্ত শিখবেন। প্রতিটি ক্লাসে হাতে-কলমে কাজ, রিয়েল প্রজেক্ট এবং অভিজ্ঞ ইনস্ট্রাক্টরের সরাসরি গাইডলাইন থাকবে।\n\nকোর্স শেষে সার্টিফিকেট, পোর্টফোলিও তৈরি এবং ইন্ডাস্ট্রিয়াল এটাচমেন্টের সুযোগ।`,
        price: c.price,
        discountPrice: c.discountPrice,
        offerText: "সীমিত সময়ের অফার",
        duration: c.duration,
        totalClasses: c.totalClasses,
        classSchedule: "সপ্তাহে ৩ দিন, প্রতিদিন ২ ঘণ্টা",
        mode: "offline",
        level: "শুরু থেকে",
        tools: c.tools.map((name) => ({ name, icon: "" })),
        projects: c.projects.map((title) => ({ title, description: "", image: "" })),
        curriculum: c.modules.map(([title, lessons]) => ({ title, lessons })),
        features: ["লাইভ ইন্টারেক্টিভ ক্লাস", "মডিউলভিত্তিক স্টাডি প্ল্যান", "ক্লাস রেকর্ডিং ও নোট", "কোর্স শেষে সার্টিফিকেট", "জব প্লেসমেন্ট সাপোর্ট", "আজীবন সাপোর্ট গ্রুপ"],
        requirements: ["ল্যাপটপ/কম্পিউটার (ক্লাসে কম্পিউটার ল্যাব সুবিধা আছে)", "শেখার আগ্রহ"],
        whoFor: ["ডিপ্লোমা ও বিএসসি শিক্ষার্থী", "চাকরিপ্রত্যাশী", "ফ্রিল্যান্সার হতে চান যারা"],
        faqs: [
          { q: "ক্লাস কোথায় হবে?", a: "ফার্মগেট, ঢাকায় আমাদের ক্যাম্পাসে।" },
          { q: "কিস্তিতে পেমেন্ট করা যাবে?", a: "হ্যাঁ, ভর্তির সময় আংশিক এবং বাকিটা কোর্স চলাকালীন পরিশোধ করা যাবে।" },
          { q: "সার্টিফিকেট কীভাবে যাচাই করবো?", a: "ওয়েবসাইটের 'সার্টিফিকেট যাচাই' পেজে স্টুডেন্ট আইডি বা সার্টিফিকেট নম্বর দিয়ে।" },
        ],
        isFeatured: i < 4,
        order: i,
      });
      const start = new Date();
      start.setDate(start.getDate() + 10 + i);
      await Batch.create({ course: course._id, name: "Batch 01", code: `B01`, startDate: start, schedule: "শনি, সোম, বুধ — সন্ধ্যা ৬:৩০", status: "upcoming", seatLimit: 30 });
    }
    console.log("✅ কোর্স ও ব্যাচ যোগ হয়েছে");
  }
  if ((await Banner.countDocuments()) === 0) {
    await Banner.insertMany([
      { title: "দক্ষ হবো ইউনিটেক এর সাথে", subtitle: "ডিপ্লোমা সেমিস্টার ও স্কিল কোর্স — গভীর জ্ঞান ও পেশাদার দক্ষতা", image: "/images/banner/banner1.png", buttonText: "কোর্স দেখুন", buttonLink: "/courses", order: 0 },
      { title: "AutoCAD, Civil ও Architecture", subtitle: "ইন্ডাস্ট্রি এক্সপার্টদের কাছ থেকে হাতে-কলমে শিখুন", image: "/images/banner/banner2.jpg", buttonText: "এখনই ভর্তি হোন", buttonLink: "/courses", order: 1 },
      { title: "লাইভ ক্লাস ও জব প্লেসমেন্ট", subtitle: "মডিউলভিত্তিক স্টাডি প্ল্যান ও রিয়েল-টাইম প্রগ্রেস ট্র্যাকিং", image: "/images/banner/banner3.jpg", buttonText: "বিস্তারিত", buttonLink: "/courses", order: 2 },
      { title: "আপনার ক্যারিয়ার শুরু হোক আজই", subtitle: "Web, Graphic, Digital Marketing, Video Editing ও আরও অনেক কিছু", image: "/images/banner/banner4.jpg", buttonText: "যোগাযোগ করুন", buttonLink: "/#contact", order: 3 },
    ]);
    console.log("✅ ব্যানার যোগ হয়েছে");
  }
  if ((await Gallery.countDocuments()) === 0) {
    const g = [
      ["একাডেমিক ক্লাস", "/images/gallery/1.jpg"],
      ["AutoCAD ক্লাস", "/images/gallery/autocad.jpg"],
      ["ইন্ডাস্ট্রিয়াল এটাচমেন্ট", "/images/gallery/3.jpg"],
      ["বার্ষিক ট্যুর ২০-২১", "/images/gallery/4.jpg"],
      ["ম্যাথমেটিক্স ক্লাস", "/images/gallery/5.jpg"],
      ["ক্যারিয়ার মিটআপ", "/images/gallery/6.jpg"],
      ["সার্টিফিকেট প্রদান অনুষ্ঠান", "/images/gallery/7.jpg"],
      ["একাডেমিক পরীক্ষা", "/images/gallery/2.jpg"],
    ];
    await Gallery.insertMany(g.map(([title, image], order) => ({ title, image, order })));
    console.log("✅ গ্যালারি যোগ হয়েছে");
  }
  if ((await Attachment.countDocuments()) === 0) {
    await Attachment.insertMany([
      { title: "Computer Technology", department: "Computer", image: "/images/attachment/computer.jpeg", description: "কম্পিউটার টেকনোলজি শিক্ষার্থীদের জন্য ইন্ডাস্ট্রিয়াল এটাচমেন্ট — রিয়েল প্রজেক্টে কাজের অভিজ্ঞতা।", link: "/courses", order: 0 },
      { title: "Civil Technology", department: "Civil", image: "/images/attachment/civil.jpeg", description: "সিভিল টেকনোলজি শিক্ষার্থীদের জন্য সাইট ভিজিট, ড্রয়িং ও এস্টিমেটিং প্র্যাকটিস।", link: "/courses", order: 1 },
      { title: "Architecture Technology", department: "Architecture", image: "/images/attachment/architecture.jpeg", description: "আর্কিটেকচার শিক্ষার্থীদের জন্য RAJUK প্ল্যান, ইন্টেরিয়র ও 3D ভিজ্যুয়ালাইজেশন।", link: "/courses", order: 2 },
    ]);
    console.log("✅ ইন্ডাস্ট্রিয়াল এটাচমেন্ট যোগ হয়েছে");
  }
  const s = await getSettings();
  if (!s.address) {
    await Setting.updateOne(
      { _id: s._id },
      {
        $set: {
          email: "unitechbangladesh@gmail.com",
          address: "মাহবুব প্লাজা (৭ম তলা), রুম #৭০৪/বি, ৪/এ ইন্দিরা রোড, ফার্মগেট, ঢাকা-১২১৫",
          aboutText: "ইউনিটেক বাংলাদেশ — ডিপ্লোমা ইঞ্জিনিয়ারিং (সিভিল, আর্কিটেকচার, কম্পিউটার) শিক্ষার্থী ও চাকরিপ্রত্যাশীদের জন্য দক্ষতাভিত্তিক প্রশিক্ষণ প্রতিষ্ঠান। আমাদের লক্ষ্য প্রত্যেক শিক্ষার্থীকে দক্ষ করে গড়ে তোলা।",
          paymentInstructions: "বিকাশ/নগদে 'Send Money' করে ট্রানজেকশন আইডি দিন, অথবা অফিসে এসে নগদ পরিশোধ করুন। পেমেন্ট যাচাই হলে এসএমএসে জানানো হবে।",
          bkashNumber: "01705100763",
          nagadNumber: "01705100763",
        },
      },
    );
    console.log("✅ সেটিংস যোগ হয়েছে");
  }
}

(async () => {
  await connectDB();
  await User.syncIndexes();
  await seedAdmin();
  await seedDemoUser(DEMO_TEACHER, "teacher");
  await seedDemoUser(DEMO_STUDENT, "student");
  await seedContent();
  await mongoose.disconnect();
  console.log("🎉 Seed সম্পন্ন");
})().catch(async (e) => {
  console.error("❌", e.message || e);
  await mongoose.disconnect();
  process.exit(1);
});
