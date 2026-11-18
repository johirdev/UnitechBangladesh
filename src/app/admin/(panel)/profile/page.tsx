"use client";

import ProfileForm from "@/components/ProfileForm";
import { PageHeader } from "@/components/ui";

export default function AdminProfile() {
  return (
    <>
      <PageHeader title="আমার প্রোফাইল" desc="ছবি, স্বাক্ষর ও পাসওয়ার্ড" />
      <ProfileForm />
    </>
  );
}
