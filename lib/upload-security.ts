const CLOUDINARY_HOST = "res.cloudinary.com";

export function isTrustedCloudinaryUrl(value: unknown): boolean {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
  if (!cloudName) return false;

  try {
    const url = new URL(String(value ?? ""));
    return (
      url.protocol === "https:" &&
      url.hostname === CLOUDINARY_HOST &&
      url.pathname.startsWith(`/${encodeURIComponent(cloudName)}/`)
    );
  } catch {
    return false;
  }
}
