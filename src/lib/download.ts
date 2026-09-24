export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Saves a file to the viewer, working in two very different environments
 * with one call:
 *  - A normal web app (Next.js/React, anywhere outside claude.ai): no
 *    `window.claude` exists, so this is just downloadBlob \u2014 a standard
 *    browser download.
 *  - This package's own components rendered inside a published Claude
 *    artifact: a plain <a download> click is inert there by platform
 *    policy (the page runs in a sandboxed context with no direct
 *    filesystem/download access), so a real save has to go through the
 *    platform's `downloads` capability (`window.claude.use("downloads")`),
 *    which prompts the viewer to confirm and save the file.
 * The `window.claude` feature-detect means this costs nothing and does
 * nothing extra for every normal consuming app \u2014 the check is `false`
 * and it falls straight through to the standard download.
 */
export async function saveFile(filename: string, blob: Blob): Promise<void> {
  const claudeApi = (globalThis as { claude?: { use?: (name: string) => Promise<unknown> } }).claude;
  if (claudeApi?.use) {
    try {
      const downloads = (await claudeApi.use("downloads")) as
        | { save(req: { filename: string; data: Blob }): Promise<{ status: string }> }
        | null;
      if (downloads) {
        await downloads.save({ filename, data: blob });
        return;
      }
    } catch {
      // capability unavailable/declined/errored \u2014 fall through to a normal download
    }
  }
  downloadBlob(blob, filename);
}
