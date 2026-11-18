"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { patch, del, errMsg } from "@/lib/api";
import { PageHeader, PageLoader, Empty, Avatar, Badge, Confirm } from "@/components/ui";
import Stars from "@/components/site/Stars";
import type { Review } from "@/lib/types";
import { fmtDate, cn } from "@/lib/utils";

export default function ReviewsAdmin() {
  const [status, setStatus] = useState("pending");
  const { data, loading, reload } = useApi<Review[]>("/admin/reviews", { status, limit: 100 });
  const [delId, setDelId] = useState<string | null>(null);

  const setApproved = async (id: string, isApproved: boolean) => {
    try {
      const r = await patch(`/admin/reviews/${id}`, { isApproved });
      toast.success(r.message);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader title="রিভিউ" desc="শিক্ষার্থীদের রিভিউ অনুমোদন করলে সাইটে দেখাবে" />
      <div className="mb-4 flex gap-2">
        {[["pending", "অপেক্ষমাণ"], ["approved", "প্রকাশিত"], ["", "সব"]].map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)} className={cn("btn-sm btn border", status === v ? "border-brand bg-brand text-white" : "border-gray-200 bg-white")}>
            {l}
          </button>
        ))}
      </div>
      {loading ? (
        <PageLoader />
      ) : !data?.length ? (
        <Empty title="কোনো রিভিউ নেই" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((r) => (
            <div key={r._id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={r.student?.avatar} name={r.student?.name} size={40} />
                  <div>
                    <p className="font-semibold">{r.student?.name}</p>
                    <p className="text-xs text-ink-muted">{r.course?.title} • {fmtDate(r.createdAt)}</p>
                  </div>
                </div>
                <Badge className={r.isApproved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>{r.isApproved ? "প্রকাশিত" : "অপেক্ষমাণ"}</Badge>
              </div>
              <Stars value={r.rating} className="mt-3" />
              <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>
              <div className="mt-4 flex gap-2">
                {r.isApproved ? (
                  <button className="btn-outline btn-sm" onClick={() => setApproved(r._id, false)}><EyeOff className="h-4 w-4" /> লুকান</button>
                ) : (
                  <button className="btn-primary btn-sm" onClick={() => setApproved(r._id, true)}><Check className="h-4 w-4" /> অনুমোদন</button>
                )}
                <button className="btn-sm btn border border-red-200 text-red-600" onClick={() => setDelId(r._id)}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Confirm
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={async () => {
          try {
            await del(`/admin/reviews/${delId}`);
            toast.success("মুছে ফেলা হয়েছে");
            setDelId(null);
            reload();
          } catch (e) {
            toast.error(errMsg(e));
          }
        }}
      />
    </>
  );
}
