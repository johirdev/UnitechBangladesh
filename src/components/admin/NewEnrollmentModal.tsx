"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { get, post, errMsg } from "@/lib/api";
import type { Course, Batch } from "@/lib/types";
import { money, finalPrice, PAY_METHODS } from "@/lib/utils";
import { Modal, Field, Switch, Spinner } from "@/components/ui";

/** অফিসে এসে ভর্তি — নম্বর না থাকলে নতুন অ্যাকাউন্ট খুলে এসএমএসে পাসওয়ার্ড পাঠায় */
export default function NewEnrollmentModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const init = { phone: "", fullName: "", email: "", courseId: "", batchId: "", education: "", institute: "", address: "", discount: "", promoCode: "", initialPayment: "", method: "cash", trxId: "", note: "", status: "approved", notify: true };
  const [f, setF] = useState(init);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && !courses.length) get<Course[]>("/admin/courses", { limit: 300 }).then((r) => setCourses(r.data)).catch(() => {});
  }, [open, courses.length]);
  useEffect(() => {
    setBatches([]);
    if (f.courseId) get<Batch[]>("/admin/batches", { course: f.courseId }).then((r) => setBatches(r.data.filter((b) => b.status !== "cancelled"))).catch(() => {});
  }, [f.courseId]);

  const course = courses.find((c) => c._id === f.courseId);
  const batch = batches.find((b) => b._id === f.batchId);
  const fee = batch?.fee ? batch.fee : course ? finalPrice(course) : 0;
  const set = (k: keyof typeof init) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await post("/admin/enrollments", {
        ...f,
        discount: Number(f.discount) || 0,
        initialPayment: Number(f.initialPayment) || 0,
        promoCode: f.promoCode || undefined,
      });
      toast.success(r.message);
      setF(init);
      onDone();
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="নতুন ভর্তি (অফিস থেকে)"
      size="lg"
      footer={
        <>
          <button className="btn-outline" onClick={onClose}>বাতিল</button>
          <button className="btn-primary" form="enroll-form" disabled={busy}>
            {busy && <Spinner className="h-4 w-4 text-white" />} ভর্তি করুন
          </button>
        </>
      }
    >
      <form id="enroll-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="মোবাইল নম্বর" required hint="অ্যাকাউন্ট না থাকলে নতুন খোলা হবে">
          <input className="input" value={f.phone} onChange={set("phone")} required placeholder="01XXXXXXXXX" />
        </Field>
        <Field label="পূর্ণ নাম" required><input className="input" value={f.fullName} onChange={set("fullName")} required /></Field>
        <Field label="কোর্স" required>
          <select className="input" value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value, batchId: "" })} required>
            <option value="">নির্বাচন করুন</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </Field>
        <Field label="ব্যাচ">
          <select className="input" value={f.batchId} onChange={set("batchId")}>
            <option value="">পরে নির্ধারণ</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </Field>
        <Field label="ইমেইল (ঐচ্ছিক)"><input className="input" type="email" value={f.email} onChange={set("email")} /></Field>
        <Field label="শিক্ষাগত যোগ্যতা (ঐচ্ছিক)"><input className="input" value={f.education} onChange={set("education")} /></Field>
        <Field label="প্রতিষ্ঠান (ঐচ্ছিক)"><input className="input" value={f.institute} onChange={set("institute")} /></Field>
        <Field label="ঠিকানা (ঐচ্ছিক)"><input className="input" value={f.address} onChange={set("address")} /></Field>
        <Field label="অতিরিক্ত ছাড় (৳)"><input className="input" type="number" min={0} value={f.discount} onChange={set("discount")} /></Field>
        <Field label="প্রোমো কোড"><input className="input uppercase" value={f.promoCode} onChange={set("promoCode")} /></Field>
        <Field label="এখন জমা (৳)"><input className="input" type="number" min={0} value={f.initialPayment} onChange={set("initialPayment")} /></Field>
        <Field label="মাধ্যম">
          <select className="input" value={f.method} onChange={set("method")}>
            {Object.entries(PAY_METHODS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="অবস্থা">
          <select className="input" value={f.status} onChange={set("status")}>
            <option value="approved">ভর্তি নিশ্চিত</option>
            <option value="pending">অপেক্ষমাণ</option>
          </select>
        </Field>
        <Field label="নোট"><input className="input" value={f.note} onChange={set("note")} /></Field>
        <div className="flex items-center justify-between rounded-xl bg-brand-50 p-3 text-sm sm:col-span-2">
          <span>কোর্স ফি: <b>{money(fee)}</b> − ছাড় {money(Number(f.discount) || 0)} = <b className="text-brand-700">{money(Math.max(0, fee - (Number(f.discount) || 0)))}</b> {f.promoCode && "(প্রোমো আলাদা)"}</span>
          <Switch checked={f.notify} onChange={(v) => setF({ ...f, notify: v })} label="এসএমএস পাঠান" />
        </div>
      </form>
    </Modal>
  );
}
