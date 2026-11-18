"use client";

import { useState } from "react";
import { toast } from "sonner";
import { post, errMsg } from "@/lib/api";
import type { Enrollment } from "@/lib/types";
import { money, PAY_METHODS } from "@/lib/utils";
import { Modal, Field, Switch, Spinner } from "@/components/ui";

/** এনরোলমেন্টে টাকা জমা নেওয়া (ম্যানুয়াল) */
export default function PaymentModal({ e, onClose, onDone }: { e: Enrollment | null; onClose: () => void; onDone: () => void }) {
  const due = e ? Math.max(0, e.payable - e.paid) : 0;
  const [f, setF] = useState({ amount: "", method: "cash", trxId: "", note: "", paidAt: new Date().toISOString().slice(0, 10), notify: true });
  const [busy, setBusy] = useState(false);

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!e) return;
    setBusy(true);
    try {
      const r = await post(`/admin/enrollments/${e._id}/payments`, { ...f, amount: Number(f.amount) });
      toast.success(r.message);
      setF({ ...f, amount: "", trxId: "", note: "" });
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
      open={!!e}
      onClose={onClose}
      title="পেমেন্ট গ্রহণ"
      size="sm"
      footer={
        <>
          <button className="btn-outline" onClick={onClose}>বাতিল</button>
          <button className="btn-primary" form="pay-form" disabled={busy}>
            {busy && <Spinner className="h-4 w-4 text-white" />} জমা নিন
          </button>
        </>
      }
    >
      {e && (
        <form id="pay-form" onSubmit={save} className="space-y-4">
          <div className="rounded-xl bg-gray-50 p-3 text-sm">
            <p className="font-semibold">{e.fullName}</p>
            <p className="text-ink-muted">{e.course?.title}</p>
            <div className="mt-2 flex justify-between"><span>মোট</span><span>{money(e.payable)}</span></div>
            <div className="flex justify-between"><span>জমা</span><span className="text-emerald-700">{money(e.paid)}</span></div>
            <div className="flex justify-between font-semibold"><span>বকেয়া</span><span className="text-red-600">{money(due)}</span></div>
          </div>
          <Field label="টাকার পরিমাণ" required>
            <div className="flex gap-2">
              <input className="input" type="number" min={1} max={due} value={f.amount} onChange={(x) => setF({ ...f, amount: x.target.value })} required autoFocus />
              <button type="button" className="btn-outline btn-sm whitespace-nowrap" onClick={() => setF({ ...f, amount: String(due) })}>সম্পূর্ণ</button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="মাধ্যম">
              <select className="input" value={f.method} onChange={(x) => setF({ ...f, method: x.target.value })}>
                {Object.entries(PAY_METHODS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="তারিখ"><input className="input" type="date" value={f.paidAt} onChange={(x) => setF({ ...f, paidAt: x.target.value })} /></Field>
          </div>
          {f.method !== "cash" && <Field label="ট্রানজেকশন আইডি"><input className="input" value={f.trxId} onChange={(x) => setF({ ...f, trxId: x.target.value })} placeholder={e.paymentTrxId || ""} /></Field>}
          <Field label="নোট"><input className="input" value={f.note} onChange={(x) => setF({ ...f, note: x.target.value })} /></Field>
          <Switch checked={f.notify} onChange={(v) => setF({ ...f, notify: v })} label="শিক্ষার্থীকে এসএমএস পাঠান" />
        </form>
      )}
    </Modal>
  );
}
