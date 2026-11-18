"use client";

import { useState } from "react";
import { toast } from "sonner";
import { patch, post, errMsg } from "@/lib/api";
import type { User } from "@/lib/types";
import { BLOOD_GROUPS, toInputDate } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import ImageUpload from "./ImageUpload";
import { Field, Spinner } from "./ui";

/** নিজের প্রোফাইল + পাসওয়ার্ড পরিবর্তন (সব রোলের জন্য) */
export default function ProfileForm() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState<Partial<User>>({ ...user!, dateOfBirth: toInputDate(user?.dateOfBirth) });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const isStaff = user?.role !== "student";

  const set = (k: keyof User) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body: Record<string, unknown> = {};
      for (const k of ["name", "email", "avatar", "gender", "dateOfBirth", "bloodGroup", "institute", "department", "semester", "educationLevel", "fatherName", "guardianPhone", "address", "bio", ...(isStaff ? ["designation", "signature"] : [])] as const)
        body[k] = (f as Record<string, unknown>)[k] ?? "";
      if (!body.dateOfBirth) delete body.dateOfBirth;
      const r = await patch<User>("/auth/me", body);
      setUser(r.data);
      toast.success(r.message);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error("নতুন পাসওয়ার্ড দুটি মেলেনি");
    try {
      const r = await post("/auth/change-password", { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success(r.message);
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const logoutAll = async () => {
    await post("/auth/logout-all").catch(() => {});
    window.location.href = "/login";
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <form onSubmit={save} className="card space-y-6 p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <ImageUpload value={f.avatar} onChange={(url) => setF({ ...f, avatar: url })} aspect={1} rounded folder="avatars" maxWidth={600} label="ছবি" />
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold">{user?.name}</p>
            <p className="text-sm text-ink-muted">{user?.phone}</p>
            {user?.studentId && <p className="mt-1 inline-block rounded-full bg-brand-50 px-3 py-0.5 text-sm font-semibold text-brand-700">স্টুডেন্ট আইডি: {user.studentId}</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="পূর্ণ নাম" required>
            <input className="input" value={f.name || ""} onChange={set("name")} required />
          </Field>
          <Field label="ইমেইল">
            <input className="input" type="email" value={f.email || ""} onChange={set("email")} />
          </Field>
          <Field label="লিঙ্গ">
            <select className="input" value={f.gender || ""} onChange={set("gender")}>
              <option value="">নির্বাচন করুন</option>
              <option value="male">পুরুষ</option>
              <option value="female">মহিলা</option>
              <option value="other">অন্যান্য</option>
            </select>
          </Field>
          <Field label="জন্ম তারিখ">
            <input className="input" type="date" value={(f.dateOfBirth as string) || ""} onChange={set("dateOfBirth")} />
          </Field>
          <Field label="রক্তের গ্রুপ">
            <select className="input" value={f.bloodGroup || ""} onChange={set("bloodGroup")}>
              <option value="">নির্বাচন করুন</option>
              {BLOOD_GROUPS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="শিক্ষাগত যোগ্যতা">
            <input className="input" value={f.educationLevel || ""} onChange={set("educationLevel")} placeholder="যেমন: Diploma in Civil" />
          </Field>
          <Field label="শিক্ষা প্রতিষ্ঠান">
            <input className="input" value={f.institute || ""} onChange={set("institute")} />
          </Field>
          <Field label="বিভাগ / টেকনোলজি">
            <input className="input" value={f.department || ""} onChange={set("department")} placeholder="Civil / Architecture / Computer" />
          </Field>
          <Field label="সেমিস্টার">
            <input className="input" value={f.semester || ""} onChange={set("semester")} />
          </Field>
          <Field label="বাবার নাম">
            <input className="input" value={f.fatherName || ""} onChange={set("fatherName")} />
          </Field>
          <Field label="অভিভাবকের মোবাইল">
            <input className="input" value={f.guardianPhone || ""} onChange={set("guardianPhone")} />
          </Field>
          <Field label="ঠিকানা">
            <input className="input" value={f.address || ""} onChange={set("address")} />
          </Field>
          {isStaff && (
            <>
              <Field label="পদবি">
                <input className="input" value={f.designation || ""} onChange={set("designation")} placeholder="যেমন: Senior Instructor" />
              </Field>
              <Field label="সংক্ষিপ্ত পরিচিতি" className="sm:col-span-2">
                <textarea className="input" rows={3} value={f.bio || ""} onChange={set("bio")} />
              </Field>
              <Field label="স্বাক্ষর (সার্টিফিকেটে ব্যবহার হবে)" hint="সাদা ব্যাকগ্রাউন্ডে স্বাক্ষরের ছবি (PNG)" className="sm:col-span-2">
                <div className="max-w-xs">
                  <ImageUpload value={f.signature} onChange={(url) => setF({ ...f, signature: url })} aspect={3} folder="signatures" maxWidth={600} label="স্বাক্ষর আপলোড" />
                </div>
              </Field>
            </>
          )}
        </div>
        <button className="btn-primary" disabled={busy}>
          {busy && <Spinner className="h-4 w-4 text-white" />} সেভ করুন
        </button>
      </form>

      <div className="space-y-6">
        <form onSubmit={changePw} className="card space-y-4 p-6">
          <h3 className="font-semibold">পাসওয়ার্ড পরিবর্তন</h3>
          <Field label="বর্তমান পাসওয়ার্ড">
            <input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required autoComplete="current-password" />
          </Field>
          <Field label="নতুন পাসওয়ার্ড" hint="কমপক্ষে ৮ অক্ষর, অক্ষর ও সংখ্যা">
            <input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required minLength={8} autoComplete="new-password" />
          </Field>
          <Field label="আবার নতুন পাসওয়ার্ড">
            <input className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required minLength={8} autoComplete="new-password" />
          </Field>
          <button className="btn-dark w-full">পাসওয়ার্ড বদলান</button>
        </form>
        <div className="card p-6">
          <h3 className="font-semibold">নিরাপত্তা</h3>
          <p className="mt-1 text-sm text-ink-muted">অন্য কোনো ডিভাইসে লগইন থাকলে সব জায়গা থেকে লগআউট করুন।</p>
          <button onClick={logoutAll} className="btn-outline mt-4 w-full text-red-600">
            সব ডিভাইস থেকে লগআউট
          </button>
        </div>
      </div>
    </div>
  );
}
