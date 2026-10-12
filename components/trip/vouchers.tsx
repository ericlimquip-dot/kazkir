"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { prepareVoucher } from "@/lib/files/compress";
import { createClient } from "@/lib/supabase/client";

type Attachment = {
  id: string;
  storage_path: string;
  mime: string;
  size_bytes: number;
  created_by: string | null;
};

/** Photos and PDFs attached to an item, stored privately under "<trip_id>/" in the trip-files bucket. */
export function Vouchers({
  tripId,
  itemId,
  canUpload,
  canManageAll,
}: {
  tripId: string;
  itemId: string;
  canUpload: boolean;
  canManageAll: boolean;
}) {
  const t = useTranslations("Item");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data }, { data: auth }] = await Promise.all([
      supabase
        .from("attachments")
        .select("id, storage_path, mime, size_bytes, created_by")
        .eq("item_id", itemId)
        .order("created_at"),
      supabase.auth.getUser(),
    ]);
    setFiles((data ?? []) as Attachment[]);
    setMe(auth.user?.id ?? null);
  }, [itemId]);

  useEffect(() => {
    // Fetching on open is the external sync this effect exists for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const upload = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const prepared = await prepareVoucher(file);
      if (prepared === "tooBig") return setError(t("voucherTooBig"));
      if (prepared === "wrongType") return setError(t("voucherType"));
      const supabase = createClient();
      const path = `${tripId}/${crypto.randomUUID()}.${prepared.ext}`;
      const { error: upErr } = await supabase.storage
        .from("trip-files")
        .upload(path, prepared.blob, { contentType: prepared.mime });
      if (upErr) return setError(t("errors.failed"));
      const { error: rowErr } = await supabase.from("attachments").insert({
        trip_id: tripId,
        item_id: itemId,
        storage_path: path,
        mime: prepared.mime,
        size_bytes: prepared.blob.size,
        created_by: me,
      });
      if (rowErr) {
        await supabase.storage.from("trip-files").remove([path]);
        return setError(t("errors.failed"));
      }
      await load();
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const open = async (file: Attachment) => {
    // Private bucket: short-lived link, opened in a new tab.
    const tab = window.open("", "_blank");
    const { data } = await createClient()
      .storage.from("trip-files")
      .createSignedUrl(file.storage_path, 60 * 10);
    if (data?.signedUrl && tab) tab.location.href = data.signedUrl;
    else tab?.close();
  };

  const remove = async (file: Attachment) => {
    const supabase = createClient();
    const { error: delErr } = await supabase.from("attachments").delete().eq("id", file.id);
    if (delErr) return setError(t("errors.failed"));
    await supabase.storage.from("trip-files").remove([file.storage_path]);
    await load();
  };

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[13px] font-medium text-muted">{t("vouchers")}</h3>
      {files.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {files.map((file, i) => (
            <li
              key={file.id}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-white px-3 py-2"
            >
              <span aria-hidden="true" className="text-[20px]">
                {file.mime === "application/pdf" ? "📄" : "🖼️"}
              </span>
              <span className="flex-1 text-[14px] font-medium text-ink">
                {file.mime === "application/pdf" ? "PDF" : t("photo")} {i + 1}
                <span className="text-muted-grey">
                  {" "}
                  · {Math.max(1, Math.round(file.size_bytes / 1024))} KB
                </span>
              </span>
              <Button size="sm" variant="secondary" onClick={() => open(file)}>
                {t("openVoucher")}
              </Button>
              {canManageAll || file.created_by === me ? (
                <Button size="sm" variant="ghost" onClick={() => remove(file)}>
                  {t("removeVoucher")}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {canUpload ? (
        <>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
            className="sr-only"
            id={`voucher-${itemId}`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <label
            htmlFor={`voucher-${itemId}`}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-line bg-white px-4 text-[14px] font-medium text-ink hover:bg-hover"
          >
            📎 {busy ? t("uploading") : t("addVoucher")}
          </label>
        </>
      ) : null}
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-[#a23b2a]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
