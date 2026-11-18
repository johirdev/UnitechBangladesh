"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, LogIn, ShieldCheck, GraduationCap, UserRound } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DemoAccount } from "@/lib/demo-accounts";

const ICONS = { superadmin: ShieldCheck, teacher: UserRound, student: GraduationCap };

function CopyLine({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      toast.success(`${label} কপি হয়েছে`);
      setTimeout(() => setDone(false), 1500);
    } catch {
      toast.error("কপি করা যায়নি, হাতে সিলেক্ট করে কপি করুন");
    }
  };
  return (
    <button type="button" onClick={copy} title={`${label} কপি করুন`} className="group flex w-full items-center gap-1.5 rounded-sm bg-white px-1.5 py-1 text-left ring-1 ring-black/5 hover:ring-brand/40">
      {/* লম্বা ইমেইল ভাঙলে @ এর পরে ভাঙবে, মাঝখান থেকে নয় */}
      <span className="min-w-0 flex-1 text-[10px] leading-snug tracking-tight text-ink [overflow-wrap:anywhere]">
        {value.includes("@") ? (
          <>
            {value.split("@")[0]}@<wbr />
            {value.split("@").slice(1).join("@")}
          </>
        ) : (
          value
        )}
      </span>
      {done ? <Check className="h-3 w-3 shrink-0 text-green-600" /> : <Copy className="h-3 w-3 shrink-0 text-ink-muted group-hover:text-brand-700" />}
    </button>
  );
}

/** লগইন পেজে ডিফল্ট অ্যাকাউন্ট — এক সারিতে ২টা, কপি করুন অথবা এক ক্লিকে ফর্মে বসিয়ে নিন */
export default function DemoLogins({ accounts, onUse }: { accounts: DemoAccount[]; onUse: (login: string, password: string) => void }) {
  return (
    <div className="mt-6 rounded-sm border border-dashed border-brand/40 bg-brand/5 p-2 sm:p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
        <KeyRound className="h-3.5 w-3.5 text-brand" /> ডিফল্ট লগইন তথ্য
      </p>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {accounts.map((a, i) => {
          const Icon = ICONS[a.key];
          // বিজোড় সংখ্যক হলে শেষেরটা পুরো সারি নেয়
          const wide = accounts.length % 2 === 1 && i === accounts.length - 1;
          return (
            <div key={a.key} className={cn("space-y-1 rounded-sm bg-white/70 p-1.5 sm:p-2 ring-1 ring-black/5", wide && "col-span-2")}>
              <div className="flex items-center justify-between gap-1">
                <span className="flex min-w-0 items-center gap-1 truncate text-xs font-semibold text-ink">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-brand" /> {a.label}
                </span>
                <button type="button" onClick={() => onUse(a.email, a.password)} title="ফর্মে বসান" aria-label={`${a.label} — ফর্মে বসান`} className="shrink-0 rounded-sm bg-brand p-1 text-white hover:opacity-90">
                  <LogIn className="h-3 w-3" />
                </button>
              </div>
              <CopyLine label="ইমেইল" value={a.email} />
              <CopyLine label="পাসওয়ার্ড" value={a.password} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
