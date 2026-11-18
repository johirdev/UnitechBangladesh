import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-black text-brand">404</p>
      <h1 className="mt-4 text-2xl font-bold">পেজটি পাওয়া যায়নি</h1>
      <p className="mt-2 text-ink-muted">আপনি যে পেজ খুঁজছেন সেটি নেই অথবা সরিয়ে ফেলা হয়েছে।</p>
      <Link href="/" className="btn-primary mt-6">হোমপেজে যান</Link>
    </div>
  );
}
