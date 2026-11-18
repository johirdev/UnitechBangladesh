"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { get, post, errMsg } from "@/lib/api";
import type { Settings } from "@/lib/types";
import { Modal, Field, Spinner } from "@/components/ui";

type Kind = "due" | "batch" | "custom";
const TEMPLATE_KEY: Record<Kind, string> = { due: "dueTemplate", batch: "batchTemplate", custom: "" };
const TITLES: Record<Kind, string> = { due: "বকেয়া রিমাইন্ডার এসএমএস", batch: "ব্যাচ/ক্লাসের সময় জানিয়ে এসএমএস", custom: "কাস্টম এসএমএস" };

/** নির্বাচিত এনরোলমেন্টগুলোতে টেমপ্লেট এসএমএস পাঠায় */
export default function SmsComposer({ open, onClose, enrollmentIds, kind }: { open: boolean; onClose: () => void; enrollmentIds: string[]; kind: Kind }) {
  const [msg, setMsg] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMsg("");
    if (TEMPLATE_KEY[kind])
      get<Settings>("/admin/settings")
        .then((r) => setMsg(String(r.data.sms?.[TEMPLATE_KEY[kind]] || "")))
        .catch(() => {});
  }, [open, kind]);

  const send = async () => {
    setBusy(true);
    try {
      const r = await post("/admin/sms/enrollments", { enrollmentIds, message: msg, type: kind, date: date ? new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : undefined, time: time || undefined });
      toast.success(r.message);
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const len = msg.length;
  const isUnicode = /[^\x00-\x7F]/.test(msg);
  const parts = Math.max(1, Math.ceil(len / (isUnicode ? 67 : 153)));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={TITLES[kind]}
      footer={
        <>
          <button className="btn-outline" onClick={onClose}>বাতিল</button>
          <button className="btn-primary" onClick={send} disabled={busy || !msg.trim()}>
            {busy ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />} {enrollmentIds.length} জনকে পাঠান
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {kind === "batch" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ক্লাস শুরুর তারিখ ({date})"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="সময় ({time})"><input className="input" value={time} onChange={(e) => setTime(e.target.value)} placeholder="সন্ধ্যা ৬:৩০" /></Field>
          </div>
        )}
        <Field label="মেসেজ" hint={`${len} অক্ষর • আনুমানিক ${parts}টি এসএমএস/জন${isUnicode ? " (বাংলা)" : ""}`}>
          <textarea className="input" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} />
        </Field>
        <div className="rounded-lg bg-gray-50 p-3 text-xs text-ink-muted">
          ব্যবহারযোগ্য: <code>{"{name}"}</code> <code>{"{course}"}</code> <code>{"{batch}"}</code> <code>{"{payable}"}</code> <code>{"{paid}"}</code> <code>{"{due}"}</code> <code>{"{studentId}"}</code> <code>{"{date}"}</code> <code>{"{time}"}</code> <code>{"{site}"}</code>
          {kind === "due" && <p className="mt-1">শুধু যাদের বকেয়া আছে তাদের কাছেই যাবে।</p>}
        </div>
      </div>
    </Modal>
  );
}
