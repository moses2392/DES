"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { SafeImage } from "@/components/safe-image";

/**
 * Uploading photographs.
 *
 * Straight from the browser to Supabase Storage, which is why this application
 * still needs no secret key: the upload is authorised by the staff member's own
 * session against a storage policy that checks `is_staff()`. Routing the file
 * through a server action would mean the whole image travelling twice for no
 * gain in safety.
 *
 * The resulting public URLs are submitted with the form as hidden inputs, so a
 * photo that uploads but whose form is never saved leaves an orphan file rather
 * than a broken listing — the cheaper of the two failures.
 */

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function PhotoManager({ initial }: { initial: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setError("Uploads are not configured on this deployment.");
      return;
    }

    setBusy(true);
    const supabase = createBrowserClient(url, key);
    const added: string[] = [];

    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type)) {
        setError(`${file.name} is not a JPEG, PNG, WebP or AVIF.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is larger than 8MB.`);
        continue;
      }

      // Random name, original extension. Using the original filename would let
      // two properties with a photo called "front.jpg" overwrite each other.
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-photos")
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (uploadError) {
        setError(
          uploadError.message.toLowerCase().includes("policy")
            ? "Your account is not allowed to upload photographs."
            : `Could not upload ${file.name}.`
        );
        continue;
      }

      const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
      added.push(data.publicUrl);
    }

    setUrls((current) => [...current, ...added]);
    setBusy(false);
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= urls.length) return;
    setUrls((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  return (
    <div>
      {urls.map((u) => (
        <input key={u} type="hidden" name="images" value={u} />
      ))}

      {urls.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {urls.map((u, i) => (
            <li key={u} className="overflow-hidden rounded-[--radius] border border-line">
              <div className="relative aspect-[4/3] bg-surface-2">
                <SafeImage src={u} alt="" sizes="200px" className="object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                    Main photo
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 px-2 py-1.5 text-xs">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    className="px-1 text-muted hover:text-brand disabled:opacity-30"
                    aria-label="Move earlier"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === urls.length - 1}
                    className="px-1 text-muted hover:text-brand disabled:opacity-30"
                    aria-label="Move later"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setUrls((c) => c.filter((x) => x !== u))}
                  className="text-muted hover:text-danger"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className="btn btn-quiet cursor-pointer">
        {busy ? "Uploading…" : urls.length ? "Add more photos" : "Upload photos"}
        <input
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          disabled={busy}
          onChange={(e) => {
            void upload(e.target.files);
            e.target.value = "";
          }}
          className="sr-only"
        />
      </label>

      <p className="mt-2 text-xs text-muted">
        The first photo is the one shown in search results. Drag order with the arrows.
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
