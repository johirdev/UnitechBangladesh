"use client";

import CrudPage, { loadOptions } from "@/components/admin/CrudPage";
import { Badge } from "@/components/ui";
import { money, fmtDate } from "@/lib/utils";

type Promo = { _id: string; code: string; type: "percent" | "flat"; value: number; maxDiscount: number; courses: { _id: string; title: string }[]; maxUses: number; usedCount: number; validFrom?: string; validTo?: string; isActive: boolean; note?: string };

export default function PromoCodes() {
  return (
    <CrudPage<Promo>
      title="প্রোমো কোড"
      desc="শতাংশ বা নির্দিষ্ট টাকার ছাড় — নির্দিষ্ট কোর্স বা সব কোর্সে"
      endpoint="/admin/promo-codes"
      defaults={{ type: "percent", isActive: true, courses: [] }}
      fields={[
        { name: "code", label: "কোড", type: "text", required: true, placeholder: "EID2026" },
        { name: "type", label: "ধরন", type: "select", required: true, options: [{ value: "percent", label: "শতাংশ (%)" }, { value: "flat", label: "নির্দিষ্ট টাকা (৳)" }] },
        { name: "value", label: "ছাড়ের পরিমাণ", type: "number", required: true },
        { name: "maxDiscount", label: "সর্বোচ্চ ছাড় (৳, % এর জন্য, 0 = সীমা নেই)", type: "number" },
        { name: "maxUses", label: "সর্বোচ্চ ব্যবহার (0 = সীমাহীন)", type: "number" },
        { name: "validFrom", label: "শুরু", type: "date" },
        { name: "validTo", label: "শেষ", type: "date" },
        { name: "courses", label: "কোন কোর্সে প্রযোজ্য (কিছু না বাছলে সব কোর্সে)", type: "multiselect", load: loadOptions("/admin/courses", (c) => String(c.title)) },
        { name: "note", label: "নোট", type: "text", full: true },
        { name: "isActive", label: "সক্রিয়", type: "switch" },
      ]}
      columns={[
        { label: "কোড", render: (p) => <span className="rounded bg-brand-50 px-2 py-1 font-mono font-bold text-brand-700">{p.code}</span> },
        { label: "ছাড়", render: (p) => (p.type === "percent" ? `${p.value}%${p.maxDiscount ? ` (সর্বোচ্চ ${money(p.maxDiscount)})` : ""}` : money(p.value)) },
        { label: "কোর্স", render: (p) => (p.courses?.length ? p.courses.map((c) => c.title).join(", ") : "সব কোর্স"), className: "max-w-[220px] text-xs" },
        { label: "ব্যবহার", render: (p) => `${p.usedCount} / ${p.maxUses || "∞"}` },
        { label: "মেয়াদ", render: (p) => <span className="text-xs">{p.validFrom ? fmtDate(p.validFrom) : "—"} → {p.validTo ? fmtDate(p.validTo) : "—"}</span> },
        { label: "অবস্থা", render: (p) => <Badge className={p.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100"}>{p.isActive ? "সক্রিয়" : "বন্ধ"}</Badge> },
      ]}
    />
  );
}
