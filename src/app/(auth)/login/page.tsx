import { Suspense } from "react";
import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "লগইন" };

export default function LoginPage() {
  return (
    <AuthShell title="লগইন করুন" subtitle="আপনার মোবাইল নম্বর ও পাসওয়ার্ড দিন">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
