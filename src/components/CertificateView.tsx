"use client";

import { forwardRef } from "react";
import type { Certificate } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export const CERT_W = 1123;
export const CERT_H = 794;

/** A4 ল্যান্ডস্কেপ সার্টিফিকেট (1123×794 px) */
const CertificateView = forwardRef<HTMLDivElement, { c: Certificate }>(function CertificateView({ c }, ref) {
  return (
    <div ref={ref} style={{ width: CERT_W, height: CERT_H, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} className="relative overflow-hidden bg-white text-ink">
      {/* ব্যাকগ্রাউন্ড ডিজাইন */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 0% 0%, #FEE9CF 0, transparent 35%), radial-gradient(circle at 100% 100%, #FEE9CF 0, transparent 35%)" }} />
      <div className="absolute left-0 top-0 h-full w-6 bg-brand" />
      <div className="absolute left-6 top-0 h-full w-1.5 bg-ink" />
      <div className="absolute inset-[34px] left-[56px] rounded-sm border-2 border-brand/40" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-brand/10" />

      <div className="relative flex h-full flex-col px-[110px] pb-14 pt-14">
        <div className="flex items-start justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.logo || "/images/logo.png"} alt="" className="h-16 w-auto" crossOrigin="anonymous" />
          <div className="text-right text-xs leading-5 text-ink-muted">
            <p>
              Certificate No: <b className="text-ink">{c.certificateNo}</b>
            </p>
            {c.student?.studentId && (
              <p>
                Student ID: <b className="text-ink">{c.student.studentId}</b>
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.5em] text-brand-600">{c.isTopper ? "Certificate of Excellence" : "Certificate of Completion"}</p>
          <h1 className="mt-3 text-[54px] font-bold uppercase leading-none tracking-wide text-ink">Certificate</h1>
          <p className="mt-6 text-base text-ink-muted">This is proudly presented to</p>
          <p className="mx-auto mt-3 inline-block border-b-2 border-brand px-10 pb-2 text-[44px] font-bold italic text-ink" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {c.studentName}
          </p>
          <p className="mx-auto mt-6 max-w-[760px] text-[17px] leading-relaxed text-ink-soft">
            who {c.certificateText || "has successfully completed the course with dedication and excellence."}
          </p>
          <p className="mt-4 text-2xl font-bold text-brand-700">{c.courseTitle}</p>
          <p className="mt-2 text-sm text-ink-muted">
            {c.batchName && <>Batch: <b className="text-ink">{c.batchName}</b> &nbsp;•&nbsp; </>}
            {c.grade && <>Grade: <b className="text-ink">{c.grade}</b> &nbsp;•&nbsp; </>}
            Issued on <b className="text-ink">{fmtDate(c.issueDate)}</b>
          </p>
          {c.isTopper && <p className="mx-auto mt-3 inline-block rounded-full bg-brand px-5 py-1 text-sm font-bold uppercase tracking-widest text-white">Semester Topper</p>}
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div className="w-64 text-center">
            <div className="flex h-16 items-end justify-center">
              {c.teacherSignature && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.teacherSignature} alt="" className="max-h-16 max-w-[200px] object-contain" crossOrigin="anonymous" />
              )}
            </div>
            <div className="mt-1 border-t border-ink pt-2">
              <p className="font-semibold">{c.teacherName || "Course Instructor"}</p>
              <p className="text-xs text-ink-muted">{c.teacherDesignation || "Course Instructor"}</p>
            </div>
          </div>
          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-double border-brand text-center text-brand-700">
            <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
            <span className="text-lg font-black leading-none">UNITECH</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider">Bangladesh</span>
          </div>
          <div className="w-64 text-center">
            <div className="flex h-16 items-end justify-center">
              {c.ceoSignature && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.ceoSignature} alt="" className="max-h-16 max-w-[200px] object-contain" crossOrigin="anonymous" />
              )}
            </div>
            <div className="mt-1 border-t border-ink pt-2">
              <p className="font-semibold">{c.ceoName || "CEO"}</p>
              <p className="text-xs text-ink-muted">{c.ceoTitle || "Chief Executive Officer"}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-ink-muted">Verify this certificate at {typeof window !== "undefined" ? window.location.host : ""}/verify-certificate</p>
      </div>
    </div>
  );
});

export default CertificateView;
