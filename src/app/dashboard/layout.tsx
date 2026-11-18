"use client";

import { LayoutDashboard, BookOpen, Wallet, Award, Star, UserCircle, Search } from "lucide-react";
import DashShell, { type NavItem } from "@/components/DashShell";

const items: NavItem[] = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "আমার কোর্স", icon: BookOpen },
  { href: "/dashboard/payments", label: "পেমেন্ট ইতিহাস", icon: Wallet },
  { href: "/dashboard/certificates", label: "সার্টিফিকেট", icon: Award },
  { href: "/dashboard/reviews", label: "রিভিউ দিন", icon: Star },
  { href: "/dashboard/profile", label: "প্রোফাইল", icon: UserCircle },
  { href: "/courses", label: "নতুন কোর্স খুঁজুন", icon: Search },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashShell items={items} roles={["student"]} title="শিক্ষার্থী প্যানেল">
      {children}
    </DashShell>
  );
}
