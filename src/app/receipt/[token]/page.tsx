"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Printer, CheckCircle2, Home } from "lucide-react";
import { get, errMsg } from "@/lib/api";
import { PageLoader, Empty, Spinner } from "@/components/ui";
import { money, fmtDate, PAY_METHODS } from "@/lib/utils";

type Receipt = {
  kind: "student" | "teacher";
  receiptNo: string;
  amount: number;
  method: string;
  trxId?: string;
  note?: string;
  paidAt: string;
  receivedBy: string;
  course?: string;
  batch?: string;
  studentId?: string;
  name: string;
  phone: string;
  payable?: number;
  paid?: number;
  due?: number;
  site: { name: string; logo?: string; phone?: string; phone2?: string; email?: string; address?: string };
};

const Row = ({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) => (
  <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 py-2 text-sm last:border-0">
    <span className="text-gray-500">{k}</span>
    <span className={`text-right ${strong ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>{v}</span>
  </div>
);

export default function ReceiptPage() {
  const { token } = useParams<{ token: string }>() ?? ({} as { token: string });
  const [r, setR] = useState<Receipt | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    get<Receipt>(`/public/receipts/${encodeURIComponent(token)}`)
      .then((x) => setR(x.data))
      .catch((e) => setErr(errMsg(e)));
  }, [token]);

  const download = async () => {
    if (!box.current || !r) return;
    setBusy(true);
    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      const el = box.current;
      const png = await toPng(el, { pixelRatio: 2.5, cacheBust: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [el.offsetWidth, el.offsetHeight] });
      pdf.addImage(png, "PNG", 0, 0, el.offsetWidth, el.offsetHeight);
      pdf.save(`receipt-${r.receiptNo}.pdf`);
    } catch (e) {
      toast.error("PDF তৈরি হয়নি, প্রিন্ট বাটন দিয়ে 'Save as PDF' করুন");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (err) return <div className="container py-20"><Empty title="রসিদ পাওয়া যায়নি" text={err} action={<Link href="/" className="btn-primary">হোমপেজ</Link>} /></div>;
  if (!r) return <PageLoader />;

  const teacher = r.kind === "teacher";

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-5 flex max-w-xl flex-wrap items-center justify-between gap-2">
        <Link href="/" className="btn-ghost"><Home className="h-4 w-4" /> হোম</Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-outline"><Printer className="h-4 w-4" /> প্রিন্ট</button>
          <button onClick={download} className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4 text-white" /> : <Download className="h-4 w-4" />} PDF ডাউনলোড
          </button>
        </div>
      </div>

      <div ref={box} className="mx-auto max-w-xl bg-white p-6 shadow-xl sm:p-8 print:max-w-none print:shadow-none">
        <div className="flex items-start justify-between gap-4 border-b-2 border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.site.logo || "/images/logo.png"} alt="" className="h-12 w-auto" crossOrigin="anonymous" />
            <div>
              <div className="text-lg font-bold text-gray-900">{r.site.name}</div>
              {r.site.address && <div className="text-xs text-gray-500">{r.site.address}</div>}
              <div className="text-xs text-gray-500">{[r.site.phone, r.site.phone2, r.site.email].filter(Boolean).join(" • ")}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-gray-500">{teacher ? "পেমেন্ট ভাউচার" : "মানি রসিদ"}</div>
            <div className="font-mono text-sm font-bold text-gray-900">{r.receiptNo}</div>
            <div className="text-xs text-gray-500">{fmtDate(r.paidAt)}</div>
          </div>
        </div>

        <div className="my-5 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 py-4 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" />
          <span className="text-2xl font-bold">{money(r.amount)}</span>
          <span className="text-sm">{teacher ? "প্রদান করা হয়েছে" : "গ্রহণ করা হয়েছে"}</span>
        </div>

        <div>
          <Row k={teacher ? "শিক্ষকের নাম" : "শিক্ষার্থীর নাম"} v={r.name} />
          {r.studentId && <Row k="স্টুডেন্ট আইডি" v={<span className="font-mono">{r.studentId}</span>} />}
          {r.phone && <Row k="মোবাইল" v={r.phone} />}
          {r.course && <Row k="কোর্স" v={r.course} />}
          {r.batch && <Row k="ব্যাচ" v={r.batch} />}
          <Row k="পেমেন্ট মাধ্যম" v={PAY_METHODS[r.method] || r.method} />
          {r.trxId && <Row k="ট্রানজেকশন আইডি" v={<span className="font-mono">{r.trxId}</span>} />}
          {r.note && <Row k="বিবরণ" v={r.note} />}
          {r.receivedBy && <Row k={teacher ? "প্রদানকারী" : "গ্রহণকারী"} v={r.receivedBy} />}
        </div>

        {!teacher && r.payable !== undefined && (
          <div className="mt-5 rounded-lg border border-gray-200 p-4">
            <Row k="মোট কোর্স ফি" v={money(r.payable)} />
            <Row k="এ পর্যন্ত মোট জমা" v={money(r.paid)} />
            <Row k="বকেয়া" v={<span className={r.due ? "text-red-600" : "text-emerald-700"}>{r.due ? money(r.due) : "পরিশোধিত ✓"}</span>} strong />
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">এটি কম্পিউটারে তৈরি রসিদ, স্বাক্ষরের প্রয়োজন নেই। • {r.site.name}</p>
      </div>
      <style>{`@media print { @page { size: A4 portrait; margin: 12mm } }`}</style>
    </div>
  );
}
