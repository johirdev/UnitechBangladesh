"use client";

import CrudPage, { loadOptions } from "@/components/admin/CrudPage";
import { Avatar, Badge } from "@/components/ui";
import type { Topper } from "@/lib/types";

export default function ToppersAdmin() {
  return (
    <CrudPage<Topper & { order: number }>
      title="সেমিস্টার টপার"
      desc="কোর্স করা শিক্ষার্থী নির্বাচন করে সক্রিয় করলে হোমপেজে নাম, ছবি, ব্যাচ ও প্রজেক্ট দেখাবে"
      endpoint="/admin/toppers"
      search={false}
      defaults={{ isActive: true, order: 0, title: "Semester Topper" }}
      toForm={(t) => ({ ...t, student: t.student?._id, course: t.course?._id || "", batch: t.batch?._id || "" })}
      fields={[
        { name: "student", label: "শিক্ষার্থী", type: "select", required: true, load: loadOptions("/admin/users", (u) => `${u.name} (${u.phone}${u.studentId ? ` • ${u.studentId}` : ""})`, { role: "student" }) },
        { name: "title", label: "সম্মাননা", type: "text", placeholder: "Semester Topper / ১ম স্থান" },
        { name: "course", label: "কোর্স", type: "select", load: loadOptions("/admin/courses", (c) => String(c.title)) },
        { name: "batch", label: "ব্যাচ", type: "select", load: loadOptions("/admin/batches", (b) => `${(b.course as { title?: string })?.title || ""} — ${b.name}`) },
        { name: "project", label: "প্রজেক্টের নাম", type: "text", full: true },
        { name: "image", label: "ছবি / সার্টিফিকেট প্রদানের ছবি (না দিলে প্রোফাইল ছবি)", type: "image", aspect: 4 / 5, folder: "toppers" },
        { name: "quote", label: "শিক্ষার্থীর উক্তি (ঐচ্ছিক)", type: "textarea" },
        { name: "order", label: "ক্রম", type: "number" },
        { name: "isActive", label: "হোমপেজে দেখাবে (Active)", type: "switch" },
      ]}
      columns={[
        {
          label: "শিক্ষার্থী",
          render: (t) => (
            <div className="flex items-center gap-3">
              <Avatar src={t.image || t.student?.avatar} name={t.student?.name} size={40} />
              <div>
                <p className="font-medium">{t.student?.name}</p>
                <p className="text-xs text-ink-muted">{t.title}</p>
              </div>
            </div>
          ),
        },
        { label: "কোর্স / ব্যাচ", render: (t) => <span className="text-sm">{t.course?.title} {t.batch?.name && <span className="text-ink-muted">• {t.batch.name}</span>}</span> },
        { label: "প্রজেক্ট", render: (t) => t.project || "—" },
        { label: "অবস্থা", render: (t) => <Badge className={t.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100"}>{t.isActive ? "সক্রিয়" : "বন্ধ"}</Badge> },
      ]}
    />
  );
}
