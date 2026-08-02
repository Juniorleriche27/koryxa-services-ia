import { serviceIaFetch } from "@/lib/service-ia/api";

const MAX_SOURCE_BYTES = 100 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type UploadAuthorization = { upload_url: string; token: string; expires_at: string };

export async function prepareDocumentUpload(file: File): Promise<File> {
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Le fichier d’origine ne doit pas dépasser 100 Mo.");
  if (!IMAGE_TYPES.has(file.type)) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    bitmap.close();
    throw new Error("Impossible d’optimiser cette image.");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
    value => value ? resolve(value) : reject(new Error("La compression de l’image a échoué.")),
    "image/webp",
    0.82,
  ));
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export async function directUpload<T>(
  kind: "import" | "attachment",
  registerType: string,
  file: File,
  recordId?: string,
): Promise<T> {
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Le fichier ne doit pas dépasser 100 Mo.");
  const authorization = await serviceIaFetch<UploadAuthorization>("/direct-uploads/authorize", {
    method: "POST",
    body: JSON.stringify({ kind, register_type: registerType, record_id: recordId || null }),
  });
  const body = new FormData();
  body.set("token", authorization.token);
  body.set("file", file);
  const response = await fetch(authorization.upload_url, { method: "POST", body });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || "Le téléversement direct a échoué.");
  }
  return response.json() as Promise<T>;
}
