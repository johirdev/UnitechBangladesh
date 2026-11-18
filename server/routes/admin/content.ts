import { Router } from "express";
import { z } from "zod";
import { crudRouter } from "../../lib/crud";
import { imageUrl, linkUrl, objectIdStr, slugify, ok, objectId, paging, qstr } from "../../lib/http";
import { ApiError } from "../../lib/errors";
import { audit } from "../../lib/audit";
import { requirePerm } from "../../middleware/auth";
import { Banner, Gallery, Attachment, Topper, Review } from "../../models/Content";
import { Category, PromoCode, Course } from "../../models/Catalog";
import { Architectural, getArchitectural } from "../../models/Architectural";

const router = Router();
const str = (max: number) => z.string().trim().max(max);
const order = z.coerce.number().int().min(0).max(10000).optional();
const optDate = z.union([z.coerce.date(), z.literal(""), z.null()]).optional().transform((v) => (v ? v : undefined));

router.use(
  "/banners",
  crudRouter({
    model: Banner,
    entity: "ব্যানার",
    perm: "content",
    schema: z.object({
      title: str(150).optional(),
      subtitle: str(300).optional(),
      image: imageUrl.refine((v) => !!v, "ছবি দিন"),
      buttonText: str(40).optional(),
      buttonLink: linkUrl.optional(),
      order,
      isActive: z.boolean().optional(),
    }),
    searchFields: ["title"],
  }),
);

// ক্যাটাগরিতে কোর্স থাকলে মুছা যাবে না
router.delete("/categories/:id", requirePerm("content"), async (req, _res, next) => {
  const n = await Course.countDocuments({ category: objectId(req.params.id) });
  if (n > 0) throw new ApiError(400, `এই ক্যাটাগরিতে ${n}টি কোর্স আছে — আগে কোর্সগুলো অন্য ক্যাটাগরিতে সরান`);
  next();
});

router.use(
  "/categories",
  crudRouter({
    model: Category,
    entity: "ক্যাটাগরি",
    perm: "content",
    schema: z.object({
      name: str(80).min(2, "নাম দিন"),
      slug: str(80).optional(),
      image: imageUrl.optional(),
      description: str(400).optional(),
      order,
      isActive: z.boolean().optional(),
    }),
    searchFields: ["name"],
    beforeSave: async (d, _req, id) => {
      if (d.name && (!d.slug || !id)) d.slug = slugify(String(d.slug || d.name));
      if (d.slug) {
        const clash = await Category.findOne({ slug: d.slug, ...(id ? { _id: { $ne: id } } : {}) }).lean();
        if (clash) d.slug = `${d.slug}-${Date.now().toString(36).slice(-4)}`;
      }
      return d;
    },
  }),
);


router.use(
  "/gallery",
  crudRouter({
    model: Gallery,
    entity: "গ্যালারি ছবি",
    perm: "content",
    schema: z.object({
      title: str(120).min(2, "শিরোনাম দিন"),
      description: str(400).optional(),
      image: imageUrl.refine((v) => !!v, "ছবি দিন"),
      order,
      isActive: z.boolean().optional(),
    }),
    searchFields: ["title"],
  }),
);

router.use(
  "/attachments",
  crudRouter({
    model: Attachment,
    entity: "ইন্ডাস্ট্রিয়াল এটাচমেন্ট",
    perm: "content",
    schema: z.object({
      title: str(150).min(2, "শিরোনাম দিন"),
      department: str(80).optional(),
      image: imageUrl.optional(),
      description: str(500).optional(),
      link: linkUrl.optional(),
      order,
      isActive: z.boolean().optional(),
    }),
    searchFields: ["title", "department"],
  }),
);

router.use(
  "/toppers",
  crudRouter({
    model: Topper,
    entity: "টপার",
    perm: "content",
    schema: z.object({
      student: objectIdStr,
      course: objectIdStr.optional().or(z.literal("")).transform((v) => v || undefined),
      batch: objectIdStr.optional().or(z.literal("")).transform((v) => v || undefined),
      title: str(80).optional(),
      project: str(150).optional(),
      image: imageUrl.optional(),
      quote: str(300).optional(),
      order,
      isActive: z.boolean().optional(),
    }),
    populate: [
      { path: "student", select: "name avatar studentId phone" },
      { path: "course", select: "title" },
      { path: "batch", select: "name" },
    ],
  }),
);

router.use(
  "/promo-codes",
  crudRouter({
    model: PromoCode,
    entity: "প্রোমো কোড",
    perm: "courses",
    schema: z.object({
      code: str(30)
        .min(3, "কোড দিন")
        .regex(/^[A-Za-z0-9_-]+$/, "কোডে শুধু অক্ষর/সংখ্যা")
        .transform((v) => v.toUpperCase()),
      type: z.enum(["percent", "flat"]),
      value: z.coerce.number().min(0),
      maxDiscount: z.coerce.number().min(0).optional(),
      courses: z.array(objectIdStr).optional(),
      maxUses: z.coerce.number().int().min(0).optional(),
      validFrom: optDate,
      validTo: optDate,
      isActive: z.boolean().optional(),
      note: str(200).optional(),
    }),
    searchFields: ["code"],
    sort: { createdAt: -1 },
    populate: [{ path: "courses", select: "title" }],
    beforeSave: (d) => {
      if (d.type === "percent" && Number(d.value) > 100) throw new ApiError(400, "শতাংশ ১০০ এর বেশি হতে পারে না");
      return d;
    },
  }),
);

// ---------- রিভিউ মডারেশন ----------
const reviews = Router();
reviews.use(requirePerm("content"));
reviews.get("/", async (req, res) => {
  const { page, limit, skip } = paging(req);
  const f: Record<string, unknown> = {};
  const st = qstr(req.query.status);
  if (st === "pending") f.isApproved = false;
  if (st === "approved") f.isApproved = true;
  const [items, total] = await Promise.all([
    Review.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("student", "name phone avatar").populate("course", "title").lean(),
    Review.countDocuments(f),
  ]);
  ok(res, items, "সফল", 200, { page, limit, total, pages: Math.ceil(total / limit) });
});
reviews.patch("/:id", async (req, res) => {
  const { isApproved } = z.object({ isApproved: z.boolean() }).parse(req.body);
  const r = await Review.findByIdAndUpdate(objectId(req.params.id), { isApproved }, { new: true });
  if (!r) throw new ApiError(404, "রিভিউ পাওয়া যায়নি");
  audit(req, isApproved ? "approve" : "unapprove", "Review", r._id);
  ok(res, r, isApproved ? "রিভিউ অনুমোদিত" : "রিভিউ লুকানো হয়েছে");
});
reviews.delete("/:id", async (req, res) => {
  await Review.findByIdAndDelete(objectId(req.params.id));
  audit(req, "delete", "Review", req.params.id);
  ok(res, {}, "রিভিউ মুছে ফেলা হয়েছে");
});
router.use("/reviews", reviews);

export default router;

// ---------- UNITECH Architectural পেজ ----------
const arch = Router();
arch.use(requirePerm("content"));
const t = (n: number) => z.string().trim().max(n).default("");
const archBody = z
  .object({
    isActive: z.boolean(),
    hero: z.object({ badge: t(80), title: t(200), subtitle: t(500), image: imageUrl, background: imageUrl, ctaText: t(60) }),
    about: z.object({ title: t(120), text: t(2000), image: imageUrl }),
    milestone: z.object({ title: t(120), text: t(2000) }),
    offers: z.array(z.object({ image: imageUrl, title: t(120), highlight: t(80), label: t(60), price: t(40), unit: t(40) })).max(10),
    intro: z.object({ badge: t(80), title: t(200), text: t(2000), image: imageUrl }),
    stats: z.array(z.object({ value: t(20), label: t(80) })).max(12),
    certification: z.object({ title: t(200), text: t(3000), image: imageUrl }),
    tabs: z.array(z.object({ icon: imageUrl, name: t(40), title: t(150), text: t(2000) })).max(10),
    initiativesTitle: t(120),
    initiatives: z.array(z.object({ value: t(20), label: t(120) })).max(16),
    latestTitle: t(120),
    latest: z.object({ title: t(150), location: t(150), year: t(20), description: t(1000), image: imageUrl }),
    projectsTitle: t(120),
    projectsSubtitle: t(300),
    projects: z.array(z.object({ image: imageUrl.refine((v) => !!v, "প্রজেক্টের ছবি দিন"), title: t(150), location: t(150), year: t(20) })).max(40),
    addressTitle: t(120),
    addresses: z.array(z.object({ label: t(80), address: t(300), phone: t(40), mapUrl: linkUrl })).max(10),
    servicesTitle: t(120),
    services: z.array(z.object({ icon: imageUrl, title: t(80), description: t(300) })).max(24),
    contact: z.object({ phone: t(30), phone2: t(30), email: t(120), whatsapp: t(30) }),
  })
  .partial();

arch.get("/", async (_req, res) => ok(res, await getArchitectural()));
arch.put("/", async (req, res) => {
  const body = archBody.parse(req.body);
  await getArchitectural();
  const doc = await Architectural.findOneAndUpdate({ key: "architectural" }, { $set: body }, { new: true, runValidators: true }).lean();
  audit(req, "update", "Architectural", String(doc?._id || ""));
  ok(res, doc, "আর্কিটেকচারাল পেজ সেভ হয়েছে");
});
arch.post("/reset", async (req, res) => {
  await Architectural.deleteOne({ key: "architectural" });
  const doc = await getArchitectural();
  audit(req, "reset", "Architectural", String(doc._id));
  ok(res, doc, "ডিফল্ট কনটেন্টে ফিরিয়ে আনা হয়েছে");
});
router.use("/architectural", arch);
