import type { Metadata } from "next";

// রসিদ ব্যক্তিগত — সার্চ ইঞ্জিনে যাবে না, লিংক অন্য সাইটে referrer হিসেবে যাবে না
export const metadata: Metadata = {
  title: "পেমেন্ট রসিদ",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function ReceiptLayout({ children }: { children: React.ReactNode }) {
  return children;
}
