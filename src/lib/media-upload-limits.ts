export const MAX_IMAGE_UPLOAD_BYTES = 300 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 1024 * 1024;

export function isVideoFile(file: Pick<File, "type">): boolean {
  return file.type.startsWith("video/");
}

export function isImageFile(file: Pick<File, "type">): boolean {
  return file.type.startsWith("image/");
}

type MediaUploadValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateMediaUpload(
  file: File,
  options?: { imagesOnly?: boolean }
): MediaUploadValidationResult {
  if (options?.imagesOnly) {
    if (!isImageFile(file)) {
      return { ok: false, message: "Please choose an image file (max 300KB)." };
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      return { ok: false, message: "Image is too large. Maximum size is 300KB." };
    }
    return { ok: true };
  }

  const video = isVideoFile(file);
  const image = isImageFile(file);

  if (!video && !image) {
    return { ok: false, message: "Please choose an image or video file." };
  }

  if (video) {
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      return { ok: false, message: "Video is too large. Maximum size is 1MB." };
    }
    return { ok: true };
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return { ok: false, message: "Image is too large. Maximum size is 300KB." };
  }

  return { ok: true };
}
