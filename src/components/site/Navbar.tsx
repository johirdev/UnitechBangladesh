"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Phone, LayoutDashboard, LogOut, ShieldCheck, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/ui";
import { cn, dashboardPath } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "হোম" },
  { href: "/courses", label: "কোর্সসমূহ" },
  { href: "/gallery", label: "গ্যালারি" },
  { href: "/unitech-architectural", label: "আর্কিটেকচারাল" },
  { href: "/verify-certificate", label: "সার্টিফিকেট যাচাই" },
  { href: "/guide", label: "গাইড" },
  { href: "/#contact", label: "যোগাযোগ" },
];

export default function Navbar({ logo, phone }: { logo?: string; phone?: string }) {
  const pathname = usePathname() ?? "";
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={cn("sticky top-0 z-50 bg-white/90 backdrop-blur transition-shadow", scrolled && "shadow-[0_1px_0_rgba(0,0,0,.06),0_8px_24px_-12px_rgba(0,0,0,.12)]")}>
      <div className="hidden bg-ink text-xs text-white/80 md:block">
        <div className="container flex h-9 items-center justify-between">
          <span>দক্ষ হবো ইউনিটেক এর সাথে — ফার্মগেট, ঢাকা</span>
          {phone && (
            <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 hover:text-brand">
              <Phone className="h-3.5 w-3.5" /> {phone}
            </a>
          )}
        </div>
      </div>
      <nav className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Unitech Bangladesh">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo || "/images/logo.png"} alt="Unitech Bangladesh" className="h-12 w-auto" />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href) && !l.href.includes("#");
            return (
              <li key={l.href}>
                <Link href={l.href} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition hover:text-brand-700", active ? "text-brand-700" : "text-ink-soft")}>
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          {!loading && user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href={dashboardPath(user.role)} className="btn-outline btn-sm rounded-sm">
                {user.role === "student" ? <LayoutDashboard className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />} ড্যাশবোর্ড
              </Link>
              <Avatar src={user.avatar} name={user.name} size={34} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="btn-outline h-9 w-9 rounded-sm p-0" title="লগইন" aria-label="লগইন">
                <LogIn className="h-4 w-4" />
              </Link>
              <Link href="/register" className="btn-primary h-9 w-9 rounded-sm p-0" title="রেজিস্ট্রেশন" aria-label="রেজিস্ট্রেশন">
                <UserPlus className="h-4 w-4" />
              </Link>
            </div>
          )}
          <button className="rounded-lg p-2 text-ink lg:hidden" onClick={() => setOpen(!open)} aria-label="মেনু">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t bg-white lg:hidden">
          <ul className="container flex flex-col py-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-brand-50">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex gap-2 border-t pt-3">
              {user ? (
                <>
                  <Link href={dashboardPath(user.role)} className="btn-primary flex-1 rounded-sm">
                    <LayoutDashboard className="h-4 w-4" /> ড্যাশবোর্ড
                  </Link>
                  <button onClick={logout} className="btn-outline rounded-sm" title="লগআউট" aria-label="লগআউট">
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-outline flex-1 rounded-sm">
                    <LogIn className="h-4 w-4" /> লগইন
                  </Link>
                  <Link href="/register" className="btn-primary flex-1 rounded-sm">
                    <UserPlus className="h-4 w-4" /> রেজিস্ট্রেশন
                  </Link>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
