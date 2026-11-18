"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, KeyRound, Power, Pencil, Eye, EyeOff } from "lucide-react";
import { useApi, useDebounced } from "@/lib/hooks";
import { post, patch, errMsg } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader, PageLoader, Empty, Pagination, Avatar, Badge, Modal, Field, Switch, Spinner, Confirm } from "@/components/ui";
import ImageUpload from "@/components/ImageUpload";
import type { User } from "@/lib/types";
import { fmtDate, ROLE_LABEL, BLOOD_GROUPS } from "@/lib/utils";

const PERMS: Record<string, string> = {
  content: "ওয়েবসাইট কনটেন্ট",
  courses: "কোর্স, ব্যাচ, প্রোমো",
  students: "শিক্ষার্থী/শিক্ষক",
  enrollments: "এনরোলমেন্ট ও পেমেন্ট গ্রহণ",
  finance: "আয়-ব্যয় ও হিসাব",
  sms: "এসএমএস",
  certificates: "সার্টিফিকেট",
  analytics: "ভিজিটর অ্যানালিটিক্স",
  settings: "সেটিংস",
};

type Mode = "student" | "teacher" | "staff";

export default function UsersPage({ mode }: { mode: Mode }) {
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [bg, setBg] = useState("");
  const dq = useDebounced(q);
  const { data, meta, loading, reload } = useApi<User[]>("/admin/users", { role: mode, q: dq, page, limit: 30, bloodGroup: bg });
  const [edit, setEdit] = useState<Partial<User> | null>(null);
  const [notify, setNotify] = useState(true);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetU, setResetU] = useState<User | null>(null);

  const title = { student: "শিক্ষার্থী", teacher: "শিক্ষক", staff: "অ্যাডমিন ও সিইও" }[mode];
  const isSuper = me?.role === "superadmin";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = {};
      for (const k of ["name", "phone", "email", "avatar", "gender", "bloodGroup", "institute", "department", "semester", "educationLevel", "fatherName", "guardianPhone", "address", "designation", "bio", "signature"] as const) if (edit[k] !== undefined) body[k] = edit[k];
      if (isSuper && mode === "staff") {
        body.role = edit.role;
        body.permissions = edit.permissions || [];
      }
      if (edit._id) {
        await patch(`/admin/users/${edit._id}`, body);
        toast.success("আপডেট হয়েছে");
      } else {
        const r = await post<{ tempPassword?: string }>("/admin/users", { ...body, role: mode === "staff" ? edit.role || "admin" : mode, password, notify });
        toast.success(r.data.tempPassword ? `অ্যাকাউন্ট তৈরি হয়েছে। পাসওয়ার্ড: ${r.data.tempPassword}` : "অ্যাকাউন্ট তৈরি হয়েছে", { duration: 15000 });
      }
      setEdit(null);
      setPassword("");
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (u: User) => {
    try {
      await patch(`/admin/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? "অ্যাকাউন্ট বন্ধ করা হয়েছে" : "অ্যাকাউন্ট চালু হয়েছে");
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const resetPw = async () => {
    if (!resetU) return;
    try {
      const r = await post<{ tempPassword: string }>(`/admin/users/${resetU._id}/reset-password`, { notify: true });
      toast.success(`নতুন পাসওয়ার্ড: ${r.data.tempPassword} (এসএমএসেও পাঠানো হয়েছে)`, { duration: 20000 });
      setResetU(null);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const set = (k: keyof User) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setEdit({ ...edit, [k]: e.target.value });
  const canManage = mode !== "staff" || isSuper;

  return (
    <>
      <PageHeader
        title={title}
        desc={mode === "staff" ? "অ্যাডমিনদের আলাদা আলাদা অনুমতি দিন — Super Admin ও CEO সব দেখতে পারেন" : mode === "teacher" ? "শিক্ষকদের ব্যাচে যুক্ত করলে তারা নিজের ড্যাশবোর্ডে ব্যাচ ও পেমেন্ট দেখতে পারবেন" : "সব শিক্ষার্থীর তালিকা ও প্রোফাইল"}
        actions={canManage && <button className="btn-primary" onClick={() => setEdit({ role: mode === "staff" ? "admin" : mode, permissions: [] })}><Plus className="h-4 w-4" /> নতুন {title}</button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-9" placeholder="নাম / মোবাইল / আইডি / প্রতিষ্ঠান" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} />
        </div>
        {mode === "student" && (
          <select className="input w-auto" value={bg} onChange={(e) => setBg(e.target.value)}>
            <option value="">সব রক্তের গ্রুপ</option>
            {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
          </select>
        )}
      </div>
      {loading && !data ? <PageLoader /> : !data?.length ? <Empty title={`কোনো ${title} নেই`} /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>নাম</th><th>মোবাইল</th>
                {mode === "student" && <><th>আইডি</th><th>প্রতিষ্ঠান</th><th>রক্ত</th></>}
                {mode !== "student" && <th>পদবি / রোল</th>}
                <th>যোগদান</th><th>অবস্থা</th><th className="text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u._id}>
                  <td>
                    <Link href={`/admin/users/${u._id}`} className="flex items-center gap-2.5 hover:text-brand-700">
                      <Avatar src={u.avatar} name={u.name} size={34} />
                      <span className="font-medium">{u.name}</span>
                    </Link>
                  </td>
                  <td>{u.phone}{u.email && <span className="block text-xs text-ink-muted">{u.email}</span>}</td>
                  {mode === "student" && <><td className="font-mono text-xs">{u.studentId}</td><td className="max-w-[200px] truncate text-xs">{u.institute}</td><td>{u.bloodGroup}</td></>}
                  {mode !== "student" && (
                    <td>
                      {mode === "staff" ? <Badge className="bg-ink text-white">{ROLE_LABEL[u.role]}</Badge> : u.designation}
                      {u.role === "admin" && <span className="mt-1 block text-[11px] text-ink-muted">{u.permissions.map((p) => PERMS[p]).join(", ") || "কোনো অনুমতি নেই"}</span>}
                    </td>
                  )}
                  <td className="text-xs">{fmtDate(u.createdAt)}</td>
                  <td><Badge className={u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}>{u.isActive ? "সক্রিয়" : "বন্ধ"}</Badge></td>
                  <td className="whitespace-nowrap text-right">
                    {canManage && (
                      <>
                        <button className="btn-ghost btn-sm" onClick={() => setEdit(u)} aria-label="এডিট" title="এডিট"><Pencil className="h-4 w-4" /></button>
                        <button className="btn-ghost btn-sm" onClick={() => setResetU(u)} aria-label="পাসওয়ার্ড রিসেট" title="পাসওয়ার্ড রিসেট"><KeyRound className="h-4 w-4" /></button>
                        {u._id !== me?._id && <button className={`btn-ghost btn-sm ${u.isActive ? "text-red-600" : "text-emerald-600"}`} onClick={() => toggleActive(u)} aria-label="চালু/বন্ধ" title={u.isActive ? "বন্ধ করুন" : "চালু করুন"}><Power className="h-4 w-4" /></button>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />}

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?._id ? "এডিট করুন" : `নতুন ${title}`}
        size="lg"
        footer={<><button className="btn-outline" onClick={() => setEdit(null)}>বাতিল</button><button className="btn-primary" form="user-form" disabled={busy}>{busy && <Spinner className="h-4 w-4 text-white" />} সেভ</button></>}
      >
        {edit && (
          <form id="user-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="flex justify-center sm:col-span-2"><ImageUpload value={edit.avatar} onChange={(u) => setEdit({ ...edit, avatar: u })} aspect={1} rounded folder="avatars" label="ছবি" /></div>
            <Field label="নাম" required><input className="input" value={edit.name || ""} onChange={set("name")} required /></Field>
            <Field label="মোবাইল" required><input className="input" value={edit.phone || ""} onChange={set("phone")} required /></Field>
            <Field label="ইমেইল"><input className="input" type="email" value={edit.email || ""} onChange={set("email")} /></Field>
            {mode === "student" ? (
              <>
                <Field label="রক্তের গ্রুপ"><select className="input" value={edit.bloodGroup || ""} onChange={set("bloodGroup")}><option value="">—</option>{BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}</select></Field>
                <Field label="প্রতিষ্ঠান"><input className="input" value={edit.institute || ""} onChange={set("institute")} /></Field>
                <Field label="শিক্ষাগত যোগ্যতা"><input className="input" value={edit.educationLevel || ""} onChange={set("educationLevel")} /></Field>
                <Field label="বিভাগ"><input className="input" value={edit.department || ""} onChange={set("department")} /></Field>
                <Field label="সেমিস্টার"><input className="input" value={edit.semester || ""} onChange={set("semester")} /></Field>
                <Field label="অভিভাবকের মোবাইল"><input className="input" value={edit.guardianPhone || ""} onChange={set("guardianPhone")} /></Field>
                <Field label="ঠিকানা"><input className="input" value={edit.address || ""} onChange={set("address")} /></Field>
              </>
            ) : (
              <>
                <Field label="পদবি"><input className="input" value={edit.designation || ""} onChange={set("designation")} placeholder={mode === "teacher" ? "Senior Instructor" : "Office Manager"} /></Field>
                <Field label="পরিচিতি" className="sm:col-span-2"><textarea className="input" rows={2} value={edit.bio || ""} onChange={set("bio")} /></Field>
                <Field label="স্বাক্ষর (সার্টিফিকেটের জন্য)" className="sm:col-span-2"><div className="max-w-xs"><ImageUpload value={edit.signature} onChange={(u) => setEdit({ ...edit, signature: u })} aspect={3} folder="signatures" label="স্বাক্ষর" /></div></Field>
              </>
            )}
            {mode === "staff" && isSuper && (
              <>
                <Field label="রোল">
                  <select className="input" value={edit.role} onChange={set("role")}>
                    <option value="admin">Admin</option>
                    <option value="ceo">CEO</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </Field>
                {edit.role === "admin" && (
                  <Field label="অনুমতি (Admin যা যা করতে পারবে)" className="sm:col-span-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {Object.entries(PERMS).map(([k, v]) => (
                        <label key={k} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                          <input type="checkbox" className="accent-brand" checked={(edit.permissions || []).includes(k)} onChange={(e) => setEdit({ ...edit, permissions: e.target.checked ? [...(edit.permissions || []), k] : (edit.permissions || []).filter((x) => x !== k) })} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </Field>
                )}
              </>
            )}
            {!edit._id && (
              <>
                <Field label="পাসওয়ার্ড (ফাঁকা রাখলে স্বয়ংক্রিয়)" hint="কমপক্ষে ৮ অক্ষর, অক্ষর+সংখ্যা">
                  <div className="relative">
                    <input className="input pr-10" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink" aria-label={showPw ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}>
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <div className="flex items-end pb-2"><Switch checked={notify} onChange={setNotify} label="লগইন তথ্য এসএমএসে পাঠান" /></div>
              </>
            )}
          </form>
        )}
      </Modal>
      <Confirm open={!!resetU} onClose={() => setResetU(null)} onConfirm={resetPw} danger={false} title="পাসওয়ার্ড রিসেট?" confirmText="রিসেট করুন" message={`${resetU?.name} এর নতুন পাসওয়ার্ড তৈরি করে এসএমএসে পাঠানো হবে, পুরোনো সব সেশন বাতিল হবে।`} />
    </>
  );
}
