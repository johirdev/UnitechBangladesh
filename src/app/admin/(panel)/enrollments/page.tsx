"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useApi, useDebounced } from "@/lib/hooks";
import { get } from "@/lib/api";
import { PageHeader, PageLoader, Empty, Pagination, StatCard } from "@/components/ui";
import EnrollmentTable from "@/components/admin/EnrollmentTable";
import NewEnrollmentModal from "@/components/admin/NewEnrollmentModal";
import { useAuth, can } from "@/components/AuthProvider";
import type { Enrollment, Course, Batch } from "@/lib/types";
import { money, ENROLL_STATUS } from "@/lib/utils";

function Inner() {
  const sp = useSearchParams() ?? new URLSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState(sp.get("status") || "");
  const [due, setDue] = useState(sp.get("due") === "true");
  const [course, setCourse] = useState(sp.get("course") || "");
  const [batch, setBatch] = useState(sp.get("batch") || "");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const dq = useDebounced(q);
  const { data, meta, loading, reload } = useApi<Enrollment[]>("/admin/enrollments", { status, due: due || undefined, course, batch, q: dq, page, limit: 50 });

  useEffect(() => {
    get<Course[]>("/admin/courses", { limit: 300 }).then((r) => setCourses(r.data)).catch(() => {});
  }, []);
  useEffect(() => {
    setBatches([]);
    if (course) get<Batch[]>("/admin/batches", { course }).then((r) => setBatches(r.data)).catch(() => {});
  }, [course]);
  useEffect(() => setPage(1), [status, due, course, batch, dq]);

  const summary = meta?.summary as { payable: number; paid: number; due: number } | undefined;

  return (
    <>
      <PageHeader
        title="এনরোলমেন্ট"
        desc="অনলাইন ও অফিসের সব ভর্তি — অনুমোদন, ব্যাচ নির্ধারণ, পেমেন্ট ও এসএমএস"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> নতুন ভর্তি</button>}
      />
      {summary && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <StatCard label={`মোট ফি (${meta?.total} জন)`} value={money(summary.payable)} />
          <StatCard label="আদায়" value={money(summary.paid)} tone="green" />
          <StatCard label="বকেয়া" value={money(summary.due)} tone="red" />
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-9" placeholder="নাম / মোবাইল / TrxID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">সব অবস্থা</option>
          {Object.entries(ENROLL_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="input w-auto max-w-[220px]" value={course} onChange={(e) => (setCourse(e.target.value), setBatch(""))}>
          <option value="">সব কোর্স</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
        {course && (
          <select className="input w-auto" value={batch} onChange={(e) => setBatch(e.target.value)}>
            <option value="">সব ব্যাচ</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 rounded-lg border bg-white px-3 text-sm">
          <input type="checkbox" className="accent-brand" checked={due} onChange={(e) => setDue(e.target.checked)} /> শুধু বকেয়া
        </label>
      </div>
      {loading && !data ? <PageLoader /> : !data?.length ? <Empty title="কোনো এনরোলমেন্ট পাওয়া যায়নি" /> : <EnrollmentTable rows={data} onChange={reload} canSms={can(user, "sms")} />}
      {meta && <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />}
      <NewEnrollmentModal open={open} onClose={() => setOpen(false)} onDone={reload} />
    </>
  );
}

export default function EnrollmentsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Inner />
    </Suspense>
  );
}
