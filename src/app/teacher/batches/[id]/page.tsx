"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { PageLoader, PageHeader, Avatar, Badge, Empty } from "@/components/ui";
import type { Batch, Course, User } from "@/lib/types";
import { fmtDate, ENROLL_STATUS } from "@/lib/utils";

type D = { batch: Batch; students: { _id: string; fullName: string; phone: string; status: string; student: User }[] };

export default function TeacherBatch() {
  const { id } = useParams<{ id: string }>() ?? ({} as { id: string });
  const { data, loading } = useApi<D>(`/teacher/batches/${id}`);
  if (loading || !data) return <PageLoader />;
  const b = data.batch;
  return (
    <>
      <Link href="/teacher" className="btn-ghost mb-4 -ml-3">
        <ArrowLeft className="h-4 w-4" /> ফিরে যান
      </Link>
      <PageHeader title={`${(b.course as Course)?.title} — ${b.name}`} desc={`শুরু ${fmtDate(b.startDate)} ${b.schedule ? `• ${b.schedule}` : ""} ${b.room ? `• ${b.room}` : ""}`} />
      {data.students.length === 0 ? (
        <Empty title="এই ব্যাচে এখনো শিক্ষার্থী নেই" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>#</th><th>শিক্ষার্থী</th><th>আইডি</th><th>মোবাইল</th><th>প্রতিষ্ঠান</th><th>রক্ত</th><th>অবস্থা</th></tr>
            </thead>
            <tbody>
              {data.students.map((s, i) => (
                <tr key={s._id}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar src={s.student?.avatar} name={s.fullName} size={32} /> {s.fullName}
                    </div>
                  </td>
                  <td className="font-mono text-xs">{s.student?.studentId}</td>
                  <td><a href={`tel:${s.phone}`} className="hover:text-brand-700">{s.phone}</a></td>
                  <td className="text-xs">{s.student?.institute}</td>
                  <td>{s.student?.bloodGroup}</td>
                  <td><Badge className={ENROLL_STATUS[s.status]?.cls}>{ENROLL_STATUS[s.status]?.label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
