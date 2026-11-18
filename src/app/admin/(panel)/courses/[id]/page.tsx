"use client";

import { useParams } from "next/navigation";
import CourseForm from "@/components/admin/CourseForm";
import { PageHeader } from "@/components/ui";

export default function EditCourse() {
  const { id } = useParams<{ id: string }>() ?? ({} as { id: string });
  return (
    <>
      <PageHeader title="কোর্স এডিট" />
      <CourseForm id={id} />
    </>
  );
}
