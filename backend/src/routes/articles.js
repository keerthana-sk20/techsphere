import { Router } from "express";
import { Article } from "../models/Article.js";
import { Category } from "../models/Category.js";

const router = Router();
const publicFilter = () => ({ $or: [{ status: "published" }, { status: "scheduled", scheduledAt: { $lte: new Date() } }] });
const populate = [{ path: "category", select: "name slug" }, { path: "author", select: "name" }];

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(24, Math.max(1, Number.parseInt(req.query.limit, 10) || 9));
    const filters = [publicFilter()];
    if (req.query.category) {
      const categoryId = await categoryIdBySlug(req.query.category);
      if (!categoryId) return res.json({ articles: [], total: 0, page, pages: 1 });
      filters.push({ category: categoryId });
    }
    if (req.query.q) {
      const escaped = String(req.query.q).trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (escaped) filters.push({ $or: ["title", "excerpt", "content", "tags"].map((key) => ({ [key]: { $regex: escaped, $options: "i" } })) });
    }
    const query = { $and: filters };
    const [articles, total] = await Promise.all([
      Article.find(query).sort({ featured: -1, publishedAt: -1 }).skip((page - 1) * limit).limit(limit).populate(populate).lean(),
      Article.countDocuments(query)
    ]);
    res.json({ articles, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) { next(error); }
});

router.get("/:slug/neighbors", async (req, res, next) => {
  try {
    const current = await Article.findOne({ slug: req.params.slug, ...publicFilter() }).select("publishedAt").lean();
    if (!current) return res.status(404).json({ message: "Article not found." });
    const [previous, nextArticle] = await Promise.all([
      Article.findOne({ ...publicFilter(), publishedAt: { $lt: current.publishedAt } }).sort({ publishedAt: -1 }).select("title slug").lean(),
      Article.findOne({ ...publicFilter(), publishedAt: { $gt: current.publishedAt } }).sort({ publishedAt: 1 }).select("title slug").lean()
    ]);
    res.json({ previous, next: nextArticle });
  } catch (error) { next(error); }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug, ...publicFilter() }).populate(populate).lean();
    if (!article) return res.status(404).json({ message: "Article not found." });
    const related = await Article.find({ ...publicFilter(), category: article.category?._id, _id: { $ne: article._id } }).sort({ publishedAt: -1 }).limit(3).populate(populate).lean();
    res.json({ article, related });
  } catch (error) { next(error); }
});

async function categoryIdBySlug(slug) {
  const category = await Category.findOne({ slug }).select("_id").lean();
  return category?._id || null;
}

export default router;
