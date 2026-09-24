import { saveFile } from "@/lib/download";

/**
 * PDF export deliberately does not ship a PDF-generation library (jsPDF,
 * pdf-lib, etc) as a normal dependency \u2014 that's real weight to add to
 * every consuming app's bundle for a feature most dashboards use rarely.
 * The default path here opens a print-styled popup of the given node and
 * calls window.print(), which every browser can turn into a PDF via
 * "Save as PDF" in the print dialog.
 *
 * That popup approach doesn't work everywhere, though: rendered inside a
 * published Claude artifact, window.open() is blocked by the sandbox and
 * a plain download is inert by platform policy (see saveFile's doc
 * comment). In that specific environment \u2014 detected via the presence of
 * `window.claude.use` \u2014 this instead lazy-loads jsPDF (a dynamic
 * import, so it's only ever fetched/bundled when this exact branch runs;
 * a normal consuming app never pulls it in) to build a real one-page PDF
 * from a snapshot of the node, then hands it to the platform's downloads
 * capability. If that whole path fails for any reason, it falls back to
 * the print popup, same as everywhere else.
 */
export async function exportNodeToPDF(node: HTMLElement, title = "Report") {
  const claudeApi = (globalThis as { claude?: { use?: (name: string) => Promise<unknown> } }).claude;
  if (claudeApi?.use) {
    const downloads = (await claudeApi.use("downloads").catch(() => null)) as
      | { save(req: { filename: string; data: Blob }): Promise<{ status: string }> }
      | null;
    if (downloads) {
      try {
        const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
        const dataUrl = await toPng(node, { backgroundColor: "#ffffff", pixelRatio: 2, cacheBust: true });
        const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = reject;
          img.src = dataUrl;
        });
        const pdf = new jsPDF({
          orientation: width > height ? "landscape" : "portrait",
          unit: "px",
          format: [width, height],
        });
        pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
        const blob = pdf.output("blob");
        await saveFile(`${title}.pdf`, blob);
        return;
      } catch (err) {
        console.warn("bi-report-kit: PDF export via the downloads capability failed, falling back to the print dialog", err);
      }
    }
  }

  const printWindow = window.open("", "_blank", "width=1024,height=768");
  if (!printWindow) {
    console.warn("bi-report-kit: couldn't open print window \u2014 check your popup blocker.");
    return;
  }

  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch {
        return "";
      }
    })
    .join("\n");

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>${styles}</style>
        <style>
          body { margin: 24px; background: #fff !important; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>${node.outerHTML}</body>
    </html>
  `);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
