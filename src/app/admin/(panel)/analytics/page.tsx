"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, Users, Trash2, Smartphone, Monitor, Tablet } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { post, errMsg } from "@/lib/api";
import { PageHeader, PageLoader, StatCard, Confirm, Pagination, Badge } from "@/components/ui";
import { fmtDate, cn } from "@/lib/utils";

type A = {
  total: number;
  unique: number;
  byPage: { _id: string; views: number; visitors: number }[];
  byCourse: { _id: string; title: string; views: number; visitors: number }[];
  byDevice: { _id: string; n: number }[];
  byBrowser: { _id: string; n: number }[];
  byRef: { _id: string; n: number }[];
  daily: { _id: string; views: number; visitors: number }[];
};
type V = { _id: string; path: string; device: string; browser: string; referrer: string; createdAt: string; user?: { name: string }; course?: { title: string } };

export default function Analytics() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tab, setTab] = useState<"summary" | "visits">("summary");
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<null | { label: string; body: Record<string, unknown> }>(null);
  const { data, loading, reload } = useApi<A>("/admin/analytics", { from, to });
  const visits = useApi<V[]>(tab === "visits" ? "/admin/analytics/visits" : null, { from, to, page, limit: 50 });

  const doDelete = async () => {
    if (!confirm) return;
    try {
      const r = await post("/admin/analytics/delete", confirm.body);
      toast.success(r.message);
      setConfirm(null);
      setSel([]);
      reload();
      visits.reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const maxDay = Math.max(1, ...(data?.daily || []).map((d) => d.views));
  const devIcon = (d: string) => (d === "mobile" ? <Smartphone className="h-4 w-4" /> : d === "tablet" ? <Tablet className="h-4 w-4" /> : <Monitor className="h-4 w-4" />);

  return (
    <>
      <PageHeader
        title="ভিজিটর অ্যানালিটিক্স"
        desc="কতজন সাইট দেখেছে, কোন পেজ/কোর্স কতবার দেখা হয়েছে, কোথা থেকে এসেছে"
        actions={
          <>
            {(from || to) && <button className="btn-outline text-red-600" onClick={() => setConfirm({ label: "নির্বাচিত তারিখের সব ভিজিট", body: { from, to } })}><Trash2 className="h-4 w-4" /> এই সময়ের ডেটা মুছুন</button>}
            <button className="btn-outline text-red-600" onClick={() => setConfirm({ label: "সব ভিজিটর ডেটা", body: { all: true } })}><Trash2 className="h-4 w-4" /> সব মুছুন</button>
          </>
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input className="input w-auto" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="থেকে" />
        <span className="text-ink-muted">→</span>
        <input className="input w-auto" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="পর্যন্ত" />
        {(from || to) && <button className="btn-ghost btn-sm" onClick={() => (setFrom(""), setTo(""))}>রিসেট</button>}
        <div className="ml-auto flex gap-1 rounded-xl bg-gray-100 p-1">
          {[["summary", "সারসংক্ষেপ"], ["visits", "প্রতিটি ভিজিট"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k as never)} className={cn("rounded-lg px-4 py-1.5 text-sm", tab === k ? "bg-white shadow" : "text-ink-muted")}>{l}</button>
          ))}
        </div>
      </div>

      {loading || !data ? <PageLoader /> : tab === "summary" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="মোট পেজ ভিউ" value={data.total.toLocaleString()} icon={<Eye className="h-5 w-5" />} />
            <StatCard label="ইউনিক ভিজিটর" value={data.unique.toLocaleString()} icon={<Users className="h-5 w-5" />} tone="blue" />
            {data.byDevice.slice(0, 2).map((d) => <StatCard key={d._id} label={d._id === "mobile" ? "মোবাইল থেকে" : d._id === "desktop" ? "কম্পিউটার থেকে" : d._id} value={d.n} icon={devIcon(d._id)} tone="gray" />)}
          </div>
          <div className="card p-6">
            <h2 className="mb-5 font-semibold">দৈনিক ভিউ {!from && !to && "(গত ৩০ দিন)"}</h2>
            {!data.daily.length ? <p className="text-sm text-ink-muted">ডেটা নেই</p> : (
              <div className="flex h-44 items-end gap-1">
                {data.daily.map((d) => (
                  <div key={d._id} className="group relative flex h-full flex-1 flex-col justify-end">
                    <div className="rounded-t bg-brand/80 group-hover:bg-brand" style={{ height: `${(d.views / maxDay) * 100}%`, minHeight: 2 }} />
                    <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] text-white group-hover:block">{d._id}: {d.views} ভিউ, {d.visitors} জন</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="card p-6">
              <h2 className="mb-4 font-semibold">কোন কোর্স কতজন দেখেছে</h2>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-ink-muted"><th className="pb-2">কোর্স</th><th className="pb-2 text-right">ভিউ</th><th className="pb-2 text-right">ভিজিটর</th></tr></thead>
                <tbody>{data.byCourse.map((c) => <tr key={c._id} className="border-t"><td className="py-2">{c.title || "—"}</td><td className="py-2 text-right font-semibold">{c.views}</td><td className="py-2 text-right">{c.visitors}</td></tr>)}</tbody>
              </table>
              {!data.byCourse.length && <p className="text-sm text-ink-muted">ডেটা নেই</p>}
            </div>
            <div className="card p-6">
              <h2 className="mb-4 font-semibold">জনপ্রিয় পেজ</h2>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-ink-muted"><th className="pb-2">পেজ</th><th className="pb-2 text-right">ভিউ</th><th className="pb-2 text-right">ভিজিটর</th><th /></tr></thead>
                <tbody>
                  {data.byPage.map((p) => (
                    <tr key={p._id} className="border-t">
                      <td className="max-w-[240px] truncate py-2 font-mono text-xs">{decodeURIComponent(p._id)}</td>
                      <td className="py-2 text-right font-semibold">{p.views}</td>
                      <td className="py-2 text-right">{p.visitors}</td>
                      <td className="py-2 text-right"><button className="text-red-500 hover:text-red-700" title="এই পেজের ডেটা মুছুন" onClick={() => setConfirm({ label: `"${p._id}" পেজের ভিজিট`, body: { path: p._id, from, to } })}><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card p-6">
              <h2 className="mb-4 font-semibold">কোথা থেকে এসেছে (রেফারার)</h2>
              {!data.byRef.length ? <p className="text-sm text-ink-muted">সরাসরি ভিজিট</p> : <ul className="space-y-2 text-sm">{data.byRef.map((r) => <li key={r._id} className="flex justify-between"><span>{r._id}</span><b>{r.n}</b></li>)}</ul>}
            </div>
            <div className="card p-6">
              <h2 className="mb-4 font-semibold">ডিভাইস ও ব্রাউজার</h2>
              <div className="flex flex-wrap gap-2">
                {data.byDevice.map((d) => <Badge key={d._id} className="bg-gray-100 text-sm">{devIcon(d._id)} {d._id}: {d.n}</Badge>)}
                {data.byBrowser.map((d) => <Badge key={d._id} className="bg-brand-50 text-sm text-brand-700">{d._id}: {d.n}</Badge>)}
              </div>
            </div>
          </div>
        </div>
      ) : visits.loading && !visits.data ? <PageLoader /> : (
        <>
          {sel.length > 0 && (
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-red-50 p-3 text-sm">
              {sel.length}টি নির্বাচিত <button className="btn-danger btn-sm" onClick={() => setConfirm({ label: `${sel.length}টি ভিজিট`, body: { ids: sel } })}><Trash2 className="h-4 w-4" /> মুছুন</button>
            </div>
          )}
          <div className="card table-wrap">
            <table className="table">
              <thead><tr><th className="w-10"><input type="checkbox" className="accent-brand" checked={!!visits.data?.length && sel.length === visits.data.length} onChange={() => setSel(sel.length === visits.data?.length ? [] : (visits.data || []).map((v) => v._id))} /></th><th>সময়</th><th>পেজ</th><th>ডিভাইস</th><th>ব্রাউজার</th><th>ইউজার</th><th>রেফারার</th></tr></thead>
              <tbody>
                {(visits.data || []).map((v) => (
                  <tr key={v._id}>
                    <td><input type="checkbox" className="accent-brand" checked={sel.includes(v._id)} onChange={() => setSel(sel.includes(v._id) ? sel.filter((x) => x !== v._id) : [...sel, v._id])} /></td>
                    <td className="whitespace-nowrap text-xs">{fmtDate(v.createdAt, true)}</td>
                    <td className="max-w-[220px] truncate font-mono text-xs">{decodeURIComponent(v.path)}</td>
                    <td>{devIcon(v.device)}</td>
                    <td className="text-xs">{v.browser}</td>
                    <td className="text-xs">{v.user?.name || "অতিথি"}</td>
                    <td className="max-w-[160px] truncate text-xs">{v.referrer || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visits.meta && <Pagination page={visits.meta.page} pages={visits.meta.pages} onChange={setPage} />}
        </>
      )}
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} message={`${confirm?.label} স্থায়ীভাবে মুছে যাবে।`} />
    </>
  );
}
