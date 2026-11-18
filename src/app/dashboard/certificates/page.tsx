"use client";

import Link from "next/link";
import { Award, Download } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { PageLoader, Empty, PageHeader } from "@/components/ui";
import type { Certificate } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export default function MyCertificates() {
  const { data, loading } = useApi<Certificate[]>("/student/certificates");
  if (loading || !data) return <PageLoader />;
  return (
    <>
      <PageHeader title="আমার সার্টিফিকেট" desc="কোর্স সম্পন্ন হলে অ্যাডমিন সার্টিফিকেট ইস্যু করবেন" />
      {data.length === 0 ? (
        <Empty title="এখনো কোনো সার্টিফিকেট নেই" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((c) => (
            <div key={c._id} className="card flex items-center gap-4 p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Award className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.courseTitle}</p>
                <p className="text-xs text-ink-muted">
                  {c.batchName} • {fmtDate(c.issueDate)} • {c.certificateNo}
                </p>
                {c.isTopper && <span className="badge mt-1 bg-brand text-white">Semester Topper</span>}
              </div>
              <Link href={`/certificate/${c.certificateNo}`} className="btn-primary btn-sm">
                <Download className="h-4 w-4" /> PDF
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
