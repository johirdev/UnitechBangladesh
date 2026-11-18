"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ImagePlus, Trash2, Link2, Crop } from "lucide-react";
import { toast } from "sonner";
import { uploadImage, errMsg } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Modal, Spinner } from "./ui";

/** ক্রপ করা অংশ ক্যানভাসে এঁকে WebP বানায় (সর্বোচ্চ maxWidth পিক্সেল) */
async function cropToBlob(src: string, area: Area, maxWidth: number): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
  const scale = Math.min(1, maxWidth / area.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width * scale);
  canvas.height = Math.round(area.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("ছবি প্রসেস হয়নি"))), "image/webp", 0.88));
}

const ASPECTS: Record<string, number | undefined> = { "1:1": 1, "4:3": 4 / 3, "16:9": 16 / 9, "3:4": 3 / 4, "21:9": 21 / 9 };

type Props = {
  value?: string;
  onChange: (url: string) => void;
  /** নির্দিষ্ট অনুপাত (যেমন 16/9) — সব ছবি একই সাইজে থাকবে */
  aspect?: number;
  folder?: string;
  maxWidth?: number;
  label?: string;
  className?: string;
  rounded?: boolean;
  allowUrl?: boolean;
};

export default function ImageUpload({ value, onChange, aspect = 16 / 9, folder = "general", maxWidth = 1600, label = "ছবি আপলোড", className, rounded, allowUrl = true }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState<number>(aspect);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState("");

  const onFile = (f?: File) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) return toast.error("শুধু JPG, PNG, WEBP ছবি দিন");
    if (f.size > 10 * 1024 * 1024) return toast.error("ছবি ১০MB এর বেশি হতে পারবে না");
    const r = new FileReader();
    r.onload = () => {
      setSrc(String(r.result));
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setRatio(aspect);
    };
    r.readAsDataURL(f);
  };

  const onCropComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const save = async () => {
    if (!area) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(src, area, maxWidth);
      const uploaded = await uploadImage(blob, folder);
      onChange(uploaded);
      setSrc("");
      toast.success("ছবি আপলোড হয়েছে");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <div
        className={cn(
          "group relative flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 transition hover:border-brand",
          rounded ? "h-28 w-28 rounded-full" : "w-full rounded-xl",
        )}
        style={rounded ? undefined : { aspectRatio: String(aspect) }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
              <button type="button" className="btn-sm btn bg-white text-ink" onClick={() => fileRef.current?.click()}>
                <Crop className="h-4 w-4" /> বদলান
              </button>
              <button type="button" className="btn-sm btn bg-red-600 text-white" onClick={() => onChange("")}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} className="flex h-full min-h-[7rem] w-full flex-col items-center justify-center gap-1 p-3 text-ink-muted">
            <ImagePlus className="h-7 w-7" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      {allowUrl && !rounded && (
        <div className="mt-1.5">
          {urlMode ? (
            <div className="flex gap-2">
              <input className="input py-1.5 text-xs" placeholder="https://... ছবির লিংক" value={url} onChange={(e) => setUrl(e.target.value)} />
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => {
                  if (!/^https:\/\//.test(url) && !url.startsWith("/images/")) return toast.error("https:// দিয়ে শুরু হওয়া লিংক দিন");
                  onChange(url);
                  setUrlMode(false);
                  setUrl("");
                }}
              >
                ঠিক আছে
              </button>
            </div>
          ) : (
            <button type="button" className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand-700" onClick={() => setUrlMode(true)}>
              <Link2 className="h-3 w-3" /> লিংক দিয়ে যোগ করুন
            </button>
          )}
        </div>
      )}

      <Modal
        open={!!src}
        onClose={() => !busy && setSrc("")}
        title="ছবি ক্রপ করুন"
        size="lg"
        footer={
          <>
            <button className="btn-outline" onClick={() => setSrc("")} disabled={busy}>
              বাতিল
            </button>
            <button className="btn-primary" onClick={save} disabled={busy}>
              {busy && <Spinner className="h-4 w-4 text-white" />} ক্রপ করে আপলোড
            </button>
          </>
        }
      >
        <div className="relative h-[55vh] w-full overflow-hidden rounded-xl bg-gray-900">
          {src && <Cropper image={src} crop={crop} zoom={zoom} aspect={ratio} cropShape={rounded ? "round" : "rect"} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex flex-1 items-center gap-3 text-sm">
            জুম
            <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="flex-1 accent-brand" />
          </label>
          {!rounded && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(ASPECTS).map(([k, v]) => (
                <button key={k} type="button" className={cn("btn-sm btn border", Math.abs((v || 0) - ratio) < 0.01 ? "border-brand bg-brand-50 text-brand-700" : "border-gray-200")} onClick={() => setRatio(v!)}>
                  {k}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-ink-muted">টিপস: সব ছবি একই মাপে রাখতে প্রস্তাবিত অনুপাত ব্যবহার করুন।</p>
      </Modal>
    </div>
  );
}
