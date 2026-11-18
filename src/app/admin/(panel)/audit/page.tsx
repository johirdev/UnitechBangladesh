"use client";

import { useState } from "react";
import { useApi } from "@/lib/hooks";
import { PageHeader, PageLoader, Pagination, Badge } from "@/components/ui";
import { fmtDate, ROLE_LABEL } from "@/lib/utils";

type L = { _id: string; action: string; entity: string; entityId: string; detail: string; ip: string; createdAt: string; actor?: { name: string; role: string } };

const COLORS: Record<string, string> = { create: "bg-emerald-50 text-emerald-700", update: "bg-blue-50 text-blue-700", delete: "bg-red-50 text-red-700", login: "bg-gray-100 text-gray-700" };

export default function Audit() {
  const [page, setPage] = useState(1);
  const { data, meta, loading } = useApi<L[]>("/admin/audit-logs", { page, limit: 50 });
  return (
    <>
      <PageHeader title="অডিট লগ" desc="কোন স্টাফ কখন কী পরিবর্তন করেছেন — নিরাপত্তা ও জবাবদিহিতার জন্য" />
      {loading && !data ? <PageLoader /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>সময়</th><th>কে</th><th>কাজ</th><th>বিষয়</th><th>বিস্তারিত</th><th>IP</th></tr></thead>
            <tbody>
              {(data || []).map((l) => (
                <tr key={l._id}>
                  <td className="whitespace-nowrap text-xs">{fmtDate(l.createdAt, true)}</td>
                  <td className="text-sm">{l.actor?.name}<span className="block text-xs text-ink-muted">{ROLE_LABEL[l.actor?.role || ""]}</span></td>
                  <td><Badge className={COLORS[l.action] || "bg-brand-50 text-brand-700"}>{l.action}</Badge></td>
                  <td className="text-xs">{l.entity}</td>
                  <td className="max-w-xs text-xs">{l.detail}</td>
                  <td className="font-mono text-xs">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />}
    </>
  );
}
