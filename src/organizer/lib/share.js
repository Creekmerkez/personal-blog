/** Hands the file to the iOS share sheet (Save to Files, Google Drive…), or downloads it. */
export async function saveFile(text, name, type = 'application/json') {
  const file = new File([text], name, { type });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
    return;
  }
  const url = URL.createObjectURL(file);
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
