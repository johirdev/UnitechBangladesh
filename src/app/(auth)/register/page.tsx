"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import AuthShell from "@/components/AuthShell";
import OtpFlow from "@/components/OtpFlow";
import { useAuth } from "@/components/AuthProvider";
import { Spinner } from "@/components/ui";
import { post, errMsg } from "@/lib/api";
import type { User } from "@/lib/types";

function RegisterInner() {
  const router = useRouter();
  const sp = useSearchParams() ?? new URLSearchParams();
  const { setUser } = useAuth();
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("");
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password !== f.confirm) return toast.error("দুটি পাসওয়ার্ড মেলেনি");
    setBusy(true);
    try {
      const r = await post<User>("/auth/register", { otpToken: token, name: f.name, email: f.email, password: f.password });
      setUser(r.data);
      toast.success("রেজিস্ট্রেশন সফল! স্বাগতম");
      const next = sp.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="রেজিস্ট্রেশন" subtitle={token ? `${phone} — যাচাই সম্পন্ন। এখন তথ্য দিন` : "মোবাইল নম্বর OTP দিয়ে যাচাই করুন"}>
      <div className="mb-6 flex gap-2">
        {[1, 2].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${(token ? 2 : 1) >= s ? "bg-brand" : "bg-gray-200"}`} />
        ))}
      </div>
      {!token ? (
        <OtpFlow purpose="register" onVerified={(t, p) => (setToken(t), setPhone(p))} />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">পূর্ণ নাম *</label>
            <input className="input py-3" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required autoComplete="name" />
          </div>
          <div>
            <label className="label">ইমেইল (ঐচ্ছিক)</label>
            <input className="input py-3" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">পাসওয়ার্ড *</label>
              <input className="input py-3" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required minLength={8} autoComplete="new-password" />
            </div>
            <div>
              <label className="label">আবার পাসওয়ার্ড *</label>
              <input className="input py-3" type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} required minLength={8} autoComplete="new-password" />
            </div>
          </div>
          <p className="text-xs text-ink-muted">পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের, অক্ষর ও সংখ্যা দুটোই থাকতে হবে।</p>
          <button className="btn-primary w-full py-3 text-base" disabled={busy}>
            {busy && <Spinner className="h-4 w-4 text-white" />} অ্যাকাউন্ট খুলুন
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink-muted">
        আগেই অ্যাকাউন্ট আছে?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          লগইন করুন
        </Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterInner />
    </Suspense>
  );
}
