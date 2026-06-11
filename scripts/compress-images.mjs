import sharp from "sharp";
import { readdir, mkdir } from "fs/promises";
import { join, extname, basename } from "path";

const INPUT_DIR = new URL("../public", import.meta.url).pathname;
const OUTPUT_DIR = new URL("../public/web", import.meta.url).pathname;

const HERO_FILES = [
  "AL1.jpg",
  "AL3.jpg",
  "AL4.jpg",
  "AL5.jpg",
  "AL7.jpg",
  "Chilliwack River Plein Air.jpg",
  "DSC00474_edited.jpg",
  "DSC00475.JPG",
  "DSC09878.JPG",
  "IMG_E5163.JPG",
  "Screenshot 2026-02-05 181600.png",
];

await mkdir(OUTPUT_DIR, { recursive: true });

let totalBefore = 0;
let totalAfter = 0;

for (const file of HERO_FILES) {
  const inputPath = join(INPUT_DIR, file);
  const ext = extname(file).toLowerCase();
  const base = basename(file, extname(file));
  const outputPath = join(OUTPUT_DIR, base + ".jpg");

  try {
    const { size: sizeBefore } = await import("fs").then(fs =>
      fs.promises.stat(inputPath)
    );

    await sharp(inputPath)
      .resize({ width: 1920, height: 1080, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(outputPath);

    const { size: sizeAfter } = await import("fs").then(fs =>
      fs.promises.stat(outputPath)
    );

    const reduction = ((1 - sizeAfter / sizeBefore) * 100).toFixed(0);
    console.log(
      `${file}: ${(sizeBefore / 1024 / 1024).toFixed(1)}MB → ${(sizeAfter / 1024).toFixed(0)}KB (${reduction}% smaller)`
    );
    totalBefore += sizeBefore;
    totalAfter += sizeAfter;
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
}

console.log(
  `\nTotal: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB`
);
