"use client";

import {
  LayoutDashboard,
  ClipboardList,
  Wallet,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Tags,
  Ticket,
  Image as ImageIcon,
  Images,
  Trophy,
  Factory,
  Star,
  Receipt,
  PieChart,
  MessageSquare,
  Award,
  BarChart3,
  Settings,
  ShieldCheck,
  History,
  UserCircle,
  BookMarked,
  Building2,
} from "lucide-react";
import DashShell, { type NavItem } from "@/components/DashShell";

const items: NavItem[] = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { group: "ভর্তি ও শিক্ষার্থী", href: "/admin/enrollments", label: "এনরোলমেন্ট", icon: ClipboardList, perm: "enrollments" },
  { group: "ভর্তি ও শিক্ষার্থী", href: "/admin/payments", label: "পেমেন্ট / কালেকশন", icon: Wallet, perm: "enrollments" },
  { group: "ভর্তি ও শিক্ষার্থী", href: "/admin/students", label: "শিক্ষার্থী", icon: Users, perm: "students" },
  { group: "ভর্তি ও শিক্ষার্থী", href: "/admin/teachers", label: "শিক্ষক", icon: GraduationCap, perm: "students" },
  { group: "কোর্স", href: "/admin/courses", label: "কোর্স", icon: BookOpen, perm: "courses" },
  { group: "কোর্স", href: "/admin/batches", label: "ব্যাচ ও আয়", icon: Layers, perm: "courses" },
  { group: "কোর্স", href: "/admin/categories", label: "ক্যাটাগরি", icon: Tags, perm: "content" },
  { group: "কোর্স", href: "/admin/promo-codes", label: "প্রোমো কোড", icon: Ticket, perm: "courses" },
  { group: "হিসাব-নিকাশ", href: "/admin/finance", label: "আয়-ব্যয় রিপোর্ট", icon: PieChart, perm: "finance" },
  { group: "হিসাব-নিকাশ", href: "/admin/expenses", label: "খরচ / শিক্ষক পেমেন্ট", icon: Receipt, perm: "finance" },
  { group: "যোগাযোগ", href: "/admin/sms", label: "এসএমএস", icon: MessageSquare, perm: "sms" },
  { group: "যোগাযোগ", href: "/admin/certificates", label: "সার্টিফিকেট", icon: Award, perm: "certificates" },
  { group: "ওয়েবসাইট কনটেন্ট", href: "/admin/banners", label: "ব্যানার", icon: ImageIcon, perm: "content" },
  { group: "ওয়েবসাইট কনটেন্ট", href: "/admin/gallery", label: "গ্যালারি", icon: Images, perm: "content" },
  { group: "ওয়েবসাইট কনটেন্ট", href: "/admin/toppers", label: "সেমিস্টার টপার", icon: Trophy, perm: "content" },
  { group: "ওয়েবসাইট কনটেন্ট", href: "/admin/attachments", label: "ইন্ডাস্ট্রিয়াল এটাচমেন্ট", icon: Factory, perm: "content" },
  { group: "ওয়েবসাইট কনটেন্ট", href: "/admin/architectural", label: "আর্কিটেকচারাল পেজ", icon: Building2, perm: "content" },
  { group: "ওয়েবসাইট কনটেন্ট", href: "/admin/reviews", label: "রিভিউ", icon: Star, perm: "content" },
  { group: "সিস্টেম", href: "/admin/analytics", label: "ভিজিটর অ্যানালিটিক্স", icon: BarChart3, perm: "analytics" },
  { group: "সিস্টেম", href: "/admin/staff", label: "অ্যাডমিন ও সিইও", icon: ShieldCheck, roles: ["superadmin", "ceo"] },
  { group: "সিস্টেম", href: "/admin/settings", label: "সেটিংস", icon: Settings, perm: "settings" },
  { group: "সিস্টেম", href: "/admin/audit", label: "অডিট লগ", icon: History, roles: ["superadmin", "ceo"] },
  { group: "আমার", href: "/admin/profile", label: "প্রোফাইল", icon: UserCircle },
  { group: "আমার", href: "/guide", label: "ব্যবহার নির্দেশিকা", icon: BookMarked },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashShell items={items} roles={["superadmin", "ceo", "admin"]} loginPath="/admin/login" title="অ্যাডমিন প্যানেল">
      {children}
    </DashShell>
  );
}
