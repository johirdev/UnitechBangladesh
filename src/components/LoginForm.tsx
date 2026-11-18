"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { post, errMsg } from "@/lib/api";
import type { User } from "@/lib/types";
import { dashboardPath } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { Spinner } from "./ui";
import DemoLogins from "./DemoLogins";
import { MASTER_ADMIN, DEMO_TEACHER, DEMO_STUDENT, showDemoLogin } from "@/lib/demo-accounts";

/** নিরাপদ redirect — শুধু সাইটের ভেতরের পাথ */
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "");

export default function LoginForm({ staff }: { staff?: boolean }) {
  const router = useRouter();
  const sp = useSearchParams() ?? new URLSearchParams();
  const { setUser } = useAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await post<User>("/auth/login", { phone: login, password });
      setUser(r.data);
      toast.success(`স্বাগতম, ${r.data.name}`);
      router.replace(safeNext(sp.get("next")) || dashboardPath(r.data.role));
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (l: string, p: string) => {
    setLogin(l);
    setPassword(p);
    toast.info("লগইন তথ্য বসানো হয়েছে — এখন লগইন চাপুন");
  };

  return (
    <>
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="label">{staff ? "ইমেইল বা মোবাইল নম্বর" : "মোবাইল নম্বর (বা ইমেইল)"}</label>
        <input className="input py-3" value={login} onChange={(e) => setLogin(e.target.value)} placeholder={staff ? "admin@example.com / 01XXXXXXXXX" : "01XXXXXXXXX"} autoComplete="username" required />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="label">পাসওয়ার্ড</label>
          <Link href="/forgot-password" className="mb-1.5 text-xs font-medium text-brand-700 hover:underline">
            পাসওয়ার্ড ভুলে গেছেন?
          </Link>
        </div>
        <div className="relative">
          <input className="input py-3 pr-10" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-label="পাসওয়ার্ড দেখুন">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <button className="btn-primary w-full py-3 text-base" disabled={busy}>
        {busy && <Spinner className="h-4 w-4 text-white" />} লগইন
      </button>
      {!staff && (
        <p className="text-center text-sm text-ink-muted">
          অ্যাকাউন্ট নেই?{" "}
          <Link href="/register" className="font-semibold text-brand-700 hover:underline">
            রেজিস্ট্রেশন করুন
          </Link>
        </p>
      )}
    </form>
    {showDemoLogin && <DemoLogins accounts={staff ? [MASTER_ADMIN, DEMO_TEACHER] : [DEMO_STUDENT, DEMO_TEACHER, MASTER_ADMIN]} onUse={fillDemo} />}
    </>
  );
}
