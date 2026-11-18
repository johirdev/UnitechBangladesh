"use client";

import ProfileForm from "@/components/ProfileForm";
import { PageHeader } from "@/components/ui";

export default function TeacherProfile() {
  return (
    <>
      <PageHeader title="প্রোফাইল ও স্বাক্ষর" desc="আপনার স্বাক্ষর সার্টিফিকেটে ব্যবহৃত হবে" />
      <ProfileForm />
    </>
  );
}
