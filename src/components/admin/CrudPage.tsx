"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useApi, useDebounced } from "@/lib/hooks";
import { post, patch, del, get, errMsg } from "@/lib/api";
import { toInputDate } from "@/lib/utils";
import ImageUpload from "@/components/ImageUpload";
import { Modal, Confirm, Field, Switch, Spinner, Empty, PageHeader, Pagination, PageLoader } from "@/components/ui";

type Opt = { value: string; label: string };
export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "image" | "switch" | "select" | "date" | "multiselect";
  required?: boolean;
  aspect?: number;
  folder?: string;
  options?: Opt[];
  /** API থেকে অপশন লোড — যেমন কোর্স/শিক্ষক তালিকা */
  load?: () => Promise<Opt[]>;
  hint?: string;
  full?: boolean;
  placeholder?: string;
};
export type Column<T> = { label: string; render: (row: T) => React.ReactNode; className?: string };

type Props<T> = {
  title: string;
  desc?: string;
  endpoint: string;
  fields: FieldDef[];
  columns: Column<T>[];
  defaults?: Record<string, unknown>;
  /** এডিট খোলার সময় row → ফর্ম ভ্যালু */
  toForm?: (row: T) => Record<string, unknown>;
  search?: boolean;
  filters?: React.ReactNode;
  query?: Record<string, string | undefined>;
  canCreate?: boolean;
  modalSize?: "sm" | "md" | "lg" | "xl";
  cards?: (row: T, actions: { edit: () => void; remove: () => void }) => React.ReactNode;
};

export default function CrudPage<T extends { _id: string }>({ title, desc, endpoint, fields, columns, defaults = {}, toForm, search = true, filters, query = {}, canCreate = true, modalSize = "md", cards }: Props<T>) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const { data, meta, loading, reload } = useApi<T[]>(endpoint, { page, limit: 30, q: dq, ...query });
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>(defaults);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<T | null>(null);
  const [opts, setOpts] = useState<Record<string, Opt[]>>({});

  useEffect(() => {
    fields
      .filter((f) => f.load)
      .forEach((f) =>
        f.load!()
          .then((o) => setOpts((x) => ({ ...x, [f.name]: o })))
          .catch(() => {}),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...defaults });
    setOpen(true);
  };
  const openEdit = (row: T) => {
    setEditing(row);
    const f: Record<string, unknown> = toForm ? toForm(row) : { ...row };
    for (const fd of fields) if (fd.type === "date") f[fd.name] = toInputDate(f[fd.name] as string);
    setForm(f);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body: Record<string, unknown> = {};
      for (const f of fields) {
        let v = form[f.name];
        if (f.type === "number") v = v === "" || v === undefined ? undefined : Number(v);
        if (f.type === "select" && v && typeof v === "object") v = (v as { _id: string })._id;
        if (f.type === "multiselect") v = ((v as (string | { _id: string })[]) || []).map((x) => (typeof x === "object" ? x._id : x));
        if (v !== undefined) body[f.name] = v;
      }
      const r = editing ? await patch(`${endpoint}/${editing._id}`, body) : await post(endpoint, body);
      toast.success(r.message);
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const r = await del(`${endpoint}/${toDelete._id}`);
      toast.success(r.message);
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const setVal = (name: string, v: unknown) => setForm((f) => ({ ...f, [name]: v }));

  return (
    <>
      <PageHeader
        title={title}
        desc={desc}
        actions={
          canCreate && (
            <button className="btn-primary" onClick={openNew}>
              <Plus className="h-4 w-4" /> নতুন যোগ করুন
            </button>
          )
        }
      />
      {(search || filters) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {search && (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input className="input pl-9" placeholder="খুঁজুন..." value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} />
            </div>
          )}
          {filters}
        </div>
      )}

      {loading && !data ? (
        <PageLoader />
      ) : !data?.length ? (
        <Empty title="কিছু নেই" text={canCreate ? "নতুন যোগ করতে উপরের বাটনে ক্লিক করুন" : undefined} />
      ) : cards ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.map((row) => <div key={row._id}>{cards(row, { edit: () => openEdit(row), remove: () => setToDelete(row) })}</div>)}</div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.label} className={c.className}>{c.label}</th>
                ))}
                <th className="text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row._id} className="hover:bg-gray-50/60">
                  {columns.map((c) => (
                    <td key={c.label} className={c.className}>{c.render(row)}</td>
                  ))}
                  <td className="whitespace-nowrap text-right">
                    <button className="btn-ghost btn-sm" onClick={() => openEdit(row)} aria-label="এডিট">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="btn-ghost btn-sm text-red-600" onClick={() => setToDelete(row)} aria-label="মুছুন">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />}

      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={editing ? "এডিট করুন" : "নতুন যোগ করুন"}
        size={modalSize}
        footer={
          <>
            <button className="btn-outline" onClick={() => setOpen(false)} type="button">বাতিল</button>
            <button className="btn-primary" form="crud-form" disabled={busy}>
              {busy && <Spinner className="h-4 w-4 text-white" />} সেভ করুন
            </button>
          </>
        }
      >
        <form id="crud-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => {
            const v = form[f.name];
            const options = f.options || opts[f.name] || [];
            const full = f.full || ["image", "textarea", "multiselect"].includes(f.type);
            return (
              <Field key={f.name} label={f.type === "switch" ? undefined : f.label} required={f.required} hint={f.hint} className={full ? "sm:col-span-2" : ""}>
                {f.type === "text" && <input className="input" value={(v as string) ?? ""} onChange={(e) => setVal(f.name, e.target.value)} required={f.required} placeholder={f.placeholder} />}
                {f.type === "number" && <input className="input" type="number" min={0} value={(v as number) ?? ""} onChange={(e) => setVal(f.name, e.target.value)} required={f.required} />}
                {f.type === "date" && <input className="input" type="date" value={(v as string) ?? ""} onChange={(e) => setVal(f.name, e.target.value)} required={f.required} />}
                {f.type === "textarea" && <textarea className="input" rows={3} value={(v as string) ?? ""} onChange={(e) => setVal(f.name, e.target.value)} required={f.required} placeholder={f.placeholder} />}
                {f.type === "switch" && <Switch checked={!!v} onChange={(b) => setVal(f.name, b)} label={f.label} />}
                {f.type === "image" && <ImageUpload value={(v as string) || ""} onChange={(url) => setVal(f.name, url)} aspect={f.aspect || 16 / 9} folder={f.folder} />}
                {f.type === "select" && (
                  <select className="input" value={typeof v === "object" && v ? (v as { _id: string })._id : ((v as string) ?? "")} onChange={(e) => setVal(f.name, e.target.value)} required={f.required}>
                    <option value="">নির্বাচন করুন</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}
                {f.type === "multiselect" && (
                  <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border p-2">
                    {options.length === 0 && <span className="text-xs text-ink-muted">কোনো অপশন নেই</span>}
                    {options.map((o) => {
                      const arr = ((v as (string | { _id: string })[]) || []).map((x) => (typeof x === "object" ? x._id : x));
                      const on = arr.includes(o.value);
                      return (
                        <button
                          type="button"
                          key={o.value}
                          onClick={() => setVal(f.name, on ? arr.filter((x) => x !== o.value) : [...arr, o.value])}
                          className={`rounded-full border px-3 py-1 text-xs ${on ? "border-brand bg-brand text-white" : "border-gray-200 hover:border-brand"}`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Field>
            );
          })}
        </form>
      </Modal>

      <Confirm open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={remove} loading={busy} />
    </>
  );
}

/** সাধারণ অপশন লোডার */
export const loadOptions = (path: string, label: (x: Record<string, unknown>) => string, query?: Record<string, string>) => async () => {
  const r = await get<Record<string, unknown>[]>(path, { limit: 500, ...query });
  return r.data.map((x) => ({ value: String(x._id), label: label(x) }));
};
