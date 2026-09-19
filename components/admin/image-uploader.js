"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 12;

/**
 * Uploads through /api/admin/upload and manages ordering, alt text and the
 * cover pick.
 *
 * Removing an image here only drops it from form state — the file is not
 * unlinked. Upload names are content-hashed, so the same photo attached to
 * another animal is the same file on disk; the save route decides what is
 * actually safe to delete (lib/media.js).
 */
export default function ImageUploader({
  value = [],
  onChange,
  coverIndex = 0,
  onCoverChange,
  folder = "animals",
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState([]);

  async function upload(fileList) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0 || busy) return;

    const room = MAX_IMAGES - value.length;
    if (room <= 0) {
      setErrors([{ name: "", error: `সর্বোচ্চ ${MAX_IMAGES}টি ছবি দেওয়া যাবে` }]);
      return;
    }

    setBusy(true);
    setErrors([]);

    const form = new FormData();
    form.set("folder", folder);
    for (const file of files.slice(0, room)) form.append("files", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));

      if (data.files?.length) onChange([...value, ...data.files]);

      // Partial success is normal: a HEIC from an iPhone fails while the rest
      // succeed. Show what failed without discarding what worked.
      if (data.errors?.length) setErrors(data.errors);
      else if (!res.ok || !data.ok) {
        setErrors([{ name: "", error: data.error || "আপলোড ব্যর্থ হয়েছে" }]);
      }
    } catch {
      setErrors([{ name: "", error: "সার্ভারের সাথে সংযোগ করা যায়নি" }]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(from, to) {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);

    // Keep the cover pointing at the same photo after a reorder.
    if (coverIndex === from) onCoverChange(to);
    else if (from < coverIndex && to >= coverIndex) onCoverChange(coverIndex - 1);
    else if (from > coverIndex && to <= coverIndex) onCoverChange(coverIndex + 1);
  }

  function remove(index) {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
    if (coverIndex === index) onCoverChange(0);
    else if (index < coverIndex) onCoverChange(Math.max(0, coverIndex - 1));
  }

  function setAlt(index, alt) {
    onChange(value.map((img, i) => (i === index ? { ...img, alt } : img)));
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-brand bg-brand-wash" : "border-line-strong bg-linen"
        )}
      >
        {busy ? (
          <LoaderCircle
            size={20}
            className="animate-spin text-ink-mute"
            aria-hidden
          />
        ) : (
          <ImagePlus size={20} strokeWidth={1.5} className="text-ink-mute" aria-hidden />
        )}
        <p className="mt-3 text-sm text-ink-soft">
          ছবি টেনে এনে ছাড়ুন, অথবা{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-medium text-brand underline underline-offset-2"
          >
            বেছে নিন
          </button>
        </p>
        <p className="mt-1.5 text-xs text-ink-mute">
          JPEG, PNG, WebP বা AVIF · সর্বোচ্চ {MAX_IMAGES}টি · আপলোডের সময়
          স্বয়ংক্রিয়ভাবে WebP-তে রূপান্তর হবে
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      {errors.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {errors.map((err, i) => (
            <li
              key={`${err.name}-${i}`}
              className="rounded-sm border border-[#d9b6aa] bg-[#f7ece8] px-3 py-2 text-xs text-[#7d3220]"
            >
              {err.name ? `${err.name}: ` : ""}
              {err.error}
            </li>
          ))}
        </ul>
      ) : null}

      {value.length > 0 ? (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((img, index) => (
            <li
              key={img.path}
              className={cn(
                "overflow-hidden rounded-md border bg-paper transition-colors",
                index === coverIndex ? "border-brand" : "border-line"
              )}
            >
              <div className="frame relative aspect-4/5">
                <Image
                  src={img.path}
                  alt={img.alt || ""}
                  width={img.width || 400}
                  height={img.height || 500}
                  sizes="(min-width:1024px) 220px, 45vw"
                  placeholder={img.blur ? "blur" : "empty"}
                  blurDataURL={img.blur || undefined}
                  className="h-full w-full object-cover"
                />
                {index === coverIndex ? (
                  <span className="absolute left-1.5 top-1.5 rounded-sm bg-brand px-1.5 py-0.5 text-[11px] font-medium text-paper">
                    কভার
                  </span>
                ) : null}
              </div>

              <div className="space-y-2.5 p-3">
                <input
                  value={img.alt || ""}
                  onChange={(e) => setAlt(index, e.target.value)}
                  placeholder="ছবির বিবরণ (alt)"
                  className="pnl-input h-8 text-xs"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <IconButton
                      label="বাঁয়ে সরান"
                      onClick={() => move(index, index - 1)}
                      disabled={index === 0}
                    >
                      <ChevronLeft size={14} strokeWidth={2} aria-hidden />
                    </IconButton>
                    <IconButton
                      label="ডানে সরান"
                      onClick={() => move(index, index + 1)}
                      disabled={index === value.length - 1}
                    >
                      <ChevronRight size={14} strokeWidth={2} aria-hidden />
                    </IconButton>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton
                      label="কভার করুন"
                      onClick={() => onCoverChange(index)}
                      active={index === coverIndex}
                    >
                      <Star
                        size={14}
                        strokeWidth={2}
                        aria-hidden
                        fill={index === coverIndex ? "currentColor" : "none"}
                      />
                    </IconButton>
                    <IconButton label="সরান" onClick={() => remove(index)} danger>
                      <Trash2 size={14} strokeWidth={2} aria-hidden />
                    </IconButton>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function IconButton({ label, onClick, disabled, active, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-sm border transition-colors",
        active
          ? "border-brand bg-brand-wash text-brand"
          : "border-line-strong text-ink-mute hover:border-ink-mute hover:text-ink",
        danger && "hover:border-[#a4402a] hover:text-[#a4402a]",
        disabled &&
          "cursor-not-allowed opacity-40 hover:border-line-strong hover:text-ink-mute"
      )}
    >
      {children}
    </button>
  );
}
