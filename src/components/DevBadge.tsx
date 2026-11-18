"use client";

import { useEffect, useState } from "react";

/** API development মোডে থাকলে স্ক্রিনের কোণে ছোট ব্যাজ দেখায় — production এ কিছুই দেখায় না */
export default function DevBadge() {
  const [info, setInfo] = useState<{ mode: string; sms: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/v1/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => j?.data?.mode === "development" && setInfo(j.data))
      .catch(() => {});
  }, []);

  if (!info) return null;
  return (
    <div className="no-print pointer-events-none fixed bottom-3 right-3 z-[90] rounded-full bg-amber-400 px-3 py-1.5 text-[11px] font-bold text-ink shadow-lg ring-2 ring-white" title="NODE_ENV=development">
      🛠 DEVELOPMENT — {info.sms ? "এসএমএস যাবে" : "এসএমএস যাবে না, OTP অটো"}
    </div>
  );
}
