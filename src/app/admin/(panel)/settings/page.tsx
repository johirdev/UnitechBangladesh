"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { get, patch, errMsg } from "@/lib/api";
import type { Settings } from "@/lib/types";
import ImageUpload from "@/components/ImageUpload";
import { PageHeader, PageLoader, Field, Spinner } from "@/components/ui";

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="font-semibold">{title}</h2>
      {desc && <p className="text-sm text-ink-muted">{desc}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get<Settings>("/admin/settings").then((r) => setS(r.data)).catch((e) => toast.error(errMsg(e)));
  }, []);
  if (!s) return <PageLoader />;

  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setS({ ...s, [k]: e.target.value });
  const setStat = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, stats: { ...s.stats!, [k]: e.target.value } });

  const save = async () => {
    setBusy(true);
    try {
      const body: Record<string, unknown> = {};
      for (const k of ["siteName", "tagline", "logo", "phone", "phone2", "email", "address", "mapEmbedUrl", "facebook", "youtube", "whatsapp", "linkedin", "aboutText", "paymentInstructions", "bkashNumber", "nagadNumber", "ceoName", "ceoTitle", "ceoSignature", "certificateText", "stats"] as const) body[k] = s[k] ?? "";
      await patch("/admin/settings", body);
      toast.success("সেটিংস সেভ হয়েছে — ওয়েবসাইটে ১ মিনিটের মধ্যে দেখাবে");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="সেটিংস" desc="ওয়েবসাইটের তথ্য, যোগাযোগ, পেমেন্ট নির্দেশনা ও সার্টিফিকেট" actions={<button className="btn-primary" onClick={save} disabled={busy}>{busy ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />} সেভ করুন</button>} />
      <div className="space-y-6">
        <Card title="সাধারণ">
          <Field label="প্রতিষ্ঠানের নাম"><input className="input" value={s.siteName} onChange={set("siteName")} /></Field>
          <Field label="ট্যাগলাইন"><input className="input" value={s.tagline} onChange={set("tagline")} /></Field>
          <Field label="লোগো" className="sm:col-span-2"><div className="max-w-xs"><ImageUpload value={s.logo} onChange={(u) => setS({ ...s, logo: u })} aspect={3} folder="general" /></div></Field>
          <Field label="আমাদের সম্পর্কে (ফুটারে)" className="sm:col-span-2"><textarea className="input" rows={3} value={s.aboutText || ""} onChange={set("aboutText")} /></Field>
        </Card>
        <Card title="হোমপেজ পরিসংখ্যান">
          <Field label="শিক্ষার্থী"><input className="input" value={s.stats?.students || ""} onChange={setStat("students")} /></Field>
          <Field label="কোর্স"><input className="input" value={s.stats?.courses || ""} onChange={setStat("courses")} /></Field>
          <Field label="সফল ব্যাচ"><input className="input" value={s.stats?.batches || ""} onChange={setStat("batches")} /></Field>
          <Field label="জব প্লেসমেন্ট"><input className="input" value={s.stats?.jobPlacement || ""} onChange={setStat("jobPlacement")} /></Field>
        </Card>
        <Card title="যোগাযোগ ও সোশ্যাল">
          <Field label="ফোন ১"><input className="input" value={s.phone} onChange={set("phone")} /></Field>
          <Field label="ফোন ২"><input className="input" value={s.phone2 || ""} onChange={set("phone2")} /></Field>
          <Field label="ইমেইল"><input className="input" value={s.email || ""} onChange={set("email")} /></Field>
          <Field label="WhatsApp নম্বর"><input className="input" value={s.whatsapp || ""} onChange={set("whatsapp")} /></Field>
          <Field label="ঠিকানা" className="sm:col-span-2"><input className="input" value={s.address || ""} onChange={set("address")} /></Field>
          <Field label="Facebook লিংক"><input className="input" value={s.facebook || ""} onChange={set("facebook")} placeholder="https://facebook.com/..." /></Field>
          <Field label="YouTube লিংক"><input className="input" value={s.youtube || ""} onChange={set("youtube")} /></Field>
          <Field label="LinkedIn লিংক"><input className="input" value={s.linkedin || ""} onChange={set("linkedin")} /></Field>
          <Field label="Google Map embed লিংক" hint="Google Maps → Share → Embed a map → src এর লিংকটি"><input className="input" value={s.mapEmbedUrl || ""} onChange={set("mapEmbedUrl")} placeholder="https://www.google.com/maps/embed?pb=..." /></Field>
        </Card>
        <Card title="পেমেন্ট নির্দেশনা" desc="ভর্তি ফর্মে শিক্ষার্থীরা দেখবে">
          <Field label="বিকাশ নম্বর"><input className="input" value={s.bkashNumber || ""} onChange={set("bkashNumber")} /></Field>
          <Field label="নগদ নম্বর"><input className="input" value={s.nagadNumber || ""} onChange={set("nagadNumber")} /></Field>
          <Field label="নির্দেশনা" className="sm:col-span-2"><textarea className="input" rows={3} value={s.paymentInstructions || ""} onChange={set("paymentInstructions")} /></Field>
        </Card>
        <Card title="সার্টিফিকেট" desc="CEO এর নাম ও স্বাক্ষর সব নতুন সার্টিফিকেটে বসবে। শিক্ষকের স্বাক্ষর শিক্ষকের প্রোফাইল থেকে নেওয়া হয়।">
          <Field label="CEO এর নাম"><input className="input" value={s.ceoName || ""} onChange={set("ceoName")} /></Field>
          <Field label="CEO পদবি"><input className="input" value={s.ceoTitle || ""} onChange={set("ceoTitle")} /></Field>
          <Field label="CEO স্বাক্ষর (সাদা ব্যাকগ্রাউন্ড PNG)"><div className="max-w-xs"><ImageUpload value={s.ceoSignature} onChange={(u) => setS({ ...s, ceoSignature: u })} aspect={3} folder="signatures" /></div></Field>
          <Field label="সার্টিফিকেটের লেখা (who ...)" hint="ইংরেজিতে লিখুন"><textarea className="input" rows={3} value={s.certificateText || ""} onChange={set("certificateText")} /></Field>
        </Card>
        <p className="text-sm text-ink-muted">এসএমএস টেমপ্লেট বদলাতে <a href="/admin/sms" className="text-brand-700">এসএমএস → টেমপ্লেট</a> এ যান।</p>
      </div>
    </>
  );
}
