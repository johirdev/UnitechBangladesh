"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, ExternalLink, Search } from "lucide-react";
import { useApi, useDebounced } from "@/lib/hooks";
import { del, errMsg } from "@/lib/api";
import { PageHeader, PageLoader, Empty, Badge, Confirm } from "@/components/ui";
import type { Course, Category } from "@/lib/types";
import { money, finalPrice } from "@/lib/utils";

export default function CoursesAdmin() {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const { data, loading, reload } = useApi<Course[]>("/admin/courses", { q: dq, limit: 200 });
  const [delC, setDelC] = useState<Course | null>(null);

  return (
    <>
      <PageHeader
        title="কোর্স"
        desc="কোর্সের তথ্য, দাম, ভিডিও, টুলস, প্রজেক্ট ও কারিকুলাম"
        actions={<Link href="/admin/courses/new" className="btn-primary"><Plus className="h-4 w-4" /> নতুন কোর্স</Link>}
      />
      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input className="input pl-9" placeholder="খুঁজুন..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {loading && !data ? (
        <PageLoader />
      ) : !data?.length ? (
        <Empty title="কোনো কোর্স নেই" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>কোর্স</th><th>দাম</th><th>এনরোল</th><th>ভিউ</th><th>অবস্থা</th><th className="text-right">অ্যাকশন</th></tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.thumbnail || "/images/banner/banner2.jpg"} alt="" className="h-12 w-20 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium">{c.title}</p>
                        <p className="text-xs text-ink-muted">{(c.category as Category)?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="font-semibold">{money(finalPrice(c))}</p>
                    {finalPrice(c) !== c.price && <p className="text-xs text-ink-muted line-through">{money(c.price)}</p>}
                  </td>
                  <td>{c.enrollments}</td>
                  <td><span className="inline-flex items-center gap-1 text-sm"><Eye className="h-3.5 w-3.5" /> {c.views || 0}</span></td>
                  <td className="space-x-1">
                    <Badge className={c.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-gray-100"}>{c.isPublished ? "প্রকাশিত" : "অপ্রকাশিত"}</Badge>
                    {!c.enrollmentOpen && <Badge className="bg-red-50 text-red-700">ভর্তি বন্ধ</Badge>}
                    {c.isFeatured && <Badge className="bg-brand-50 text-brand-700">ফিচারড</Badge>}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <a href={`/courses/${c.slug}`} target="_blank" className="btn-ghost btn-sm" aria-label="দেখুন"><ExternalLink className="h-4 w-4" /></a>
                    <Link href={`/admin/courses/${c._id}`} className="btn-ghost btn-sm" aria-label="এডিট"><Pencil className="h-4 w-4" /></Link>
                    <button className="btn-ghost btn-sm text-red-600" onClick={() => setDelC(c)} aria-label="মুছুন"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Confirm
        open={!!delC}
        onClose={() => setDelC(null)}
        message={`"${delC?.title}" কোর্স ও এর সব ব্যাচ মুছে যাবে। এনরোলমেন্ট থাকলে মুছা যাবে না।`}
        onConfirm={async () => {
          try {
            await del(`/admin/courses/${delC!._id}`);
            toast.success("মুছে ফেলা হয়েছে");
            setDelC(null);
            reload();
          } catch (e) {
            toast.error(errMsg(e));
            setDelC(null);
          }
        }}
      />
    </>
  );
}
