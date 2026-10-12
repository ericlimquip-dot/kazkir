// Shrinks photos in the browser before upload so the free 1 GB storage lasts.
// Vouchers stay readable: 1600 px on the long side is plenty for a QR code or booking number.

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
const TARGET_BYTES = 300 * 1024;
const MAX_EDGE = 1600;

export type PreparedFile = { blob: Blob; mime: string; ext: string };

export type PrepareError = "tooBig" | "wrongType";

export async function prepareVoucher(file: File): Promise<PreparedFile | PrepareError> {
  if (file.type === "application/pdf") {
    return file.size <= MAX_PDF_BYTES
      ? { blob: file, mime: "application/pdf", ext: "pdf" }
      : "tooBig";
  }
  if (!IMAGE_TYPES.includes(file.type)) return "wrongType";

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // e.g. HEIC on a browser that can't decode it.
    return "wrongType";
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "wrongType";
  ctx.fillStyle = "#ffffff"; // transparent PNG screenshots would turn black in JPEG/WebP
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Step quality down until it fits; text stays legible well below 0.6.
  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    const blob = await toBlob(canvas, "image/webp", quality);
    if (blob && blob.type === "image/webp" && (blob.size <= TARGET_BYTES || quality === 0.52)) {
      return { blob, mime: "image/webp", ext: "webp" };
    }
    if (blob && blob.type !== "image/webp") {
      // Older Safari can't encode WebP: fall back to JPEG.
      const jpeg = await toBlob(canvas, "image/jpeg", quality);
      if (jpeg && (jpeg.size <= TARGET_BYTES || quality === 0.52))
        return { blob: jpeg, mime: "image/jpeg", ext: "jpg" };
    }
  }
  return "tooBig";
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
