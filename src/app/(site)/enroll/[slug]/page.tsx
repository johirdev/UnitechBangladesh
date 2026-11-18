"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, Tag, Wallet } from "lucide-react";
import { get, post, errMsg } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { PageLoader, Spinner, Field } from "@/components/ui";
import type { Course, Batch, Settings } from "@/lib/types";
import { money, finalPrice, fmtDate } from "@/lib/utils";

type Detail = Course & { batches: Batch[] };

function EnrollInner() {
  const { slug } = useParams<{ slug: string }>() ?? ({} as { slug: string });
  const sp = useSearchParams() ?? new URLSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [course, setCourse] = useState<Detail | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [batchId, setBatchId] = useState(sp.get("batch") || "");
  const [promo, setPromo] = useState("");
  const [promoRes, setPromoRes] = useState<{ discount: number; payable: number; code: string } | null>(null);
  const [f, setF] = useState({ fullName: "", email: "", education: "", institute: "", address: "", note: "", paymentMethod: "", paymentTrxId: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=/enroll/${slug}`);
  }, [loading, user, router, slug]);

  useEffect(() => {
    get<Detail>(`/public/courses/${slug}`).then((r) => setCourse(r.data)).catch((e) => toast.error(errMsg(e)));
    get<Settings>("/public/settings").then((r) => setSettings(r.data)).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (user) setF((x) => ({ ...x, fullName: x.fullName || user.name, email: x.email || user.email || "", institute: x.institute || user.institute || "", education: x.education || user.educationLevel || "", address: x.address || user.address || "" }));
  }, [user]);

  useEffect(() => setPromoRes(null), [batchId]);

  if (!course || loading || !user) return <PageLoader />;

  const batch = course.batches.find((b) => b._id === batchId);
  const fee = batch?.fee ? batch.fee : finalPrice(course);
  const payable = promoRes ? promoRes.payable : fee;

  const applyPromo = async () => {
    if (!promo.trim()) return;
    try {
      const r = await post<{ discount: number; payable: number; code: string }>("/public/promo/validate", { code: promo, courseId: course._id, batchId });
      setPromoRes(r.data);
      toast.success(r.message);
    } catch (e) {
      setPromoRes(null);
      toast.error(errMsg(e));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (course.batches.length && !batchId) return toast.error("একটি ব্যাচ নির্বাচন করুন");
    setBusy(true);
    try {
      await post("/student/enroll", { courseId: course._id, batchId, promoCode: promoRes?.code || "", ...f });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <div className="container max-w-xl py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-3xl font-bold">এনরোলমেন্ট সফল!</h1>
        <p className="mt-3 text-ink-muted">
          <b>{course.title}</b> কোর্সে আপনার আবেদন গ্রহণ করা হয়েছে। পেমেন্ট যাচাইয়ের পর ভর্তি নিশ্চিত করে এসএমএসে জানানো হবে।
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/dashboard" className="btn-primary">
            ড্যাশবোর্ডে যান
          </Link>
          <Link href="/courses" className="btn-outline">
            আরও কোর্স
          </Link>
        </div>
      </div>
    );

  return (
    <div className="bg-gray-50">
      <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submit} className="card space-y-6 p-6 sm:p-8">
          <div>
            <h1 className="text-2xl font-bold">ভর্তি ফর্ম</h1>
            <p className="mt-1 text-sm text-ink-muted">প্রয়োজনীয় তথ্য দিন — শুধু * চিহ্নিত ঘর বাধ্যতামূলক</p>
          </div>

          {course.batches.length > 0 && (
            <Field label="ব্যাচ নির্বাচন করুন" required>
              <div className="grid gap-3 sm:grid-cols-2">
                {course.batches.map((b) => (
                  <label key={b._id} className={`cursor-pointer rounded-xl border-2 p-4 transition ${batchId === b._id ? "border-brand bg-brand-50" : "border-gray-200 hover:border-brand-200"}`}>
                    <input type="radio" name="batch" className="sr-only" checked={batchId === b._id} onChange={() => setBatchId(b._id)} />
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-xs text-ink-muted">শুরু: {fmtDate(b.startDate)}</p>
                    {b.schedule && <p className="text-xs text-ink-muted">{b.schedule}</p>}
                  </label>
                ))}
              </div>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="পূর্ণ নাম" required>
              <input className="input" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} required />
            </Field>
            <Field label="মোবাইল নম্বর" hint="যাচাইকৃত নম্বর">
              <input className="input" value={user.phone} disabled />
            </Field>
            <Field label="ইমেইল (ঐচ্ছিক)">
              <input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </Field>
            <Field label="শিক্ষাগত যোগ্যতা (ঐচ্ছিক)">
              <select className="input" value={f.education} onChange={(e) => setF({ ...f, education: e.target.value })}>
                <option value="">নির্বাচন করুন</option>
                {["SSC", "HSC", "Diploma (চলমান)", "Diploma", "BSc / অনার্স (চলমান)", "BSc / অনার্স", "মাস্টার্স", "অন্যান্য"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="শিক্ষা প্রতিষ্ঠান (ঐচ্ছিক)" className="sm:col-span-2">
              <input className="input" value={f.institute} onChange={(e) => setF({ ...f, institute: e.target.value })} placeholder="যেমন: ঢাকা পলিটেকনিক ইনস্টিটিউট" />
            </Field>
            <Field label="ঠিকানা (ঐচ্ছিক)" className="sm:col-span-2">
              <input className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
            </Field>
          </div>

          <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <Wallet className="h-5 w-5 text-brand" /> পেমেন্ট (ঐচ্ছিক — পরে অফিসেও দিতে পারবেন)
            </h3>
            {settings?.paymentInstructions && <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{settings.paymentInstructions}</p>}
            {(settings?.bkashNumber || settings?.nagadNumber) && (
              <p className="mt-2 text-sm">
                {settings.bkashNumber && <>বিকাশ: <b>{settings.bkashNumber}</b> </>}
                {settings.nagadNumber && <> • নগদ: <b>{settings.nagadNumber}</b></>}
              </p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="পেমেন্ট মাধ্যম">
                <select className="input" value={f.paymentMethod} onChange={(e) => setF({ ...f, paymentMethod: e.target.value })}>
                  <option value="">পরে অফিসে দেবো</option>
                  <option value="bkash">বিকাশ</option>
                  <option value="nagad">নগদ</option>
                  <option value="rocket">রকেট</option>
                  <option value="bank">ব্যাংক</option>
                </select>
              </Field>
              {f.paymentMethod && (
                <Field label="ট্রানজেকশন আইডি">
                  <input className="input" value={f.paymentTrxId} onChange={(e) => setF({ ...f, paymentTrxId: e.target.value })} placeholder="TrxID" />
                </Field>
              )}
            </div>
          </div>

          <Field label="কিছু জানাতে চাইলে (ঐচ্ছিক)">
            <textarea className="input" rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          </Field>

          <button className="btn-primary w-full py-3 text-base" disabled={busy}>
            {busy && <Spinner className="h-4 w-4 text-white" />} ভর্তি নিশ্চিত করুন — {money(payable)}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-ink-muted">
            <ShieldCheck className="h-4 w-4" /> আপনার তথ্য সম্পূর্ণ নিরাপদ
          </p>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={course.thumbnail || "/images/banner/banner2.jpg"} alt="" className="aspect-video w-full object-cover" />
            <div className="p-5">
              <h2 className="font-semibold">{course.title}</h2>
              {batch && <p className="mt-1 text-sm text-ink-muted">{batch.name}</p>}
              <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">কোর্স ফি</span>
                  <span>{money(fee)}</span>
                </div>
                {promoRes && (
                  <div className="flex justify-between text-emerald-700">
                    <span>প্রোমো ({promoRes.code})</span>
                    <span>-{money(promoRes.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>মোট</span>
                  <span className="text-brand-700">{money(payable)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <label className="label flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-brand" /> প্রোমো কোড
            </label>
            <div className="flex gap-2">
              <input className="input uppercase" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="CODE" />
              <button type="button" className="btn-dark" onClick={applyPromo}>
                প্রয়োগ
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function EnrollPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <EnrollInner />
    </Suspense>
  );
}
