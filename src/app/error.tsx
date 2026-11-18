"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

// কোনো পেজে অপ্রত্যাশিত সমস্যা হলে সাদা স্ক্রিনের বদলে এটা দেখাবে
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-brand">উফ!</p>
      <h1 className="mt-4 text-2xl font-bold">কিছু একটা সমস্যা হয়েছে</h1>
      <p className="mt-2 max-w-md text-ink-muted">পেজটি লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন — সমস্যা থাকলে অফিসে যোগাযোগ করুন।</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary">
          <RotateCcw className="h-4 w-4" /> আবার চেষ্টা করুন
        </button>
        <Link href="/" className="btn-outline">
          হোমপেজে যান
        </Link>
      </div>
      {error.digest && <p className="mt-6 font-mono text-xs text-ink-muted">কোড: {error.digest}</p>}
    </div>
  );
}
