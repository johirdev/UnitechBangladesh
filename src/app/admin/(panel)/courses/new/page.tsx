"use client";

import CourseForm from "@/components/admin/CourseForm";
import { PageHeader } from "@/components/ui";

export default function NewCourse() {
  return (
    <>
      <PageHeader title="নতুন কোর্স" />
      <CourseForm />
    </>
  );
}
