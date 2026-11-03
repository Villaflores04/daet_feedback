/** Native share sheet where available, otherwise copy the link. */
export async function shareLink(url: string, title: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (navigator.share) { await navigator.share({ title, url }); return "shared"; }
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch { return "failed"; }
}
