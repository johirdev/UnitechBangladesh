"use client";

import Link from "next/link";
import { useState } from "react";
import { Wallet, MessageSquare, BellRing, CalendarClock } from "lucide-react";
import type { Enrollment } from "@/lib/types";
import { money, fmtDate, ENROLL_STATUS } from "@/lib/utils";
import { Avatar, Badge } from "@/components/ui";
import PaymentModal from "./PaymentModal";
import SmsComposer from "./SmsComposer";

/** এনরোলমেন্ট টেবিল — চেকবক্স দিয়ে বাছাই করে এসএমএস, প্রতিটিতে পেমেন্ট */
export default function EnrollmentTable({ rows, onChange, showCourse = true, canPay = true, canSms = true }: { rows: Enrollment[]; onChange: () => void; showCourse?: boolean; canPay?: boolean; canSms?: boolean }) {
  const [sel, setSel] = useState<string[]>([]);
  const [pay, setPay] = useState<Enrollment | null>(null);
  const [sms, setSms] = useState<null | "due" | "batch" | "custom">(null);
  const all = rows.length > 0 && sel.length === rows.length;
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      {canSms && sel.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm">
          <span className="font-medium">{sel.length} জন নির্বাচিত:</span>
          <button className="btn-sm btn bg-white" onClick={() => setSms("batch")}><CalendarClock className="h-4 w-4" /> ক্লাসের সময় জানান</button>
          <button className="btn-sm btn bg-white" onClick={() => setSms("due")}><BellRing className="h-4 w-4" /> বকেয়া রিমাইন্ডার</button>
          <button className="btn-sm btn bg-white" onClick={() => setSms("custom")}><MessageSquare className="h-4 w-4" /> কাস্টম এসএমএস</button>
          <button className="btn-sm btn-ghost" onClick={() => setSel([])}>বাতিল</button>
        </div>
      )}
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              {canSms && (
                <th className="w-10">
                  <input type="checkbox" className="accent-brand" checked={all} onChange={() => setSel(all ? [] : rows.map((r) => r._id))} aria-label="সব বাছাই" />
                </th>
              )}
              <th>শিক্ষার্থী</th>
              {showCourse && <th>কোর্স / ব্যাচ</th>}
              <th>ফি</th>
              <th>জমা</th>
              <th>বকেয়া</th>
              <th>অবস্থা</th>
              <th className="text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const due = e.payable - e.paid;
              return (
                <tr key={e._id} className={sel.includes(e._id) ? "bg-brand-50/50" : "hover:bg-gray-50/60"}>
                  {canSms && (
                    <td>
                      <input type="checkbox" className="accent-brand" checked={sel.includes(e._id)} onChange={() => toggle(e._id)} aria-label="বাছাই" />
                    </td>
                  )}
                  <td>
                    <Link href={`/admin/enrollments/${e._id}`} className="flex items-center gap-2.5 hover:text-brand-700">
                      <Avatar src={e.student?.avatar} name={e.fullName} size={34} />
                      <div>
                        <p className="font-medium">{e.fullName}</p>
                        <p className="text-xs text-ink-muted">{e.phone} {e.student?.studentId && `• ${e.student.studentId}`}</p>
                      </div>
                    </Link>
                  </td>
                  {showCourse && (
                    <td className="max-w-[220px]">
                      <p className="truncate text-sm">{e.course?.title}</p>
                      <p className="text-xs text-ink-muted">{e.batch?.name || <span className="text-amber-600">ব্যাচ নেই</span>} • {fmtDate(e.createdAt)}</p>
                    </td>
                  )}
                  <td>
                    {money(e.payable)}
                    {e.discount > 0 && <span className="block text-xs text-emerald-600">ছাড় {money(e.discount)}</span>}
                  </td>
                  <td className="text-emerald-700">{money(e.paid)}</td>
                  <td className={due > 0 ? "font-semibold text-red-600" : "text-ink-muted"}>{money(due)}</td>
                  <td>
                    <Badge className={ENROLL_STATUS[e.status]?.cls}>{ENROLL_STATUS[e.status]?.label}</Badge>
                    {e.paymentTrxId && e.paid === 0 && <span className="mt-1 block text-[11px] text-amber-700">TrxID: {e.paymentTrxId}</span>}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    {canPay && due > 0 && !["cancelled", "rejected"].includes(e.status) && (
                      <button className="btn-outline btn-sm" onClick={() => setPay(e)}>
                        <Wallet className="h-4 w-4" /> জমা
                      </button>
                    )}
                    <Link href={`/admin/enrollments/${e._id}`} className="btn-ghost btn-sm">বিস্তারিত</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PaymentModal e={pay} onClose={() => setPay(null)} onDone={onChange} />
      <SmsComposer open={!!sms} kind={sms || "custom"} enrollmentIds={sel} onClose={() => setSms(null)} />
    </>
  );
}
