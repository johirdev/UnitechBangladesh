"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Search, Award } from "lucide-react";
import { get, errMsg } from "@/lib/api";
import type { Certificate } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { Spinner, Empty } from "@/components/ui";

export default function VerifyPage() {
  const [q, setQ] = useState("");
  const [list, setList] = useState<Certificate[] | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    try {
      const r = await get<Certificate[]>("/public/certificates/verify", { q: q.trim() });
      setList(r.data);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-brand-50 to-white">
      <div className="container max-w-3xl py-16">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white shadow-lift">
            <BadgeCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-4xl font-bold">সার্টিফিকেট যাচাই</h1>
          <p className="mt-3 text-ink-muted">স্টুডেন্ট আইডি (যেমন UTB260001) অথবা সার্টিফিকেট নম্বর (যেমন UTB-2026-00001) দিন</p>
        </div>
        <form onSubmit={search} className="mx-auto mt-8 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input className="input py-3 pl-9 uppercase" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Student ID / Certificate No" />
          </div>
          <button className="btn-primary px-6" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4 text-white" /> : "যাচাই"}
          </button>
        </form>

        {list && (
          <div className="mt-10">
            {list.length === 0 ? (
              <Empty title="কোনো সার্টিফিকেট পাওয়া যায়নি" text="নম্বরটি ঠিকমতো লিখেছেন কিনা দেখুন, অথবা অফিসে যোগাযোগ করুন।" />
            ) : (
              <div className="space-y-4">
                {list.map((c) => (
                  <div key={c._id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Award className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">✓ বৈধ সার্টিফিকেট</p>
                      <p className="mt-1 text-lg font-semibold">{c.studentName}</p>
                      <p className="text-sm text-ink-muted">
                        {c.courseTitle} {c.batchName && `• ${c.batchName}`} • {fmtDate(c.issueDate)}
                      </p>
                      <p className="text-xs text-ink-muted">নং: {c.certificateNo}</p>
                    </div>
                    <Link href={`/certificate/${c.certificateNo}`} className="btn-outline">
                      দেখুন / PDF
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
