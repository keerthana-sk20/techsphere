import mongoose from "mongoose";
import slugify from "../utils/slugify.js";

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  excerpt: { type: String, required: true, trim: true, maxlength: 320 },
  content: { type: String, required: true, minlength: 1 },
  featuredImage: { type: String, default: "" },
  imageAlt: { type: String, trim: true, maxlength: 180, default: "" },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  tags: [{ type: String, trim: true, maxlength: 30 }],
  status: { type: String, enum: ["draft", "published", "scheduled"], default: "draft" },
  featured: { type: Boolean, default: false },
  scheduledAt: { type: Date, default: null },
  publishedAt: { type: Date, default: null },
  readingTime: { type: Number, default: 1, min: 1 },
  seoTitle: { type: String, trim: true, maxlength: 70, default: "" },
  seoDescription: { type: String, trim: true, maxlength: 180, default: "" }
}, { timestamps: true });

articleSchema.pre("validate", function prepareArticle() {
  if (this.title) this.slug = slugify(this.title);
  if (this.content) this.readingTime = Math.max(1, Math.ceil(this.content.trim().split(/\s+/).length / 200));
  if (this.status === "published" && (!this.publishedAt || this.isModified("status"))) this.publishedAt = new Date();
  if (this.status === "scheduled") {
    if (!this.scheduledAt) this.invalidate("scheduledAt", "A publication date is required for scheduled articles.");
    else this.publishedAt = this.scheduledAt;
  }
  if (this.status === "draft") this.publishedAt = null;
  if (this.status !== "scheduled") this.scheduledAt = null;
});

articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ title: "text", excerpt: "text", content: "text" });

export const Article = mongoose.model("Article", articleSchema);
