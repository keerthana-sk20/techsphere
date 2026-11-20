import { Router } from "express";
import { Article } from "../models/Article.js";
import { Category } from "../models/Category.js";
import { requireAuth, requireEditor, requireAdmin } from "../middleware/auth.js";
import { imageUpload } from "../middleware/upload.js";
import { optimizeImage } from "../utils/optimizeImage.js";
import { User } from "../models/User.js";

const router = Router();
const populate = [{ path: "category", select: "name slug" }, { path: "author", select: "name" }];
router.use(requireAuth, requireEditor);

router.get("/stats", async (_req, res, next) => {
  try {
    const [total, published, drafts, scheduled] = await Promise.all([
      Article.countDocuments(), Article.countDocuments({ status: "published" }), Article.countDocuments({ status: "draft" }), Article.countDocuments({ status: "scheduled" })
    ]);
    res.json({ stats: { total, published, drafts, scheduled } });
  } catch (error) { next(error); }
});

router.get("/articles", async (req, res, next) => {
  try {
    const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const articles = await Article.find().sort({ updatedAt: -1 }).limit(limit).populate(populate).lean();
    res.json({ articles });
  } catch (error) { next(error); }
});

router.post("/media", imageUpload, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Choose an image to upload." });
    const url = await optimizeImage(req.file);
    res.status(201).json({ url });
  } catch (error) { next(error); }
});

router.post("/articles", imageUpload, async (req, res, next) => {
  try {
    const values = parseArticle(req.body);
    if (req.file) values.featuredImage = await optimizeImage(req.file);
    values.author = req.user._id;
    const article = await Article.create(values);
    await article.populate(populate);
    res.status(201).json({ article });
  } catch (error) { next(error); }
});

router.put("/articles/:id", imageUpload, async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found." });
    const values = parseArticle(req.body, true);
    if (req.file) values.featuredImage = await optimizeImage(req.file);
    for (const [key, value] of Object.entries(values)) article[key] = value;
    await article.save();
    await article.populate(populate);
    res.json({ article });
  } catch (error) { next(error); }
});

router.delete("/articles/:id", async (req, res, next) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found." });
    res.json({ message: "Article deleted." });
  } catch (error) { next(error); }
});

router.get("/categories", async (_req, res, next) => {
  try { res.json({ categories: await Category.find().sort({ name: 1 }).lean() }); }
  catch (error) { next(error); }
});

router.get("/authors", requireAdmin, async (_req, res, next) => {
  try {
    const authors = await User.find().select("name email role createdAt").sort({ name: 1 }).lean();
    res.json({ authors });
  } catch (error) { next(error); }
});

router.post("/authors", requireAdmin, async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) {
      return res.status(400).json({ message: "Enter a valid name, email, and password with at least 10 characters." });
    }
    const author = await User.create({ name, email, password, role: "editor" });
    res.status(201).json({ author: { id: author.id, name: author.name, email: author.email, role: author.role } });
  } catch (error) { next(error); }
});

router.put("/authors/:id", requireAdmin, async (req, res, next) => {
  try {
    const author = await User.findById(req.params.id);
    if (!author) return res.status(404).json({ message: "Author not found." });
    const name = String(req.body.name ?? author.name).trim();
    const email = String(req.body.email ?? author.email).trim().toLowerCase();
    const password = req.body.password ? String(req.body.password) : "";
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (password && password.length < 10)) {
      return res.status(400).json({ message: "Enter a valid name, email, and (if changing it) a password with at least 10 characters." });
    }
    author.name = name;
    author.email = email;
    if (password) author.password = password;
    await author.save();
    res.json({ author: { id: author.id, name: author.name, email: author.email, role: author.role } });
  } catch (error) { next(error); }
});

router.delete("/authors/:id", requireAdmin, async (req, res, next) => {
  try {
    const author = await User.findById(req.params.id);
    if (!author) return res.status(404).json({ message: "Author not found." });
    if (author.role === "admin") return res.status(409).json({ message: "Administrator accounts cannot be deleted here." });
    if (await Article.exists({ author: author._id })) return res.status(409).json({ message: "Reassign this author’s articles before deleting the account." });
    await author.deleteOne();
    res.json({ message: "Author deleted." });
  } catch (error) { next(error); }
});

router.post("/categories", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (name.length < 2) return res.status(400).json({ message: "Category name must contain at least 2 characters." });
    await Category.create({ name });
    res.status(201).json({ categories: await Category.find().sort({ name: 1 }).lean() });
  } catch (error) { next(error); }
});

router.put("/categories/:id", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (name.length < 2) return res.status(400).json({ message: "Category name must contain at least 2 characters." });
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found." });
    category.name = name;
    await category.save();
    res.json({ categories: await Category.find().sort({ name: 1 }).lean() });
  } catch (error) { next(error); }
});

router.delete("/categories/:id", async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found." });
    if (await Article.exists({ category: category._id })) return res.status(409).json({ message: "Move or delete articles in this category before deleting it." });
    await category.deleteOne();
    res.json({ categories: await Category.find().sort({ name: 1 }).lean() });
  } catch (error) { next(error); }
});

function parseArticle(body, partial = false) {
  const values = {};
  const textFields = ["title", "excerpt", "content", "category", "status", "seoTitle", "seoDescription", "imageAlt"];
  for (const field of textFields) {
    if (body[field] !== undefined) values[field] = String(body[field]).trim();
    else if (!partial && ["title", "excerpt", "content", "category"].includes(field)) values[field] = "";
  }
  if (body.tags !== undefined) values.tags = Array.isArray(body.tags) ? body.tags : String(body.tags).split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
  if (body.featured !== undefined) {
    if (typeof body.featured === "boolean") values.featured = body.featured;
    else if (body.featured === "true" || body.featured === "false") values.featured = body.featured === "true";
    else throw new Error("Featured must be true or false.");
  }
  if (body.scheduledAt !== undefined) {
    const date = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (body.scheduledAt && Number.isNaN(date.getTime())) throw new Error("Scheduled publication date is invalid.");
    values.scheduledAt = date;
  }
  if (values.status === "scheduled" && !values.scheduledAt) throw new Error("Choose a publication date and time for scheduled articles.");
  return values;
}

export default router;
