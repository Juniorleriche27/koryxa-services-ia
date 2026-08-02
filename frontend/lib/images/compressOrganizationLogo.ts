const MAX_SOURCE_BYTES = 30 * 1024 * 1024;
const TARGET_BYTES = 1024 * 1024;
const MAX_DIMENSION = 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function compressOrganizationLogo(file: File): Promise<File> {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Choisissez une image PNG, JPEG ou WebP.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("L’image d’origine ne doit pas dépasser 30 Mo.");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) { bitmap.close(); throw new Error("Impossible de préparer cette image."); }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.88;
  let blob = await toBlob(canvas, quality);
  while (blob.size > TARGET_BYTES && quality > 0.5) {
    quality -= 0.08;
    blob = await toBlob(canvas, quality);
  }
  if (blob.size > 3 * 1024 * 1024) throw new Error("L’image n’a pas pu être suffisamment optimisée.");
  return new File([blob], "logo.webp", { type: "image/webp", lastModified: Date.now() });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error("La conversion du logo a échoué.")),
    "image/webp",
    quality,
  ));
}
