import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function AuthShell({ title, subtitle, children, staff }: { title: string; subtitle?: string; children: React.ReactNode; staff?: boolean }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={staff ? "/images/gallery/7.jpg" : "/images/banner/banner3.jpg"} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="inline-block w-fit rounded-xl bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Unitech Bangladesh" className="h-10" />
          </Link>
          <div>
            <h2 className="text-4xl font-bold leading-tight">{staff ? "অ্যাডমিন প্যানেল" : "দক্ষ হবো ইউনিটেক এর সাথে"}</h2>
            <ul className="mt-6 space-y-3 text-white/80">
              {(staff
                ? ["কোর্স, ব্যাচ ও শিক্ষার্থী ব্যবস্থাপনা", "পেমেন্ট, বকেয়া ও আয়-ব্যয়ের হিসাব", "এসএমএস, সার্টিফিকেট ও রিপোর্ট"]
                : ["এক জায়গায় আপনার সব কোর্স ও ব্যাচ", "পেমেন্ট ও বকেয়ার হিসাব", "অনলাইনে যাচাইযোগ্য সার্টিফিকেট"]
              ).map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-brand" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-block lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Unitech Bangladesh" className="h-11" />
          </Link>
          <h1 className="text-3xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
