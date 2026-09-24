import { toPng } from "html-to-image";
import { saveFile } from "@/lib/download";

export interface ExportImageOptions {
  /** background color behind transparent areas; defaults to the card background token */
  backgroundColor?: string;
  pixelRatio?: number;
}

/**
 * Snapshots a DOM node \u2014 pass a ref to a <ChartCard>'s wrapping element,
 * or to a whole dashboard container \u2014 and downloads it as a PNG. Useful
 * for "copy this chart into a slide deck" style workflows.
 */
export async function exportNodeToPNG(node: HTMLElement, filename: string, options: ExportImageOptions = {}) {
  const dataUrl = await toPng(node, {
    backgroundColor: options.backgroundColor ?? "#ffffff",
    pixelRatio: options.pixelRatio ?? 2,
    cacheBust: true,
  });
  const blob = await (await fetch(dataUrl)).blob();
  await saveFile(filename.endsWith(".png") ? filename : `${filename}.png`, blob);
}
