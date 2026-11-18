"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { post, errMsg } from "@/lib/api";
import { Spinner } from "./ui";

/** ধাপ ১-২: মোবাইল নম্বর → OTP যাচাই → otpToken ফেরত দেয় */
export default function OtpFlow({ purpose, onVerified }: { purpose: "register" | "reset"; onVerified: (otpToken: string, phone: string) => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async () => {
    setBusy(true);
    try {
      const r = await post<{ devOtp?: string }>("/auth/otp/send", { phone, purpose });
      setSent(true);
      setWait(60);
      if (r.data?.devOtp) {
        // Development মোড: আসল এসএমএস যায় না, OTP নিজে বসে যায়
        setCode(r.data.devOtp);
        toast.info(`Development মোড — OTP (${r.data.devOtp}) নিজে বসে গেছে, শুধু "যাচাই করুন" চাপুন`, { duration: 8000 });
      } else {
        toast.success(`${phone} নম্বরে OTP পাঠানো হয়েছে`);
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await post<{ otpToken: string }>("/auth/otp/verify", { phone, purpose, code });
      toast.success("নম্বর যাচাই সম্পন্ন");
      onVerified(r.data.otpToken, phone);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={sent ? verify : (e) => (e.preventDefault(), send())} className="space-y-5">
      <div>
        <label className="label">মোবাইল নম্বর</label>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-ink-muted">+88</span>
          <input className="input rounded-l-none py-3" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" disabled={sent} required maxLength={14} autoComplete="tel" />
        </div>
      </div>
      {sent && (
        <div>
          <label className="label">OTP কোড</label>
          <input className="input py-3 text-center text-2xl tracking-[0.5em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••••" autoFocus required autoComplete="one-time-code" />
          <div className="mt-2 flex justify-between text-xs">
            <button type="button" className="text-ink-muted hover:text-ink" onClick={() => (setSent(false), setCode(""))}>
              নম্বর পরিবর্তন
            </button>
            <button type="button" className="font-medium text-brand-700 disabled:text-ink-muted" disabled={wait > 0 || busy} onClick={send}>
              {wait > 0 ? `${wait} সেকেন্ড পর আবার পাঠান` : "আবার OTP পাঠান"}
            </button>
          </div>
        </div>
      )}
      <button className="btn-primary w-full py-3 text-base" disabled={busy || (sent && code.length !== 6)}>
        {busy && <Spinner className="h-4 w-4 text-white" />} {sent ? "যাচাই করুন" : "OTP পাঠান"}
      </button>
    </form>
  );
}
