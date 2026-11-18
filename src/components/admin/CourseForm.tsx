"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, X, GripVertical, Save } from "lucide-react";
import { get, post, patch, errMsg } from "@/lib/api";
import type { Course, Category, User } from "@/lib/types";
import { toInputDate, youtubeId, money, finalPrice } from "@/lib/utils";
import ImageUpload from "@/components/ImageUpload";
import { Field, Switch, ListInput, Spinner } from "@/components/ui";

const EMPTY: Partial<Course> = {
  title: "",
  category: "",
  thumbnail: "",
  images: [],
  introVideo: "",
  videos: [],
  shortDescription: "",
  description: "",
  price: 0,
  discountPrice: 0,
  offerText: "",
  duration: "",
  totalClasses: 0,
  classSchedule: "",
  mode: "offline",
  level: "শুরু থেকে",
  language: "বাংলা",
  tools: [],
  projects: [],
  curriculum: [],
  features: [],
  requirements: [],
  whoFor: [],
  faqs: [],
  instructors: [],
  isPublished: true,
  isFeatured: false,
  enrollmentOpen: true,
  maxSeats: 0,
  order: 0,
};

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-ink-muted">{desc}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function CourseForm({ id }: { id?: string }) {
  const router = useRouter();
  const [c, setC] = useState<Partial<Course>>(EMPTY);
  const [cats, setCats] = useState<Category[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get<Category[]>("/admin/categories", { limit: 200 })
      .then((r) => setCats(r.data))
      .catch(() => get<Category[]>("/public/categories").then((r) => setCats(r.data)).catch(() => {}));
    get<User[]>("/admin/users", { role: "teacher", limit: 300 }).then((r) => setTeachers(r.data)).catch(() => {});
    if (id)
      get<Course>(`/admin/courses/${id}`)
        .then((r) => setC({ ...EMPTY, ...r.data, offerEndsAt: toInputDate(r.data.offerEndsAt) }))
        .catch((e) => toast.error(errMsg(e)))
        .finally(() => setLoading(false));
  }, [id]);

  const set = <K extends keyof Course>(k: K, v: Course[K]) => setC((x) => ({ ...x, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        ...c,
        category: typeof c.category === "object" ? (c.category as Category)._id : c.category,
        instructors: (c.instructors || []).map((i) => (typeof i === "object" ? i._id : i)),
        price: Number(c.price) || 0,
        discountPrice: Number(c.discountPrice) || 0,
        totalClasses: Number(c.totalClasses) || 0,
        maxSeats: Number(c.maxSeats) || 0,
        order: Number(c.order) || 0,
        features: (c.features || []).filter(Boolean),
        requirements: (c.requirements || []).filter(Boolean),
        whoFor: (c.whoFor || []).filter(Boolean),
        tools: (c.tools || []).filter((t) => t.name.trim()),
        projects: (c.projects || []).filter((p) => p.title.trim()),
        curriculum: (c.curriculum || []).filter((m) => m.title.trim()).map((m) => ({ ...m, lessons: m.lessons.filter(Boolean) })),
        faqs: (c.faqs || []).filter((f) => f.q.trim()),
        videos: (c.videos || []).filter((v) => v.url.trim()),
      } as Record<string, unknown>;
      for (const k of ["_id", "slug", "createdAt", "updatedAt", "__v", "views", "finalPrice", "id", "enrollments", "enrolledCount", "seatsTaken"]) delete body[k];
      if (id) {
        await patch(`/admin/courses/${id}`, body);
        toast.success("কোর্স আপডেট হয়েছে");
      } else {
        const r = await post<Course>("/admin/courses", body);
        toast.success("কোর্স তৈরি হয়েছে");
        router.replace(`/admin/courses/${r.data._id}`);
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  const instructorIds = (c.instructors || []).map((i) => (typeof i === "object" ? i._id : i));

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-6">
        <Section title="মূল তথ্য">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="কোর্সের নাম" required className="sm:col-span-2">
              <input className="input" value={c.title} onChange={(e) => set("title", e.target.value)} required />
            </Field>
            <Field label="ক্যাটাগরি" required>
              <select className="input" value={typeof c.category === "object" ? (c.category as Category)?._id : c.category} onChange={(e) => set("category", e.target.value)} required>
                <option value="">নির্বাচন করুন</option>
                {cats.map((x) => (
                  <option key={x._id} value={x._id}>{x.name}</option>
                ))}
              </select>
            </Field>
            <Field label="মাধ্যম">
              <select className="input" value={c.mode} onChange={(e) => set("mode", e.target.value)}>
                <option value="offline">অফলাইন</option>
                <option value="online">অনলাইন</option>
                <option value="hybrid">অনলাইন + অফলাইন</option>
              </select>
            </Field>
            <Field label="সংক্ষিপ্ত বিবরণ (কার্ডে দেখাবে)" className="sm:col-span-2">
              <textarea className="input" rows={2} maxLength={300} value={c.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
            </Field>
            <Field label="বিস্তারিত বিবরণ" className="sm:col-span-2" hint="নতুন লাইনে লিখলে সাইটেও আলাদা লাইনে দেখাবে">
              <textarea className="input" rows={7} value={c.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="মেয়াদ"><input className="input" value={c.duration} onChange={(e) => set("duration", e.target.value)} placeholder="৩ মাস" /></Field>
            <Field label="মোট ক্লাস"><input className="input" type="number" min={0} value={c.totalClasses} onChange={(e) => set("totalClasses", +e.target.value)} /></Field>
            <Field label="সর্বোচ্চ সিট" hint="0 দিলে খোলা ব্যাচগুলোর সিট যোগ করে দেখাবে (ব্যাচে সিট না থাকলে সীমাহীন)"><input className="input" type="number" min={0} value={c.maxSeats ?? 0} onChange={(e) => set("maxSeats", +e.target.value)} /></Field>
            <Field label="ক্লাস শিডিউল"><input className="input" value={c.classSchedule} onChange={(e) => set("classSchedule", e.target.value)} placeholder="সপ্তাহে ৩ দিন, ২ ঘণ্টা" /></Field>
            <Field label="লেভেল"><input className="input" value={c.level} onChange={(e) => set("level", e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="ছবি ও ভিডিও" desc="থাম্বনেইল ১৬:১০ অনুপাতে ক্রপ হবে। YouTube লিংক দিলে কোর্স পেজে ভিডিও হিসেবে দেখাবে।">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="থাম্বনেইল">
              <ImageUpload value={c.thumbnail} onChange={(u) => set("thumbnail", u)} aspect={16 / 10} folder="courses" />
            </Field>
            <Field label="ইন্ট্রো ভিডিও (YouTube লিংক)" hint={c.introVideo && !youtubeId(c.introVideo) ? "⚠️ সঠিক YouTube লিংক নয়" : "যেমন: https://youtu.be/xxxx"}>
              <input className="input" value={c.introVideo} onChange={(e) => set("introVideo", e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              {youtubeId(c.introVideo) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`https://img.youtube.com/vi/${youtubeId(c.introVideo)}/hqdefault.jpg`} alt="" className="mt-2 aspect-video w-full rounded-lg object-cover" />
              )}
            </Field>
          </div>
          <div className="mt-6">
            <p className="label">আরও ছবি (গ্যালারি)</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(c.images || []).map((img, i) => (
                <ImageUpload key={i} value={img} onChange={(u) => set("images", u ? c.images!.map((x, j) => (j === i ? u : x)) : c.images!.filter((_, j) => j !== i))} aspect={4 / 3} folder="courses" allowUrl={false} />
              ))}
              <ImageUpload value="" onChange={(u) => u && set("images", [...(c.images || []), u])} aspect={4 / 3} folder="courses" label="ছবি যোগ" allowUrl={false} />
            </div>
          </div>
          <div className="mt-6">
            <p className="label">আরও ভিডিও</p>
            <div className="space-y-2">
              {(c.videos || []).map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input" placeholder="শিরোনাম" value={v.title} onChange={(e) => set("videos", c.videos!.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <input className="input" placeholder="YouTube লিংক" value={v.url} onChange={(e) => set("videos", c.videos!.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                  <button type="button" className="btn-ghost px-2 text-red-600" onClick={() => set("videos", c.videos!.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" className="btn-outline btn-sm" onClick={() => set("videos", [...(c.videos || []), { title: "", url: "" }])}>+ ভিডিও যোগ</button>
            </div>
          </div>
        </Section>

        <Section title="যেসব টুলস শেখানো হবে">
          <div className="space-y-2">
            {(c.tools || []).map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-300" />
                <input className="input" placeholder="টুলের নাম (যেমন AutoCAD)" value={t.name} onChange={(e) => set("tools", c.tools!.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <input className="input" placeholder="আইকনের লিংক (ঐচ্ছিক, https://)" value={t.icon || ""} onChange={(e) => set("tools", c.tools!.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))} />
                <button type="button" className="btn-ghost px-2 text-red-600" onClick={() => set("tools", c.tools!.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" className="btn-outline btn-sm" onClick={() => set("tools", [...(c.tools || []), { name: "", icon: "" }])}>+ টুল যোগ</button>
          </div>
        </Section>

        <Section title="যেসব প্রজেক্ট করানো হবে">
          <div className="space-y-4">
            {(c.projects || []).map((p, i) => (
              <div key={i} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[160px_1fr_auto]">
                <ImageUpload value={p.image} onChange={(u) => set("projects", c.projects!.map((x, j) => (j === i ? { ...x, image: u } : x)))} aspect={16 / 9} folder="projects" allowUrl={false} label="ছবি (ঐচ্ছিক)" />
                <div className="space-y-2">
                  <input className="input" placeholder="প্রজেক্টের নাম" value={p.title} onChange={(e) => set("projects", c.projects!.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <textarea className="input" rows={2} placeholder="বিবরণ (ঐচ্ছিক)" value={p.description || ""} onChange={(e) => set("projects", c.projects!.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                </div>
                <button type="button" className="btn-ghost self-start px-2 text-red-600" onClick={() => set("projects", c.projects!.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" className="btn-outline btn-sm" onClick={() => set("projects", [...(c.projects || []), { title: "", description: "", image: "" }])}>+ প্রজেক্ট যোগ</button>
          </div>
        </Section>

        <Section title="কারিকুলাম (মডিউল ও লেসন)">
          <div className="space-y-4">
            {(c.curriculum || []).map((m, i) => (
              <div key={i} className="rounded-xl border p-4">
                <div className="mb-3 flex gap-2">
                  <span className="flex h-10 shrink-0 items-center rounded-lg bg-brand-50 px-3 text-sm font-semibold text-brand-700">মডিউল {i + 1}</span>
                  <input className="input" placeholder="মডিউলের নাম" value={m.title} onChange={(e) => set("curriculum", c.curriculum!.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <button type="button" className="btn-ghost px-2 text-red-600" onClick={() => set("curriculum", c.curriculum!.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
                </div>
                <ListInput value={m.lessons} onChange={(lessons) => set("curriculum", c.curriculum!.map((x, j) => (j === i ? { ...x, lessons } : x)))} placeholder="লেসনের নাম" />
              </div>
            ))}
            <button type="button" className="btn-outline btn-sm" onClick={() => set("curriculum", [...(c.curriculum || []), { title: "", lessons: [""] }])}>
              <Plus className="h-4 w-4" /> মডিউল যোগ
            </button>
          </div>
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="এই কোর্সে যা যা পাবেন"><ListInput value={c.features || []} onChange={(v) => set("features", v)} /></Section>
          <Section title="কোর্সটি কাদের জন্য"><ListInput value={c.whoFor || []} onChange={(v) => set("whoFor", v)} /></Section>
          <Section title="যা যা লাগবে"><ListInput value={c.requirements || []} onChange={(v) => set("requirements", v)} /></Section>
          <Section title="সাধারণ জিজ্ঞাসা (FAQ)">
            <div className="space-y-3">
              {(c.faqs || []).map((f, i) => (
                <div key={i} className="space-y-2 rounded-xl border p-3">
                  <div className="flex gap-2">
                    <input className="input" placeholder="প্রশ্ন" value={f.q} onChange={(e) => set("faqs", c.faqs!.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                    <button type="button" className="btn-ghost px-2 text-red-600" onClick={() => set("faqs", c.faqs!.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
                  </div>
                  <textarea className="input" rows={2} placeholder="উত্তর" value={f.a} onChange={(e) => set("faqs", c.faqs!.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
                </div>
              ))}
              <button type="button" className="btn-outline btn-sm" onClick={() => set("faqs", [...(c.faqs || []), { q: "", a: "" }])}>+ প্রশ্ন যোগ</button>
            </div>
          </Section>
        </div>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <Section title="দাম ও অফার">
          <div className="space-y-4">
            <Field label="মূল দাম (৳)" required><input className="input" type="number" min={0} value={c.price} onChange={(e) => set("price", +e.target.value)} required /></Field>
            <Field label="ছাড়ের দাম (৳)" hint="0 দিলে কোনো ছাড় নেই"><input className="input" type="number" min={0} value={c.discountPrice} onChange={(e) => set("discountPrice", +e.target.value)} /></Field>
            <Field label="অফারের লেখা"><input className="input" value={c.offerText} onChange={(e) => set("offerText", e.target.value)} placeholder="ঈদ অফার!" /></Field>
            <Field label="অফার শেষ"><input className="input" type="date" value={(c.offerEndsAt as string) || ""} onChange={(e) => set("offerEndsAt", e.target.value)} /></Field>
            <div className="rounded-xl bg-brand-50 p-3 text-sm">শিক্ষার্থী দেবে: <b className="text-brand-700">{money(finalPrice({ price: Number(c.price) || 0, discountPrice: Number(c.discountPrice) || 0 }))}</b></div>
          </div>
        </Section>
        <Section title="ইন্সট্রাক্টর">
          {teachers.length === 0 ? (
            <p className="text-sm text-ink-muted">আগে &quot;শিক্ষক&quot; মেনু থেকে শিক্ষক যোগ করুন।</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teachers.map((t) => {
                const on = instructorIds.includes(t._id);
                return (
                  <button type="button" key={t._id} onClick={() => set("instructors", on ? instructorIds.filter((x) => x !== t._id) : [...instructorIds, t._id])} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-brand bg-brand text-white" : "border-gray-200"}`}>
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}
        </Section>
        <Section title="প্রকাশ">
          <div className="space-y-3">
            <Switch checked={!!c.isPublished} onChange={(v) => set("isPublished", v)} label="সাইটে প্রকাশিত" />
            <Switch checked={!!c.enrollmentOpen} onChange={(v) => set("enrollmentOpen", v)} label="ভর্তি চালু" />
            <Switch checked={!!c.isFeatured} onChange={(v) => set("isFeatured", v)} label="হোমপেজে ফিচারড" />
            <Field label="ক্রম"><input className="input" type="number" min={0} value={c.order} onChange={(e) => set("order", +e.target.value)} /></Field>
          </div>
        </Section>
        <button className="btn-primary w-full py-3" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />} {id ? "আপডেট করুন" : "কোর্স তৈরি করুন"}
        </button>
      </aside>
    </form>
  );
}
