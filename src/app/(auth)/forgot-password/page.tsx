"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import AuthShell from "@/components/AuthShell";
import OtpFlow from "@/components/OtpFlow";
import { Spinner } from "@/components/ui";
import { post, errMsg } from "@/lib/api";

export default function ForgotPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [pw, setPw] = useState({ a: "", b: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.a !== pw.b) return toast.error("দুটি পাসওয়ার্ড মেলেনি");
    setBusy(true);
    try {
      const r = await post("/auth/reset-password", { otpToken: token, password: pw.a });
      toast.success(r.message);
      router.replace("/login");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="পাসওয়ার্ড রিসেট" subtitle="রেজিস্টার্ড মোবাইল নম্বরে OTP পাঠানো হবে">
      {!token ? (
        <OtpFlow purpose="reset" onVerified={(t) => setToken(t)} />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">নতুন পাসওয়ার্ড</label>
            <input className="input py-3" type="password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} required minLength={8} autoComplete="new-password" />
          </div>
          <div>
            <label className="label">আবার নতুন পাসওয়ার্ড</label>
            <input className="input py-3" type="password" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} required minLength={8} autoComplete="new-password" />
          </div>
          <button className="btn-primary w-full py-3 text-base" disabled={busy}>
            {busy && <Spinner className="h-4 w-4 text-white" />} পাসওয়ার্ড সেট করুন
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          লগইনে ফিরে যান
        </Link>
      </p>
    </AuthShell>
  );
}
