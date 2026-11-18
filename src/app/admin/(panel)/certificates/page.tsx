"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Award, ExternalLink, Ban, Trash2, Search, RotateCcw } from "lucide-react";
import { useApi, useDebounced } from "@/lib/hooks";
import { get, post, patch, del, errMsg } from "@/lib/api";
import { PageHeader, PageLoader, Empty, Badge, Modal, Field, Spinner, Confirm, Pagination } from "@/components/ui";
import type { Certificate, Course, Batch, Enrollment } from "@/lib/types";
import { fmtDate, ENROLL_STATUS } from "@/lib/utils";

export default function CertificatesAdmin() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, meta, loading, reload } = useApi<Certificate[]>("/admin/certificates", { q: dq, page, limit: 50 });
  const [open, setOpen] = useState(false);
  const [delC, setDelC] = useState<Certificate | null>(null);

  // ইস্যু করার ফর্ম
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [list, setList] = useState<Enrollment[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [toppers, setToppers] = useState<string[]>([]);
  const [grade, setGrade] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && !courses.length) get<Course[]>("/admin/courses", { limit: 300 }).then((r) => setCourses(r.data)).catch(() => {});
  }, [open, courses.length]);
  useEffect(() => {
    setBatches([]);
    setBatch("");
    if (course) get<Batch[]>("/admin/batches", { course }).then((r) => setBatches(r.data)).catch(() => {});
  }, [course]);
  useEffect(() => {
    setList([]);
    setSel([]);
    if (batch) get<Enrollment[]>("/admin/enrollments", { batch, limit: 300 }).then((r) => setList(r.data.filter((e) => ["approved", "completed"].includes(e.status)))).catch(() => {});
  }, [batch]);

  const issue = async () => {
    setBusy(true);
    try {
      const r = await post<{ issued: number; skipped: string[] }>("/admin/certificates/issue", { enrollmentIds: sel, grade, issueDate, topperIds: toppers });
      toast.success(r.message);
      if (r.data.skipped.length) toast.info(r.data.skipped.join(", "));
      setOpen(false);
      setSel([]);
      setToppers([]);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleRevoke = async (c: Certificate) => {
    try {
      await patch(`/admin/certificates/${c._id}`, { isRevoked: !c.isRevoked });
      toast.success(c.isRevoked ? "আবার বৈধ করা হয়েছে" : "সার্টিফিকেট বাতিল করা হয়েছে");
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader
        title="সার্টিফিকেট"
        desc="কোর্স শেষে ব্যাচের শিক্ষার্থীদের সার্টিফিকেট দিন — শিক্ষকের স্বাক্ষর (ব্যাচের প্রথম শিক্ষক) ও CEO স্বাক্ষর (সেটিংস) স্বয়ংক্রিয় বসবে"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Award className="h-4 w-4" /> সার্টিফিকেট ইস্যু</button>}
      />
      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input className="input pl-9" placeholder="নম্বর / নাম" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} />
      </div>
      {loading && !data ? <PageLoader /> : !data?.length ? <Empty title="এখনো কোনো সার্টিফিকেট নেই" /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>নম্বর</th><th>শিক্ষার্থী</th><th>কোর্স / ব্যাচ</th><th>তারিখ</th><th>অবস্থা</th><th className="text-right">অ্যাকশন</th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c._id}>
                  <td className="font-mono text-xs">{c.certificateNo}</td>
                  <td>{c.studentName}<span className="block text-xs text-ink-muted">{c.student?.studentId}</span></td>
                  <td className="text-sm">{c.courseTitle}<span className="block text-xs text-ink-muted">{c.batchName}</span></td>
                  <td className="text-xs">{fmtDate(c.issueDate)}</td>
                  <td className="space-x-1">
                    {c.isRevoked ? <Badge className="bg-red-50 text-red-700">বাতিল</Badge> : <Badge className="bg-emerald-50 text-emerald-700">বৈধ</Badge>}
                    {c.isTopper && <Badge className="bg-brand-50 text-brand-700">টপার</Badge>}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <Link href={`/certificate/${c.certificateNo}`} target="_blank" className="btn-ghost btn-sm" title="দেখুন"><ExternalLink className="h-4 w-4" /></Link>
                    <button className="btn-ghost btn-sm" onClick={() => toggleRevoke(c)} title={c.isRevoked ? "বৈধ করুন" : "বাতিল করুন"}>{c.isRevoked ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}</button>
                    <button className="btn-ghost btn-sm text-red-600" onClick={() => setDelC(c)} title="মুছুন"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="সার্টিফিকেট ইস্যু"
        size="lg"
        footer={<><button className="btn-outline" onClick={() => setOpen(false)}>বাতিল</button><button className="btn-primary" onClick={issue} disabled={busy || !sel.length}>{busy && <Spinner className="h-4 w-4 text-white" />} {sel.length} জনকে ইস্যু করুন</button></>}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="কোর্স"><select className="input" value={course} onChange={(e) => setCourse(e.target.value)}><option value="">নির্বাচন করুন</option>{courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}</select></Field>
            <Field label="ব্যাচ"><select className="input" value={batch} onChange={(e) => setBatch(e.target.value)} disabled={!course}><option value="">নির্বাচন করুন</option>{batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></Field>
            <Field label="গ্রেড (ঐচ্ছিক)"><input className="input" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="A+" /></Field>
            <Field label="ইস্যুর তারিখ"><input className="input" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></Field>
          </div>
          {batch && (list.length === 0 ? <p className="text-sm text-ink-muted">এই ব্যাচে ভর্তি নিশ্চিত/সম্পন্ন শিক্ষার্থী নেই।</p> : (
            <div className="rounded-xl border">
              <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" className="accent-brand" checked={sel.length === list.length} onChange={() => setSel(sel.length === list.length ? [] : list.map((e) => e._id))} /> সব বাছাই</label>
                <span className="text-xs text-ink-muted">টপার হলে ⭐ চাপুন</span>
              </div>
              <ul className="max-h-72 divide-y overflow-y-auto">
                {list.map((e) => (
                  <li key={e._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="accent-brand" checked={sel.includes(e._id)} onChange={() => setSel(sel.includes(e._id) ? sel.filter((x) => x !== e._id) : [...sel, e._id])} />
                      {e.fullName} <Badge className={ENROLL_STATUS[e.status]?.cls}>{ENROLL_STATUS[e.status]?.label}</Badge>
                    </label>
                    <button type="button" onClick={() => setToppers(toppers.includes(e._id) ? toppers.filter((x) => x !== e._id) : [...toppers, e._id])} className={toppers.includes(e._id) ? "text-brand" : "text-gray-300"} aria-label="টপার">⭐</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-ink-muted">ইস্যু করলে এনরোলমেন্টের অবস্থা স্বয়ংক্রিয়ভাবে &quot;সম্পন্ন&quot; হবে, শিক্ষার্থী রিভিউ দিতে পারবে এবং স্টুডেন্ট আইডি দিয়ে সাইটে সার্টিফিকেট যাচাই করা যাবে।</p>
        </div>
      </Modal>
      <Confirm
        open={!!delC}
        onClose={() => setDelC(null)}
        onConfirm={async () => {
          try {
            await del(`/admin/certificates/${delC!._id}`);
            toast.success("মুছে ফেলা হয়েছে");
            setDelC(null);
            reload();
          } catch (e) {
            toast.error(errMsg(e));
          }
        }}
      />
    </>
  );
}
