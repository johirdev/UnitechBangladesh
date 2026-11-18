import { getSettings } from "../models/Content";
import { fillTemplate, sendSms } from "./sms";

type EnrollLike = {
  fullName: string;
  phone: string;
  payable: number;
  paid: number;
  course?: { title?: string } | unknown;
  batch?: { name?: string; startDate?: Date | null } | unknown;
  student?: { studentId?: string | null } | unknown;
};

export const bdDate = (d?: Date | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dhaka" }) : "");

export function enrollVars(e: EnrollLike, extra: Record<string, string | number> = {}, site = "") {
  const course = (e.course as { title?: string }) || {};
  const batch = (e.batch as { name?: string; startDate?: Date }) || {};
  const student = (e.student as { studentId?: string }) || {};
  return {
    name: e.fullName,
    course: course.title || "",
    batch: batch.name || "",
    payable: e.payable,
    paid: e.paid,
    due: Math.max(0, e.payable - e.paid),
    studentId: student.studentId || "",
    date: bdDate(batch.startDate),
    site,
    ...extra,
  };
}

type Kind = "enroll" | "approve" | "payment" | "complete";

/** অ্যাডমিন সেটিংস অনুযায়ী স্বয়ংক্রিয় এসএমএস (চালু থাকলে) */
export async function autoSms(kind: Kind, e: EnrollLike, extra: Record<string, string | number> = {}, sentBy?: unknown) {
  const s = await getSettings();
  const sms = s.sms!;
  const map = {
    enroll: [sms.enrollEnabled, sms.enrollTemplate],
    approve: [sms.approveEnabled, sms.approveTemplate],
    payment: [sms.paymentEnabled, sms.paymentTemplate],
    complete: [true, sms.completeTemplate],
  } as const;
  const [enabled, tpl] = map[kind];
  if (!enabled || !tpl) return null;
  // টেমপ্লেটে {receipt} না থাকলেও রসিদের লিংক শেষে যোগ হবে
  const text = extra.receipt && !tpl.includes("{receipt}") ? `${tpl}\nরসিদ: {receipt}` : tpl;
  return sendSms(e.phone, fillTemplate(text, enrollVars(e, extra, s.siteName || "")), kind, sentBy);
}
