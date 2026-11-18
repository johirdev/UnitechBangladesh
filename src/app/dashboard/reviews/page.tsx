"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { post, errMsg } from "@/lib/api";
import { PageLoader, Empty, PageHeader, Badge, Field } from "@/components/ui";
import Stars from "@/components/site/Stars";
import type { Review, Course } from "@/lib/types";

export default function MyReviews() {
  const { data, loading, reload } = useApi<{ reviews: Review[]; eligibleCourses: Course[] }>("/student/reviews");
  const [form, setForm] = useState({ courseId: "", rating: 5, comment: "" });
  if (loading || !data) return <PageLoader />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await post("/student/reviews", form);
      toast.success(r.message);
      setForm({ courseId: "", rating: 5, comment: "" });
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <>
      <PageHeader title="রিভিউ" desc="কোর্স সম্পন্ন করার পর আপনার অভিজ্ঞতা জানান — অনুমোদনের পর সাইটে দেখাবে" />
      {data.eligibleCourses.length === 0 ? (
        <Empty title="রিভিউ দেওয়ার মতো কোর্স নেই" text="কোনো কোর্স সম্পন্ন (Completed) হলে এখানে রিভিউ দিতে পারবেন।" />
      ) : (
        <form onSubmit={submit} className="card mb-6 max-w-2xl space-y-4 p-6">
          <Field label="কোর্স" required>
            <select className="input" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
              <option value="">নির্বাচন করুন</option>
              {data.eligibleCourses.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </Field>
          <Field label="রেটিং">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} তারা`}>
                  <Star className={`h-8 w-8 ${n <= form.rating ? "fill-brand text-brand" : "text-gray-300"}`} />
                </button>
              ))}
            </div>
          </Field>
          <Field label="আপনার মতামত" required>
            <textarea className="input" rows={4} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} required minLength={10} maxLength={800} />
          </Field>
          <button className="btn-primary">রিভিউ জমা দিন</button>
        </form>
      )}
      {data.reviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">আমার রিভিউ</h2>
          {data.reviews.map((r) => (
            <div key={r._id} className="card p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium">{r.course?.title}</p>
                <Badge className={r.isApproved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>{r.isApproved ? "প্রকাশিত" : "অনুমোদনের অপেক্ষায়"}</Badge>
              </div>
              <Stars value={r.rating} className="mt-2" />
              <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
