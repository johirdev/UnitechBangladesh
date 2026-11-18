"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Send, Save } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { get, post, patch, errMsg } from "@/lib/api";
import { useAuth, can } from "@/components/AuthProvider";
import { PageHeader, Field, Switch, Spinner, Badge, Pagination, PageLoader } from "@/components/ui";
import type { Settings, User } from "@/lib/types";
import { fmtDate, cn } from "@/lib/utils";

const TEMPLATES: { key: string; enabled?: string; label: string; desc: string }[] = [
  { key: "enrollTemplate", enabled: "enrollEnabled", label: "এনরোল করার পর", desc: "শিক্ষার্থী অনলাইনে এনরোল করলে স্বয়ংক্রিয়" },
  { key: "approveTemplate", enabled: "approveEnabled", label: "ভর্তি নিশ্চিত হলে", desc: "অ্যাডমিন 'ভর্তি নিশ্চিত' করলে" },
  { key: "paymentTemplate", enabled: "paymentEnabled", label: "পেমেন্ট গ্রহণ", desc: "অ্যাডমিন টাকা জমা নিলে" },
  { key: "dueTemplate", label: "বকেয়া রিমাইন্ডার", desc: "এনরোলমেন্ট/ব্যাচ পেজ থেকে বাছাই করে পাঠান" },
  { key: "batchTemplate", label: "ব্যাচ ক্লাসের সময়", desc: "নির্বাচিত শিক্ষার্থীদের ক্লাস শুরুর তারিখ-সময়" },
  { key: "completeTemplate", label: "কোর্স সম্পন্ন", desc: "অবস্থা 'সম্পন্ন' করলে" },
];

type Log = { _id: string; to: string; message: string; type: string; status: string; response?: string; createdAt: string; sentBy?: User };

export default function SmsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"send" | "templates" | "logs">("send");
  const [phones, setPhones] = useState("");
  const [audience, setAudience] = useState<"manual" | "students" | "teachers">("manual");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [sms, setSms] = useState<Record<string, string | boolean>>({});
  const [page, setPage] = useState(1);
  const logs = useApi<Log[]>(tab === "logs" ? "/admin/sms/logs" : null, { page, limit: 50 });

  useEffect(() => {
    get<Settings>("/admin/settings").then((r) => setSms(r.data.sms || {})).catch(() => {});
  }, []);

  const send = async () => {
    setBusy(true);
    try {
      let list = phones.split(/[\s,;]+/).filter(Boolean);
      if (audience !== "manual") {
        const r = await get<User[]>("/admin/users", { role: audience === "students" ? "student" : "teacher", limit: 500 });
        list = r.data.filter((u) => u.isActive).map((u) => u.phone);
      }
      if (!list.length) throw new Error("কোনো নম্বর নেই");
      const r = await post("/admin/sms/custom", { phones: list, message: msg });
      toast.success(r.message);
      setMsg("");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const saveTemplates = async () => {
    setBusy(true);
    try {
      await patch("/admin/settings", { sms });
      toast.success("টেমপ্লেট সেভ হয়েছে");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const isUnicode = /[^\x00-\x7F]/.test(msg);

  return (
    <>
      <PageHeader title="এসএমএস (BulkSMSBD)" desc="কাস্টম এসএমএস, স্বয়ংক্রিয় মেসেজের টেমপ্লেট ও পাঠানোর রেকর্ড" />
      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1 sm:w-fit">
        {[["send", "এসএমএস পাঠান"], ["templates", "টেমপ্লেট"], ["logs", "লগ"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as never)} className={cn("flex-1 rounded-lg px-4 py-2 text-sm font-medium", tab === k ? "bg-white shadow" : "text-ink-muted")}>{l}</button>
        ))}
      </div>

      {tab === "send" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="card space-y-4 p-6">
            <Field label="কাদের পাঠাবেন">
              <select className="input" value={audience} onChange={(e) => setAudience(e.target.value as never)}>
                <option value="manual">নির্দিষ্ট নম্বরে</option>
                <option value="students">সব সক্রিয় শিক্ষার্থী</option>
                <option value="teachers">সব সক্রিয় শিক্ষক</option>
              </select>
            </Field>
            {audience === "manual" && (
              <Field label="মোবাইল নম্বর" hint="একাধিক নম্বর কমা বা নতুন লাইনে দিন">
                <textarea className="input" rows={3} value={phones} onChange={(e) => setPhones(e.target.value)} placeholder="01XXXXXXXXX, 01XXXXXXXXX" />
              </Field>
            )}
            <Field label="মেসেজ" hint={`${msg.length} অক্ষর • ~${Math.max(1, Math.ceil(msg.length / (isUnicode ? 67 : 153)))}টি এসএমএস/নম্বর`}>
              <textarea className="input" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} />
            </Field>
            <button className="btn-primary" onClick={send} disabled={busy || !msg.trim()}>{busy ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />} পাঠান</button>
          </div>
          <div className="card p-6 text-sm">
            <h3 className="font-semibold">ব্যাচ/বকেয়া এসএমএস কীভাবে পাঠাবেন?</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink-soft">
              <li><Link href="/admin/batches" className="text-brand-700">ব্যাচ</Link> বা <Link href="/admin/enrollments" className="text-brand-700">এনরোলমেন্ট</Link> পেজে যান।</li>
              <li>শিক্ষার্থীদের পাশে টিক দিন (বা সব বাছাই)।</li>
              <li>&quot;ক্লাসের সময় জানান&quot; / &quot;বকেয়া রিমাইন্ডার&quot; বাটনে ক্লিক করুন।</li>
              <li>তারিখ-সময় দিয়ে পাঠান — প্রত্যেকের নাম, বকেয়া স্বয়ংক্রিয় বসবে।</li>
            </ol>
          </div>
        </div>
      )}

      {tab === "templates" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-ink-muted">
            প্লেসহোল্ডার: <code>{"{name}"}</code> <code>{"{course}"}</code> <code>{"{batch}"}</code> <code>{"{payable}"}</code> <code>{"{paid}"}</code> <code>{"{due}"}</code> <code>{"{amount}"}</code> <code>{"{studentId}"}</code> <code>{"{date}"}</code> <code>{"{time}"}</code> <code>{"{site}"}</code> <code>{"{receipt}"}</code> <span className="block mt-1 text-xs">{"{receipt}"} = পেমেন্ট রসিদের লিংক (শুধু পেমেন্ট এসএমএসে; না দিলেও শেষে নিজে যোগ হবে)</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {TEMPLATES.map((t) => (
              <div key={t.key} className="card p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div><p className="font-semibold">{t.label}</p><p className="text-xs text-ink-muted">{t.desc}</p></div>
                  {t.enabled && <Switch checked={!!sms[t.enabled]} onChange={(v) => setSms({ ...sms, [t.enabled!]: v })} label="চালু" />}
                </div>
                <textarea className="input" rows={3} value={String(sms[t.key] || "")} onChange={(e) => setSms({ ...sms, [t.key]: e.target.value })} />
              </div>
            ))}
          </div>
          {can(user, "settings") ? (
            <button className="btn-primary" onClick={saveTemplates} disabled={busy}><Save className="h-4 w-4" /> টেমপ্লেট সেভ করুন</button>
          ) : (
            <p className="text-sm text-ink-muted">টেমপ্লেট বদলাতে &quot;সেটিংস&quot; অনুমতি লাগবে।</p>
          )}
        </div>
      )}

      {tab === "logs" && (logs.loading && !logs.data ? <PageLoader /> : (
        <>
          <div className="card table-wrap">
            <table className="table">
              <thead><tr><th>সময়</th><th>নম্বর</th><th>ধরন</th><th>মেসেজ</th><th>অবস্থা</th><th>পাঠিয়েছেন</th></tr></thead>
              <tbody>
                {(logs.data || []).map((l) => (
                  <tr key={l._id}>
                    <td className="whitespace-nowrap text-xs">{fmtDate(l.createdAt, true)}</td>
                    <td>{l.to}</td>
                    <td className="text-xs">{l.type}</td>
                    <td className="max-w-md text-xs">{l.message}</td>
                    <td>
                      <Badge className={l.status === "sent" ? "bg-emerald-50 text-emerald-700" : l.status === "failed" ? "bg-red-50 text-red-700" : "bg-gray-100"}>{l.status === "sent" ? "পাঠানো" : l.status === "failed" ? "ব্যর্থ" : "বাদ"}</Badge>
                      {l.response && <span className="mt-1 block text-[11px] text-red-600">{l.response}</span>}
                    </td>
                    <td className="text-xs">{l.sentBy?.name || "সিস্টেম"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.meta && <Pagination page={logs.meta.page} pages={logs.meta.pages} onChange={setPage} />}
        </>
      ))}
    </>
  );
}
