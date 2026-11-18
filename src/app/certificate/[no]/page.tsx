"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, ArrowLeft, Printer } from "lucide-react";
import { get, errMsg } from "@/lib/api";
import type { Certificate } from "@/lib/types";
import CertificateView, { CERT_W, CERT_H } from "@/components/CertificateView";
import { PageLoader, Empty, Spinner } from "@/components/ui";

export default function CertificatePage() {
  const { no } = useParams<{ no: string }>() ?? ({} as { no: string });
  const [c, setC] = useState<Certificate | null>(null);
  const [err, setErr] = useState("");
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const cert = useRef<HTMLDivElement>(null);

  useEffect(() => {
    get<Certificate>(`/public/certificates/${encodeURIComponent(no)}`)
      .then((r) => setC(r.data))
      .catch((e) => setErr(errMsg(e)));
  }, [no]);

  useEffect(() => {
    if (!wrap.current) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / CERT_W)));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [c]);

  const download = async () => {
    if (!cert.current || !c) return;
    setBusy(true);
    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      const png = await toPng(cert.current, { pixelRatio: 2.5, cacheBust: true, style: { transform: "none" }, width: CERT_W, height: CERT_H });
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [CERT_W, CERT_H] });
      pdf.addImage(png, "PNG", 0, 0, CERT_W, CERT_H);
      pdf.save(`${c.certificateNo}-${c.studentName.replace(/\s+/g, "_")}.pdf`);
    } catch (e) {
      toast.error("PDF তৈরি হয়নি, প্রিন্ট বাটন দিয়ে 'Save as PDF' করুন");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (err) return <div className="container py-20"><Empty title="সার্টিফিকেট পাওয়া যায়নি" text={err} action={<Link href="/verify-certificate" className="btn-primary">আবার খুঁজুন</Link>} /></div>;
  if (!c) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:p-0">
      <div className="container no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/verify-certificate" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" /> ফিরে যান
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-outline">
            <Printer className="h-4 w-4" /> প্রিন্ট
          </button>
          <button onClick={download} className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4 text-white" /> : <Download className="h-4 w-4" />} PDF ডাউনলোড
          </button>
        </div>
      </div>
      <div ref={wrap} className="container print:max-w-none print:p-0">
        <div style={{ height: CERT_H * scale }} className="print:!h-auto">
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: CERT_W }} className="shadow-2xl print:!transform-none print:shadow-none">
            <CertificateView ref={cert} c={c} />
          </div>
        </div>
      </div>
      <style>{`@media print { @page { size: A4 landscape; margin: 0 } }`}</style>
    </div>
  );
}
