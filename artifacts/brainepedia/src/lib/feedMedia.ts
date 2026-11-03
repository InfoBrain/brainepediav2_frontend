const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v"]);
export const COVER_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const COVER_VIDEO_MAX_BYTES = 25 * 1024 * 1024;

export function fileExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function validateCoverFile(file: File): string | null {
  const extension = fileExtension(file.name);
  const isImage = IMAGE_EXTENSIONS.has(extension);
  const isVideo = VIDEO_EXTENSIONS.has(extension);
  if (!isImage && !isVideo) {
    return "Use an image (jpg, jpeg, png, webp, gif, up to 2 MB) or a video (mp4, webm, mov, m4v, up to 25 MB).";
  }
  if (isImage && file.size > COVER_IMAGE_MAX_BYTES) return "Images must be 2 MB or smaller.";
  if (isVideo && file.size > COVER_VIDEO_MAX_BYTES) return "Videos must be 25 MB or smaller.";
  return null;
}

export function isVideoMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(url);
}

export function classifyProjectFile(file: File): { isVideo: boolean; isImage: boolean } {
  const extension = fileExtension(file.name);
  const isVideo = VIDEO_EXTENSIONS.has(extension) || file.type.startsWith("video/");
  const isImage = !isVideo && (IMAGE_EXTENSIONS.has(extension) || file.type.startsWith("image/"));
  return { isVideo, isImage };
}
