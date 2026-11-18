"use client";

import CrudPage from "@/components/admin/CrudPage";
import { Badge } from "@/components/ui";
import type { Banner } from "@/lib/types";

export default function Banners() {
  return (
    <CrudPage<Banner & { order: number; isActive: boolean }>
      title="হোমপেজ ব্যানার"
      desc="ব্যানার ছবি ১৬:৯ অনুপাতে ক্রপ হবে (প্রস্তাবিত ১৯২০×১০৮০)"
      endpoint="/admin/banners"
      search={false}
      defaults={{ isActive: true, order: 0, buttonText: "কোর্স দেখুন", buttonLink: "/courses" }}
      fields={[
        { name: "image", label: "ব্যানার ছবি", type: "image", aspect: 16 / 9, folder: "banners", required: true },
        { name: "title", label: "শিরোনাম", type: "text", full: true },
        { name: "subtitle", label: "সাব-টাইটেল", type: "textarea" },
        { name: "buttonText", label: "বাটনের লেখা", type: "text" },
        { name: "buttonLink", label: "বাটনের লিংক", type: "text", placeholder: "/courses" },
        { name: "order", label: "ক্রম", type: "number" },
        { name: "isActive", label: "সক্রিয়", type: "switch" },
      ]}
      columns={[]}
      cards={(b, a) => (
        <div className="card overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.image} alt="" className="aspect-video w-full object-cover" />
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold">{b.title || "(শিরোনাম নেই)"}</p>
              <Badge className={b.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100"}>{b.isActive ? "সক্রিয়" : "বন্ধ"}</Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{b.subtitle}</p>
            <div className="mt-3 flex gap-2">
              <button className="btn-outline btn-sm flex-1" onClick={a.edit}>এডিট</button>
              <button className="btn-sm btn border border-red-200 text-red-600 hover:bg-red-50" onClick={a.remove}>মুছুন</button>
            </div>
          </div>
        </div>
      )}
    />
  );
}
