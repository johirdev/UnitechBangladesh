import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { FaFacebookF, FaYoutube, FaWhatsapp, FaLinkedinIn } from "react-icons/fa";
import type { Settings, Category } from "@/lib/types";

export default function Footer({ s, categories }: { s?: Settings | null; categories?: Category[] }) {
  const socials = [
    { href: s?.facebook, icon: FaFacebookF, label: "Facebook" },
    { href: s?.youtube, icon: FaYoutube, label: "YouTube" },
    { href: s?.whatsapp ? `https://wa.me/88${s.whatsapp.replace(/\D/g, "").replace(/^88/, "")}` : "", icon: FaWhatsapp, label: "WhatsApp" },
    { href: s?.linkedin, icon: FaLinkedinIn, label: "LinkedIn" },
  ].filter((x) => x.href);

  return (
    <footer className="bg-ink text-white/70">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="inline-block rounded-xl bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s?.logo || "/images/logo.png"} alt="Unitech Bangladesh" className="h-10 w-auto" />
          </div>
          <p className="mt-4 text-sm leading-relaxed">{s?.aboutText || "দক্ষ হবো ইউনিটেক এর সাথে।"}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(({ href, icon: Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-brand hover:text-white">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">আমাদের কোর্স</h4>
          <ul className="space-y-2 text-sm">
            {(categories || []).slice(0, 8).map((c) => (
              <li key={c._id}>
                <Link href={`/courses?category=${c.slug}`} className="hover:text-brand">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">দরকারি লিংক</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/courses" className="hover:text-brand">সকল কোর্স</Link></li>
            <li><Link href="/gallery" className="hover:text-brand">গ্যালারি</Link></li>
            <li><Link href="/unitech-architectural" className="hover:text-brand">UNITECH Architectural</Link></li>
            <li><Link href="/verify-certificate" className="hover:text-brand">সার্টিফিকেট যাচাই</Link></li>
            <li><Link href="/guide" className="hover:text-brand">ব্যবহার নির্দেশিকা</Link></li>
            <li><Link href="/login" className="hover:text-brand">স্টুডেন্ট লগইন</Link></li>
            <li><Link href="/admin/login" className="hover:text-brand">স্টাফ লগইন</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">যোগাযোগ</h4>
          <ul className="space-y-3 text-sm">
            {s?.address && (
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {s.address}
              </li>
            )}
            {s?.phone && (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>
                  <a href={`tel:${s.phone}`} className="hover:text-brand">{s.phone}</a>
                  {s.phone2 && <>, <a href={`tel:${s.phone2}`} className="hover:text-brand">{s.phone2}</a></>}
                </span>
              </li>
            )}
            {s?.email && (
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <a href={`mailto:${s.email}`} className="break-all hover:text-brand">{s.email}</a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} {s?.siteName || "Unitech Bangladesh"}। সর্বস্বত্ব সংরক্ষিত।</p>
          <p>দক্ষ হবো ইউনিটেক এর সাথে</p>
        </div>
      </div>
    </footer>
  );
}
