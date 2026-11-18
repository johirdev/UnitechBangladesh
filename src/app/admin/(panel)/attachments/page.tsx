"use client";

import CrudPage from "@/components/admin/CrudPage";
import { Badge } from "@/components/ui";
import type { Attachment } from "@/lib/types";

export default function AttachmentsAdmin() {
  return (
    <CrudPage<Attachment & { order: number; isActive: boolean }>
      title="ইন্ডাস্ট্রিয়াল এটাচমেন্ট"
      desc="হোমপেজের ইন্ডাস্ট্রিয়াল এটাচমেন্ট সেকশন — 'জয়েন করুন' বাটনে আপনার দেওয়া লিংক যাবে"
      endpoint="/admin/attachments"
      defaults={{ isActive: true, order: 0 }}
      fields={[
        { name: "image", label: "ছবি", type: "image", aspect: 16 / 10, folder: "attachments" },
        { name: "title", label: "শিরোনাম", type: "text", required: true },
        { name: "department", label: "বিভাগ", type: "text", placeholder: "Computer / Civil / Architecture" },
        { name: "link", label: "লিংক (Google Form / Facebook Group ইত্যাদি)", type: "text", full: true, placeholder: "https://..." },
        { name: "description", label: "বিবরণ", type: "textarea" },
        { name: "order", label: "ক্রম", type: "number" },
        { name: "isActive", label: "সক্রিয়", type: "switch" },
      ]}
      columns={[
        {
          label: "এটাচমেন্ট",
          render: (a) => (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {a.image && <img src={a.image} alt="" className="h-12 w-20 rounded-lg object-cover" />}
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-ink-muted">{a.department}</p>
              </div>
            </div>
          ),
        },
        { label: "লিংক", render: (a) => (a.link ? <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 underline">{a.link.slice(0, 40)}</a> : "—") },
        { label: "অবস্থা", render: (a) => <Badge className={a.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100"}>{a.isActive ? "সক্রিয়" : "বন্ধ"}</Badge> },
      ]}
    />
  );
}
