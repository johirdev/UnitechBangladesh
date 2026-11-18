"use client";

import { useState } from "react";
import CrudPage, { loadOptions } from "@/components/admin/CrudPage";
import { Badge } from "@/components/ui";
import { money, fmtDate, EXPENSE_TYPES, PAY_METHODS } from "@/lib/utils";

type Expense = { _id: string; type: string; title: string; amount: number; teacher?: { _id: string; name: string }; batch?: { _id: string; name: string }; method: string; note?: string; spentAt: string; createdBy?: { name: string } };

export default function Expenses() {
  const [type, setType] = useState("");
  return (
    <CrudPage<Expense>
      title="খরচ ও শিক্ষক পেমেন্ট"
      desc="শিক্ষকের পেমেন্ট ব্যাচের সাথে যুক্ত করলে ব্যাচের লাভ-ক্ষতি স্বয়ংক্রিয় হিসাব হবে"
      endpoint="/admin/expenses"
      query={{ type: type || undefined }}
      defaults={{ type: "teacher_payment", method: "cash", spentAt: new Date().toISOString().slice(0, 10) }}
      toForm={(e) => ({ ...e, teacher: e.teacher?._id || "", batch: e.batch?._id || "" })}
      filters={
        <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">সব ধরন</option>
          {Object.entries(EXPENSE_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      }
      fields={[
        { name: "type", label: "খরচের ধরন", type: "select", required: true, options: Object.entries(EXPENSE_TYPES).map(([value, label]) => ({ value, label })) },
        { name: "amount", label: "টাকা", type: "number", required: true },
        { name: "title", label: "বিবরণ", type: "text", required: true, full: true, placeholder: "যেমন: AutoCAD Batch 12 — শিক্ষক সম্মানী" },
        { name: "teacher", label: "শিক্ষক (শিক্ষক পেমেন্ট হলে)", type: "select", load: loadOptions("/admin/users", (u) => `${u.name} (${u.phone})`, { role: "teacher" }) },
        { name: "batch", label: "ব্যাচ (ঐচ্ছিক)", type: "select", load: loadOptions("/admin/batches", (b) => `${(b.course as { title?: string })?.title || ""} — ${b.name}`) },
        { name: "method", label: "মাধ্যম", type: "select", options: Object.entries(PAY_METHODS).map(([value, label]) => ({ value, label })) },
        { name: "spentAt", label: "তারিখ", type: "date" },
        { name: "note", label: "নোট", type: "textarea" },
      ]}
      columns={[
        { label: "তারিখ", render: (e) => fmtDate(e.spentAt) },
        { label: "ধরন", render: (e) => <Badge className="bg-gray-100 text-gray-700">{EXPENSE_TYPES[e.type]}</Badge> },
        { label: "বিবরণ", render: (e) => <div><p>{e.title}</p>{e.teacher && <p className="text-xs text-ink-muted">শিক্ষক: {e.teacher.name}</p>}{e.batch && <p className="text-xs text-ink-muted">ব্যাচ: {e.batch.name}</p>}</div> },
        { label: "মাধ্যম", render: (e) => PAY_METHODS[e.method] },
        { label: "টাকা", render: (e) => <span className="font-semibold text-red-600">{money(e.amount)}</span>, className: "text-right" },
      ]}
    />
  );
}
