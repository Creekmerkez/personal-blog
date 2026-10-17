// Photos added from the phone are made smaller before they go into the
// journal: entries are encrypted and saved as one piece, so full-size
// camera photos (several MB each) would make every save slow.

export const MAX_PHOTO_SIDE = 1600;

/** Width and height scaled down to fit `max` on the longer side; never scaled up. */
export function fitWithin(width, height, max = MAX_PHOTO_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** A JPEG data URL of the picked image file, at most MAX_PHOTO_SIDE pixels on its longer side. */
export async function photoFromFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight);
    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    canvas.getContext('2d').drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    throw new Error(`“${file.name}” could not be read as a photo.`);
  } finally {
    URL.revokeObjectURL(url);
  }
}
