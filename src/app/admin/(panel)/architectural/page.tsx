"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, RotateCcw } from "lucide-react";
import { get, api, errMsg } from "@/lib/api";
import type { Architectural } from "@/lib/types";
import ImageUpload from "@/components/ImageUpload";
import { PageHeader, PageLoader, Field, Spinner, Switch, Confirm } from "@/components/ui";

type A = Architectural;

function Card({ title, desc, children, id }: { title: string; desc?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="card scroll-mt-24 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-ink-muted">{desc}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** তালিকা এডিটর — যোগ / মুছা / উপরে-নিচে সরানো */
function List<T>({ items, onChange, blank, render, addLabel, max = 40 }: { items: T[]; onChange: (v: T[]) => void; blank: T; render: (item: T, set: (patch: Partial<T>) => void, i: number) => React.ReactNode; addLabel: string; max?: number }) {
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const x = [...items];
    [x[i], x[j]] = [x[j], x[i]];
    onChange(x);
  };
  return (
    <div className="space-y-3 sm:col-span-2">
      {items.map((it, i) => (
        <div key={i} className="relative rounded-xl border border-gray-200 bg-gray-50/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">#{i + 1}</span>
            <div className="flex gap-1">
              <button type="button" className="btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="উপরে">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="নিচে">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" className="btn-ghost btn-sm text-red-600" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="মুছুন">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {render(it, (p) => onChange(items.map((x, k) => (k === i ? { ...x, ...p } : x))), i)}
        </div>
      ))}
      {items.length < max && (
        <button type="button" className="btn-outline w-full border-dashed" onClick={() => onChange([...items, { ...blank }])}>
          <Plus className="h-4 w-4" /> {addLabel}
        </button>
      )}
    </div>
  );
}

const NAV = [
  ["hero", "হিরো"],
  ["about", "About"],
  ["services", "সার্ভিস"],
  ["offers", "অফার"],
  ["projects", "প্রজেক্ট"],
  ["intro", "পরিসংখ্যান"],
  ["cert", "সার্টিফিকেশন"],
  ["tabs", "ট্যাব"],
  ["initiatives", "উদ্যোগ"],
  ["address", "ঠিকানা"],
  ["contact", "যোগাযোগ"],
];

export default function ArchitecturalAdmin() {
  const [a, setA] = useState<A | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    get<A>("/admin/architectural").then((r) => setA(r.data)).catch((e) => toast.error(errMsg(e)));
  }, []);
  if (!a) return <PageLoader />;

  const up = <K extends keyof A>(k: K, v: A[K]) => setA({ ...a, [k]: v });
  const sub = <K extends "hero" | "about" | "milestone" | "intro" | "certification" | "latest" | "contact">(k: K) => (f: keyof A[K]) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setA({ ...a, [k]: { ...a[k], [f]: e.target.value } });
  const subImg = <K extends "hero" | "about" | "intro" | "certification" | "latest">(k: K, f: keyof A[K]) => (u: string) => setA({ ...a, [k]: { ...a[k], [f]: u } });
  const hero = sub("hero"), about = sub("about"), ms = sub("milestone"), intro = sub("intro"), cert = sub("certification"), latest = sub("latest"), contact = sub("contact");

  const save = async () => {
    setBusy(true);
    try {
      const body: Record<string, unknown> = { ...a };
      for (const k of ["_id", "key", "__v", "createdAt", "updatedAt"]) delete body[k];
      const r = await api<A>("/admin/architectural", { method: "PUT", body });
      setA(r.data);
      toast.success("সেভ হয়েছে — ওয়েবসাইটে ১ মিনিটের মধ্যে দেখাবে");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      const r = await api<A>("/admin/architectural/reset", { method: "POST", body: {} });
      setA(r.data);
      toast.success("ডিফল্ট কনটেন্টে ফিরিয়ে আনা হয়েছে");
      setResetOpen(false);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const text = (v: string, on: (e: React.ChangeEvent<HTMLInputElement>) => void, ph?: string) => <input className="input" value={v || ""} onChange={on} placeholder={ph} />;
  const area = (v: string, on: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, rows = 3) => <textarea className="input" rows={rows} value={v || ""} onChange={on} />;

  return (
    <>
      <PageHeader
        title="UNITECH Architectural পেজ"
        desc="/unitech-architectural পেজের সব লেখা ও ছবি — পেজটি ইংরেজিতে, তাই কনটেন্ট ইংরেজিতে লিখুন"
        actions={
          <div className="flex flex-wrap gap-2">
            <a href="/unitech-architectural" target="_blank" className="btn-outline">
              <ExternalLink className="h-4 w-4" /> পেজ দেখুন
            </a>
            <button className="btn-ghost" onClick={() => setResetOpen(true)} disabled={busy}>
              <RotateCcw className="h-4 w-4" /> ডিফল্ট
            </button>
            <button className="btn-primary" onClick={save} disabled={busy}>
              {busy ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />} সেভ করুন
            </button>
          </div>
        }
      />

      <div className="no-scrollbar sticky top-0 z-10 -mx-1 mb-6 flex gap-1 overflow-x-auto bg-gray-50/90 px-1 py-2 backdrop-blur">
        {NAV.map(([id, l]) => (
          <a key={id} href={`#${id}`} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-soft ring-1 ring-gray-200 hover:text-brand-700">
            {l}
          </a>
        ))}
      </div>

      <div className="space-y-6">
        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="font-semibold">পেজ চালু</p>
            <p className="text-sm text-ink-muted">বন্ধ করলে পেজ ও হোমপেজের আর্কিটেকচারাল সেকশন লুকানো থাকবে</p>
          </div>
          <Switch checked={a.isActive} onChange={(v) => up("isActive", v)} />
        </div>

        <Card id="hero" title="হিরো (উপরের ব্যানার)" desc="হোমপেজের আর্কিটেকচারাল সেকশনেও এই লেখা দেখাবে">
          <Field label="ব্যাজ">{text(a.hero.badge, hero("badge"))}</Field>
          <Field label="কল বাটনের লেখা">{text(a.hero.ctaText, hero("ctaText"))}</Field>
          <Field label="শিরোনাম" className="sm:col-span-2">{text(a.hero.title, hero("title"))}</Field>
          <Field label="সাবটাইটেল" className="sm:col-span-2">{area(a.hero.subtitle, hero("subtitle"))}</Field>
          <Field label="ডান পাশের ছবি (৪:৫)"><ImageUpload value={a.hero.image} onChange={subImg("hero", "image")} aspect={4 / 5} folder="architectural" /></Field>
          <Field label="ব্যাকগ্রাউন্ড ছবি (হালকা দেখাবে)"><ImageUpload value={a.hero.background} onChange={subImg("hero", "background")} aspect={16 / 9} folder="architectural" /></Field>
        </Card>

        <Card id="about" title="About Us ও Milestone">
          <Field label="About শিরোনাম">{text(a.about.title, about("title"))}</Field>
          <Field label="Milestone শিরোনাম">{text(a.milestone.title, ms("title"))}</Field>
          <Field label="About লেখা">{area(a.about.text, about("text"), 5)}</Field>
          <Field label="Milestone লেখা">{area(a.milestone.text, ms("text"), 5)}</Field>
          <Field label="About ছবি (৪:৩)"><ImageUpload value={a.about.image} onChange={subImg("about", "image")} aspect={4 / 3} folder="architectural" /></Field>
        </Card>

        <Card id="services" title="সার্ভিস (Our Services)">
          <Field label="সেকশন শিরোনাম" className="sm:col-span-2">{text(a.servicesTitle, (e) => up("servicesTitle", e.target.value))}</Field>
          <List
            items={a.services}
            onChange={(v) => up("services", v)}
            blank={{ icon: "", title: "", description: "" }}
            addLabel="সার্ভিস যোগ করুন"
            max={24}
            render={(s, set) => (
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <ImageUpload value={s.icon} onChange={(u) => set({ icon: u })} aspect={1} folder="architectural" maxWidth={200} label="আইকন" />
                <div className="space-y-3">
                  <input className="input" placeholder="Service name" value={s.title} onChange={(e) => set({ title: e.target.value })} />
                  <textarea className="input" rows={2} placeholder="Short description (optional)" value={s.description} onChange={(e) => set({ description: e.target.value })} />
                </div>
              </div>
            )}
          />
        </Card>

        <Card id="offers" title="অফার স্লাইডার" desc="যেমন: Plan your home in safe hands — Only at BDT 5000/- Per floor। একাধিক দিলে নিজে নিজে স্লাইড হবে।">
          <List
            items={a.offers}
            onChange={(v) => up("offers", v)}
            blank={{ image: "", title: "", highlight: "", label: "Only at", price: "", unit: "Per floor" }}
            addLabel="স্লাইড যোগ করুন"
            max={10}
            render={(o, set) => (
              <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                <ImageUpload value={o.image} onChange={(u) => set({ image: u })} aspect={16 / 11} folder="architectural" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="input" placeholder="Plan your home in" value={o.title} onChange={(e) => set({ title: e.target.value })} />
                  <input className="input" placeholder="safe hands (রঙিন অংশ)" value={o.highlight} onChange={(e) => set({ highlight: e.target.value })} />
                  <input className="input" placeholder="Only at" value={o.label} onChange={(e) => set({ label: e.target.value })} />
                  <input className="input" placeholder="BDT 5000/-" value={o.price} onChange={(e) => set({ price: e.target.value })} />
                  <input className="input" placeholder="Per floor" value={o.unit} onChange={(e) => set({ unit: e.target.value })} />
                </div>
              </div>
            )}
          />
        </Card>

        <Card id="projects" title="প্রজেক্ট" desc="সর্বশেষ ডেলিভারি দেওয়া প্রজেক্ট + Our Last Projects স্লাইডশো (ছবিগুলো নিজে নিজে বদলায় ও নিচে চলমান স্ট্রিপে দেখায়)">
          <Field label="সর্বশেষ ডেলিভারির লেবেল">{text(a.latestTitle, (e) => up("latestTitle", e.target.value))}</Field>
          <Field label="প্রজেক্টের নাম">{text(a.latest.title, latest("title"))}</Field>
          <Field label="লোকেশন">{text(a.latest.location, latest("location"))}</Field>
          <Field label="ডেলিভারির সাল/তারিখ">{text(a.latest.year, latest("year"), "2024")}</Field>
          <Field label="বিবরণ" className="sm:col-span-2">{area(a.latest.description, latest("description"))}</Field>
          <Field label="সর্বশেষ প্রজেক্টের ছবি (১৬:১০)"><ImageUpload value={a.latest.image} onChange={subImg("latest", "image")} aspect={16 / 10} folder="architectural" /></Field>
          <div className="hidden sm:block" />
          <Field label="প্রজেক্ট সেকশনের শিরোনাম">{text(a.projectsTitle, (e) => up("projectsTitle", e.target.value))}</Field>
          <Field label="সাবটাইটেল">{text(a.projectsSubtitle, (e) => up("projectsSubtitle", e.target.value))}</Field>
          <List
            items={a.projects}
            onChange={(v) => up("projects", v)}
            blank={{ image: "", title: "", location: "", year: "" }}
            addLabel="প্রজেক্ট যোগ করুন"
            render={(p, set) => (
              <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                <ImageUpload value={p.image} onChange={(u) => set({ image: u })} aspect={4 / 3} folder="architectural" />
                <div className="space-y-3">
                  <input className="input" placeholder="Project name" value={p.title} onChange={(e) => set({ title: e.target.value })} />
                  <input className="input" placeholder="Location (e.g. Mirpur, Dhaka)" value={p.location} onChange={(e) => set({ location: e.target.value })} />
                  <input className="input" placeholder="Year" value={p.year} onChange={(e) => set({ year: e.target.value })} />
                </div>
              </div>
            )}
          />
        </Card>

        <Card id="intro" title="পরিচিতি ও পরিসংখ্যান" desc="প্রথম ৩টি পরিসংখ্যান হিরোতেও দেখাবে। সংখ্যা (যেমন 546+, 91%) স্ক্রল করলে গুনে গুনে বাড়বে।">
          <Field label="ব্যাজ">{text(a.intro.badge, intro("badge"))}</Field>
          <Field label="শিরোনাম">{text(a.intro.title, intro("title"))}</Field>
          <Field label="লেখা" className="sm:col-span-2">{area(a.intro.text, intro("text"), 4)}</Field>
          <Field label="ছবি"><ImageUpload value={a.intro.image} onChange={subImg("intro", "image")} aspect={16 / 10} folder="architectural" /></Field>
          <div className="hidden sm:block" />
          <List
            items={a.stats}
            onChange={(v) => up("stats", v)}
            blank={{ value: "", label: "" }}
            addLabel="পরিসংখ্যান যোগ করুন"
            max={12}
            render={(s, set) => (
              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <input className="input" placeholder="546+" value={s.value} onChange={(e) => set({ value: e.target.value })} />
                <input className="input" placeholder="Successful Students" value={s.label} onChange={(e) => set({ label: e.target.value })} />
              </div>
            )}
          />
        </Card>

        <Card id="cert" title="সার্টিফিকেশন">
          <Field label="শিরোনাম" className="sm:col-span-2">{text(a.certification.title, cert("title"))}</Field>
          <Field label="লেখা" className="sm:col-span-2">{area(a.certification.text, cert("text"), 5)}</Field>
          <Field label="সার্টিফিকেটের ছবি (৩:৪)"><ImageUpload value={a.certification.image} onChange={subImg("certification", "image")} aspect={3 / 4} folder="architectural" /></Field>
        </Card>

        <Card id="tabs" title="ট্যাব (Our Goal / Vision / History ...)">
          <List
            items={a.tabs}
            onChange={(v) => up("tabs", v)}
            blank={{ icon: "", name: "", title: "", text: "" }}
            addLabel="ট্যাব যোগ করুন"
            max={10}
            render={(t, set) => (
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <ImageUpload value={t.icon} onChange={(u) => set({ icon: u })} aspect={1} folder="architectural" maxWidth={200} label="আইকন" />
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className="input" placeholder="Tab name (Our Goal)" value={t.name} onChange={(e) => set({ name: e.target.value })} />
                    <input className="input" placeholder="Heading" value={t.title} onChange={(e) => set({ title: e.target.value })} />
                  </div>
                  <textarea className="input" rows={3} placeholder="Text" value={t.text} onChange={(e) => set({ text: e.target.value })} />
                </div>
              </div>
            )}
          />
        </Card>

        <Card id="initiatives" title="উদ্যোগ (Prominent Initiatives)">
          <Field label="শিরোনাম" className="sm:col-span-2">{text(a.initiativesTitle, (e) => up("initiativesTitle", e.target.value))}</Field>
          <List
            items={a.initiatives}
            onChange={(v) => up("initiatives", v)}
            blank={{ value: "", label: "" }}
            addLabel="যোগ করুন"
            max={16}
            render={(s, set) => (
              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <input className="input" placeholder="6000+" value={s.value} onChange={(e) => set({ value: e.target.value })} />
                <input className="input" placeholder="Students received career counseling" value={s.label} onChange={(e) => set({ label: e.target.value })} />
              </div>
            )}
          />
        </Card>

        <Card id="address" title="ঠিকানা (Our Address)" desc="ম্যাপ লিংক না দিলে ঠিকানা দিয়ে Google Maps খুলবে">
          <Field label="শিরোনাম" className="sm:col-span-2">{text(a.addressTitle, (e) => up("addressTitle", e.target.value))}</Field>
          <List
            items={a.addresses}
            onChange={(v) => up("addresses", v)}
            blank={{ label: "", address: "", phone: "", mapUrl: "" }}
            addLabel="ঠিকানা যোগ করুন"
            max={10}
            render={(ad, set) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input" placeholder="Head Office" value={ad.label} onChange={(e) => set({ label: e.target.value })} />
                <input className="input" placeholder="Phone" value={ad.phone} onChange={(e) => set({ phone: e.target.value })} />
                <textarea className="input sm:col-span-2" rows={2} placeholder="Full address" value={ad.address} onChange={(e) => set({ address: e.target.value })} />
                <input className="input sm:col-span-2" placeholder="Google Maps link (https://maps.app.goo.gl/...)" value={ad.mapUrl} onChange={(e) => set({ mapUrl: e.target.value })} />
              </div>
            )}
          />
        </Card>

        <Card id="contact" title="যোগাযোগ" desc="কল বাটন, অফার স্লাইডার ও নিচের CTA তে ব্যবহার হবে">
          <Field label="ফোন ১">{text(a.contact.phone, contact("phone"))}</Field>
          <Field label="ফোন ২">{text(a.contact.phone2, contact("phone2"))}</Field>
          <Field label="ইমেইল">{text(a.contact.email, contact("email"))}</Field>
          <Field label="WhatsApp নম্বর">{text(a.contact.whatsapp, contact("whatsapp"), "01XXXXXXXXX")}</Field>
        </Card>

        <div className="flex justify-end">
          <button className="btn-primary px-8" onClick={save} disabled={busy}>
            {busy ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />} সেভ করুন
          </button>
        </div>
      </div>

      <Confirm
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={reset}
        loading={busy}
        title="ডিফল্ট কনটেন্টে ফিরবেন?"
        message="এই পেজের সব পরিবর্তন মুছে গিয়ে শুরুর কনটেন্ট ও ছবি ফিরে আসবে।"
        confirmText="হ্যাঁ, ডিফল্ট করুন"
      />
    </>
  );
}
