"use client";

import { LayoutDashboard, Wallet, UserCircle } from "lucide-react";
import DashShell, { type NavItem } from "@/components/DashShell";

const items: NavItem[] = [
  { href: "/teacher", label: "ড্যাশবোর্ড ও ব্যাচ", icon: LayoutDashboard },
  { href: "/teacher/earnings", label: "আমার পেমেন্ট", icon: Wallet },
  { href: "/teacher/profile", label: "প্রোফাইল ও স্বাক্ষর", icon: UserCircle },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashShell items={items} roles={["teacher"]} loginPath="/admin/login" title="শিক্ষক প্যানেল">
      {children}
    </DashShell>
  );
}
