"use client";

import CrudPage from "@/components/admin/CrudPage";
import { Badge } from "@/components/ui";
import type { GalleryItem } from "@/lib/types";

export default function GalleryAdmin() {
  return (
    <CrudPage<GalleryItem & { order: number; isActive: boolean }>
      title="গ্যালারি — কোর্স চলাকালীন মুহূর্ত"
      desc="ছবি ৪:৩ অনুপাতে ক্রপ হবে যাতে সব ছবি একই মাপে থাকে"
      endpoint="/admin/gallery"
      defaults={{ isActive: true, order: 0 }}
      fields={[
        { name: "image", label: "ছবি", type: "image", aspect: 4 / 3, folder: "gallery", required: true },
        { name: "title", label: "শিরোনাম", type: "text", required: true },
        { name: "order", label: "ক্রম", type: "number" },
        { name: "description", label: "বিবরণ / কনটেন্ট", type: "textarea" },
        { name: "isActive", label: "সাইটে দেখাবে", type: "switch" },
      ]}
      columns={[]}
      cards={(g, a) => (
        <div className="card overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={g.image} alt="" className="aspect-[4/3] w-full object-cover" />
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold">{g.title}</p>
              {!g.isActive && <Badge className="bg-gray-100">লুকানো</Badge>}
            </div>
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
