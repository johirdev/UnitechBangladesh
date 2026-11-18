"use client";

import ProfileForm from "@/components/ProfileForm";
import { PageHeader } from "@/components/ui";

export default function Profile() {
  return (
    <>
      <PageHeader title="আমার প্রোফাইল" desc="ছবি, রক্তের গ্রুপ, শিক্ষা প্রতিষ্ঠান ইত্যাদি তথ্য আপডেট করুন" />
      <ProfileForm />
    </>
  );
}
