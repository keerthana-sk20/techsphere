import sharp from "sharp";
import { unlink } from "node:fs/promises";
import path from "node:path";

const supportedFormats = new Set(["jpeg", "png", "webp", "gif"]);

export async function optimizeImage(file) {
  if (!file) return "";
  const outputPath = path.join(path.dirname(file.path), `${path.parse(file.filename).name}-optimized.webp`);
  try {
    const image = sharp(file.path, { limitInputPixels: 40_000_000, animated: false });
    const metadata = await image.metadata();
    if (!supportedFormats.has(metadata.format)) throw new Error("Uploaded file is not a supported image.");
    await image.rotate().resize({ width: 1920, height: 1280, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(outputPath);
    await unlink(file.path);
    return `/uploads/${path.basename(outputPath)}`;
  } catch (error) {
    await unlink(file.path).catch(() => {});
    await unlink(outputPath).catch(() => {});
    if (error.message === "Uploaded file is not a supported image.") throw Object.assign(error, { status: 400 });
    throw Object.assign(new Error("Uploaded image could not be decoded."), { status: 400, cause: error });
  }
}
