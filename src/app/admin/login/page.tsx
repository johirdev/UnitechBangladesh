import { Suspense } from "react";
import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "স্টাফ লগইন", robots: { index: false } };

export default function AdminLogin() {
  return (
    <AuthShell staff title="স্টাফ লগইন" subtitle="অ্যাডমিন, সিইও ও শিক্ষকদের জন্য">
      <Suspense>
        <LoginForm staff />
      </Suspense>
    </AuthShell>
  );
}
