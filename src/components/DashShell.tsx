"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, ExternalLink, type LucideIcon } from "lucide-react";
import { useAuth, can } from "./AuthProvider";
import { Avatar, PageLoader } from "./ui";
import { cn, dashboardPath, ROLE_LABEL } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: LucideIcon; perm?: string; roles?: string[]; group?: string };

export default function DashShell({ items, roles, loginPath = "/login", children, title }: { items: NavItem[]; roles: string[]; loginPath?: string; children: React.ReactNode; title: string }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`${loginPath}?next=${encodeURIComponent(pathname)}`);
    else if (!roles.includes(user.role)) router.replace(dashboardPath(user.role));
  }, [user, loading, roles, router, loginPath, pathname]);
  useEffect(() => setOpen(false), [pathname]);

  if (loading || !user || !roles.includes(user.role)) return <PageLoader />;

  const visible = items.filter((i) => (!i.perm || can(user, i.perm)) && (!i.roles || i.roles.includes(user.role)));
  const groups = visible.reduce<Record<string, NavItem[]>>((acc, i) => ((acc[i.group || ""] ||= []).push(i), acc), {});
  const base = items[0]?.href;

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b px-5">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Unitech" className="h-9" />
        </Link>
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="বন্ধ">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {Object.entries(groups).map(([g, list]) => (
          <div key={g} className="mb-4">
            {g && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{g}</p>}
            <ul className="space-y-0.5">
              {list.map(({ href, label, icon: Icon }) => {
                const active = href === base ? pathname === href : pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link href={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", active ? "bg-brand text-white shadow-sm" : "text-ink-soft hover:bg-brand-50 hover:text-brand-700")}>
                      <Icon className="h-[18px] w-[18px]" /> {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t p-3">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-gray-100">
          <ExternalLink className="h-4 w-4" /> ওয়েবসাইট দেখুন
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
          <LogOut className="h-4 w-4" /> লগআউট
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-white lg:block">{Sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl">{Sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="মেনু">
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-semibold text-ink">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{user.name}</p>
              <p className="text-xs text-ink-muted">{ROLE_LABEL[user.role]}</p>
            </div>
            <Avatar src={user.avatar} name={user.name} size={38} />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
