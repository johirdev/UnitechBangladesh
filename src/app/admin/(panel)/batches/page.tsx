"use client";

import Link from "next/link";
import { useState } from "react";
import CrudPage, { loadOptions } from "@/components/admin/CrudPage";
import { Badge } from "@/components/ui";
import type { Batch, Course, User } from "@/lib/types";
import { money, fmtDate, BATCH_STATUS } from "@/lib/utils";

export default function BatchesAdmin() {
  const [status, setStatus] = useState("");
  return (
    <CrudPage<Batch>
      title="ব্যাচ ও ব্যাচভিত্তিক আয়"
      desc="প্রতিটি ব্যাচে কত শিক্ষার্থী, কত টাকা উঠেছে, বকেয়া, শিক্ষক খরচ ও লাভ — নাম ক্লিক করে বিস্তারিত দেখুন"
      endpoint="/admin/batches"
      query={{ status: status || undefined }}
      modalSize="lg"
      defaults={{ status: "upcoming", isEnrollOpen: true, seatLimit: 0, fee: 0, teachers: [] }}
      toForm={(b) => ({ ...b, course: (b.course as Course)?._id || b.course, teachers: (b.teachers || []).map((t) => (typeof t === "object" ? t._id : t)) })}
      filters={
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">সব স্ট্যাটাস</option>
          {Object.entries(BATCH_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      }
      fields={[
        { name: "course", label: "কোর্স", type: "select", required: true, load: loadOptions("/admin/courses", (c) => String(c.title)) },
        { name: "name", label: "ব্যাচের নাম", type: "text", required: true, placeholder: "Batch 12" },
        { name: "code", label: "কোড", type: "text", placeholder: "B12" },
        { name: "status", label: "স্ট্যাটাস", type: "select", options: Object.entries(BATCH_STATUS).map(([value, v]) => ({ value, label: v.label })) },
        { name: "startDate", label: "শুরুর তারিখ", type: "date" },
        { name: "endDate", label: "শেষের তারিখ", type: "date" },
        { name: "schedule", label: "ক্লাসের দিন ও সময়", type: "text", placeholder: "শনি, সোম, বুধ — সন্ধ্যা ৬:৩০" },
        { name: "room", label: "রুম / লোকেশন", type: "text" },
        { name: "seatLimit", label: "সিট সংখ্যা (0 = সীমাহীন)", type: "number" },
        { name: "fee", label: "ব্যাচের ফি (0 = কোর্সের দাম)", type: "number" },
        { name: "teachers", label: "শিক্ষক", type: "multiselect", load: loadOptions("/admin/users", (u) => String(u.name), { role: "teacher" }) },
        { name: "note", label: "নোট", type: "textarea" },
        { name: "isEnrollOpen", label: "অনলাইনে ভর্তি চালু", type: "switch" },
      ]}
      columns={[
        {
          label: "ব্যাচ",
          render: (b) => (
            <Link href={`/admin/batches/${b._id}`} className="group">
              <p className="font-semibold group-hover:text-brand-700">{b.name} <span className="text-xs text-ink-muted">{b.code}</span></p>
              <p className="text-xs text-ink-muted">{(b.course as Course)?.title}</p>
              <p className="text-xs text-ink-muted">{(b.teachers as User[])?.map((t) => t.name).join(", ")}</p>
            </Link>
          ),
        },
        { label: "শুরু", render: (b) => <span className="text-sm">{fmtDate(b.startDate)}</span> },
        { label: "শিক্ষার্থী", render: (b) => <span>{b.stats?.students || 0}{b.seatLimit ? `/${b.seatLimit}` : ""} {!!b.stats?.pending && <span className="text-xs text-amber-600">(+{b.stats.pending})</span>}</span> },
        { label: "আদায়", render: (b) => <span className="font-semibold text-emerald-700">{money(b.stats?.collected)}</span> },
        { label: "বকেয়া", render: (b) => <span className="text-red-600">{money(b.stats?.due)}</span> },
        { label: "খরচ", render: (b) => money(b.stats?.expense) },
        { label: "লাভ", render: (b) => <span className="font-semibold">{money(b.stats?.profit)}</span> },
        { label: "স্ট্যাটাস", render: (b) => <Badge className={BATCH_STATUS[b.status]?.cls}>{BATCH_STATUS[b.status]?.label}</Badge> },
      ]}
    />
  );
}
