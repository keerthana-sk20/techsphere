import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import articleRoutes from "./routes/articles.js";
import adminRoutes from "./routes/admin.js";
import categoryRoutes from "./routes/categories.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { Category } from "./models/Category.js";
import { Article } from "./models/Article.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error("JWT_SECRET must be at least 32 characters in production.");
}
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",").map((origin) => origin.trim()) || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads"), { maxAge: "7d", immutable: true }));
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.get("/robots.txt", (_req, res) => {
  const siteUrl = (process.env.SITE_URL || "http://localhost:5173").replace(/\/$/, "");
  res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${siteUrl}/sitemap.xml\n`);
});
app.get("/sitemap.xml", async (_req, res, next) => {
  try {
    const siteUrl = (process.env.SITE_URL || "http://localhost:5173").replace(/\/$/, "");
    const articles = await Article.find({ $or: [{ status: "published" }, { status: "scheduled", scheduledAt: { $lte: new Date() } }] }).select("slug updatedAt").lean();
    const urls = [`${siteUrl}/`, `${siteUrl}/blog`, ...articles.map((article) => `${siteUrl}/blog/${encodeURIComponent(article.slug)}`)];
    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escapeXml(url)}</loc></url>`).join("")}</urlset>`;
    res.type("application/xml").send(xml);
  } catch (error) { next(error); }
});
app.use(notFound);
app.use(errorHandler);

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[character]);
}

await mongoose.connect(process.env.MONGODB_URI);
await Category.ensureDefaults();
app.listen(port, () => console.log(`TechSphere API listening on port ${port}`));
