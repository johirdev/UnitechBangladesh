"use client";

import CrudPage from "@/components/admin/CrudPage";
import { Badge } from "@/components/ui";
import type { Category } from "@/lib/types";

export default function Categories() {
  return (
    <CrudPage<Category>
      title="কোর্স ক্যাটাগরি"
      desc="হোমপেজের 'ক্যারিয়ার গোল' সেকশনে দেখায় — আইকন ছবি ১:১ অনুপাতে ক্রপ হবে"
      endpoint="/admin/categories"
      defaults={{ isActive: true, order: 0 }}
      fields={[
        { name: "name", label: "নাম", type: "text", required: true },
        { name: "order", label: "ক্রম (ছোট সংখ্যা আগে)", type: "number" },
        { name: "image", label: "আইকন/ছবি", type: "image", aspect: 1, folder: "categories" },
        { name: "description", label: "সংক্ষিপ্ত বিবরণ", type: "textarea" },
        { name: "isActive", label: "সাইটে দেখাবে", type: "switch" },
      ]}
      columns={[
        {
          label: "ক্যাটাগরি",
          render: (c) => (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.image ? <img src={c.image} alt="" className="h-10 w-10 rounded-lg bg-gray-50 object-contain" /> : <div className="h-10 w-10 rounded-lg bg-gray-100" />}
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-ink-muted">/{c.slug}</p>
              </div>
            </div>
          ),
        },
        { label: "ক্রম", render: (c) => c.order },
        { label: "অবস্থা", render: (c) => <Badge className={c.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}>{c.isActive ? "সক্রিয়" : "লুকানো"}</Badge> },
      ]}
    />
  );
}
