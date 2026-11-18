"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Wallet, Trash2, Save, Phone } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { get, patch, del, errMsg } from "@/lib/api";
import { useAuth, can } from "@/components/AuthProvider";
import { PageLoader, Badge, Field, Switch, Confirm, Avatar, Spinner } from "@/components/ui";
import PaymentModal from "@/components/admin/PaymentModal";
import type { Enrollment, Batch } from "@/lib/types";
import { money, fmtDate, ENROLL_STATUS, PAY_METHODS } from "@/lib/utils";

export default function EnrollmentDetail() {
  const { id } = useParams<{ id: string }>() ?? ({} as { id: string });
  const router = useRouter();
  const { user } = useAuth();
  const { data: e, loading, reload } = useApi<Enrollment>(`/admin/enrollments/${id}`);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [f, setF] = useState({ status: "", batch: "", fee: 0, discount: 0, note: "", notify: true });
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState(false);
  const [delPay, setDelPay] = useState<string | null>(null);
  const [delEnroll, setDelEnroll] = useState(false);

  useEffect(() => {
    if (!e) return;
    setF({ status: e.status, batch: e.batch?._id || "", fee: e.fee, discount: e.discount, note: e.note || "", notify: true });
    get<Batch[]>("/admin/batches", { course: e.course?._id }).then((r) => setBatches(r.data)).catch(() => {});
  }, [e]);

  if (loading || !e) return <PageLoader />;
  const due = e.payable - e.paid;

  const save = async () => {
    setBusy(true);
    try {
      const r = await patch(`/admin/enrollments/${id}`, f);
      toast.success(r.message);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link href="/admin/enrollments" className="btn-ghost mb-4 -ml-3"><ArrowLeft className="h-4 w-4" /> এনরোলমেন্ট তালিকা</Link>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar src={e.student?.avatar} name={e.fullName} size={64} />
                <div>
                  <h1 className="text-xl font-bold">{e.fullName}</h1>
                  <p className="flex items-center gap-1.5 text-sm text-ink-muted"><Phone className="h-3.5 w-3.5" /> <a href={`tel:${e.phone}`}>{e.phone}</a> {e.student?.studentId && `• ${e.student.studentId}`}</p>
                  {e.student?._id && <Link href={`/admin/users/${e.student._id}`} className="text-xs text-brand-700">প্রোফাইল দেখুন →</Link>}
                </div>
              </div>
              <Badge className={ENROLL_STATUS[e.status]?.cls}>{ENROLL_STATUS[e.status]?.label}</Badge>
            </div>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-ink-muted">কোর্স</dt><dd className="font-medium">{e.course?.title}</dd></div>
              <div><dt className="text-ink-muted">ব্যাচ</dt><dd className="font-medium">{e.batch?.name || "—"}</dd></div>
              <div><dt className="text-ink-muted">ইমেইল</dt><dd>{e.email || "—"}</dd></div>
              <div><dt className="text-ink-muted">শিক্ষাগত যোগ্যতা</dt><dd>{e.education || "—"}</dd></div>
              <div><dt className="text-ink-muted">প্রতিষ্ঠান</dt><dd>{e.institute || "—"}</dd></div>
              <div><dt className="text-ink-muted">ঠিকানা</dt><dd>{e.address || "—"}</dd></div>
              <div><dt className="text-ink-muted">ভর্তির তারিখ</dt><dd>{fmtDate(e.createdAt, true)} ({e.source === "admin" ? "অফিস" : "অনলাইন"})</dd></div>
              <div><dt className="text-ink-muted">প্রোমো কোড</dt><dd>{e.promoCode || "—"}</dd></div>
              {(e.paymentMethod || e.paymentTrxId) && (
                <div className="sm:col-span-2 rounded-lg bg-amber-50 p-3 text-amber-800">
                  শিক্ষার্থীর দেওয়া পেমেন্ট তথ্য: {PAY_METHODS[e.paymentMethod || ""] || e.paymentMethod} — TrxID: <b>{e.paymentTrxId || "—"}</b> (যাচাই করে &quot;জমা নিন&quot; দিন)
                </div>
              )}
            </dl>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">পেমেন্ট ইতিহাস</h2>
              {due > 0 && <button className="btn-primary btn-sm" onClick={() => setPay(true)}><Wallet className="h-4 w-4" /> জমা নিন</button>}
            </div>
            {!e.payments?.length ? (
              <p className="text-sm text-ink-muted">এখনো কোনো পেমেন্ট নেই</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>রসিদ</th><th>তারিখ</th><th>মাধ্যম</th><th>গ্রহণকারী</th><th className="text-right">টাকা</th><th /></tr></thead>
                  <tbody>
                    {e.payments.map((p) => (
                      <tr key={p._id}>
                        <td className="font-mono text-xs">{p.receiptToken ? <Link href={`/receipt/${p.receiptToken}`} target="_blank" className="text-brand-700 hover:underline">{p.receiptNo}</Link> : p.receiptNo}</td>
                        <td>{fmtDate(p.paidAt)}</td>
                        <td>{PAY_METHODS[p.method]} {p.trxId && <span className="block text-xs text-ink-muted">{p.trxId}</span>}</td>
                        <td className="text-xs">{p.receivedBy?.name}</td>
                        <td className="text-right font-semibold text-emerald-700">{money(p.amount)}</td>
                        <td className="text-right">{can(user, "finance") && <button className="btn-ghost btn-sm text-red-600" onClick={() => setDelPay(p._id)} aria-label="মুছুন"><Trash2 className="h-4 w-4" /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold">হিসাব</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-muted">মূল ফি</span><span>{money(e.fee)}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">ছাড়</span><span className="text-emerald-700">-{money(e.discount)}</span></div>
              <div className="flex justify-between border-t pt-2 font-semibold"><span>মোট প্রদেয়</span><span>{money(e.payable)}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">জমা</span><span className="text-emerald-700">{money(e.paid)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>বকেয়া</span><span className={due > 0 ? "text-red-600" : "text-emerald-700"}>{money(due)}</span></div>
            </div>
          </div>
          <div className="card space-y-4 p-6">
            <h2 className="font-semibold">আপডেট করুন</h2>
            <Field label="অবস্থা">
              <select className="input" value={f.status} onChange={(x) => setF({ ...f, status: x.target.value })}>
                {Object.entries(ENROLL_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </Field>
            <Field label="ব্যাচ">
              <select className="input" value={f.batch} onChange={(x) => setF({ ...f, batch: x.target.value })}>
                <option value="">ব্যাচ নেই</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="মূল ফি"><input className="input" type="number" min={0} value={f.fee} onChange={(x) => setF({ ...f, fee: +x.target.value })} /></Field>
              <Field label="ছাড়"><input className="input" type="number" min={0} value={f.discount} onChange={(x) => setF({ ...f, discount: +x.target.value })} /></Field>
            </div>
            <Field label="নোট"><input className="input" value={f.note} onChange={(x) => setF({ ...f, note: x.target.value })} /></Field>
            <Switch checked={f.notify} onChange={(v) => setF({ ...f, notify: v })} label="অবস্থা বদলালে এসএমএস পাঠান" />
            <button className="btn-primary w-full" onClick={save} disabled={busy}>{busy ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />} সেভ</button>
            {can(user, "finance") && <button className="btn-ghost w-full text-red-600" onClick={() => setDelEnroll(true)}><Trash2 className="h-4 w-4" /> এনরোলমেন্ট মুছুন</button>}
          </div>
        </aside>
      </div>

      <PaymentModal e={pay ? e : null} onClose={() => setPay(false)} onDone={reload} />
      <Confirm
        open={!!delPay}
        onClose={() => setDelPay(null)}
        message="পেমেন্টটি মুছলে শিক্ষার্থীর জমা থেকেও বাদ যাবে।"
        onConfirm={async () => {
          try {
            await del(`/admin/payments/${delPay}`);
            toast.success("পেমেন্ট মুছে ফেলা হয়েছে");
            setDelPay(null);
            reload();
          } catch (err) {
            toast.error(errMsg(err));
          }
        }}
      />
      <Confirm
        open={delEnroll}
        onClose={() => setDelEnroll(false)}
        onConfirm={async () => {
          try {
            await del(`/admin/enrollments/${id}`);
            toast.success("মুছে ফেলা হয়েছে");
            router.replace("/admin/enrollments");
          } catch (err) {
            toast.error(errMsg(err));
            setDelEnroll(false);
          }
        }}
      />
    </>
  );
}
