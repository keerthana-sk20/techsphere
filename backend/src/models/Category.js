import mongoose from "mongoose";
import slugify from "../utils/slugify.js";

const defaults = [
  "Software Development",
  "Artificial Intelligence & Machine Learning",
  "Web and Mobile App Development",
  "Technology & Innovation",
  "Cybersecurity",
  "Cloud Computing",
  "Industry Insights"
];

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  slug: { type: String, required: true, unique: true, lowercase: true }
}, { timestamps: true });

categorySchema.pre("validate", function createSlug() {
  if (this.name) this.slug = slugify(this.name);
});

categorySchema.statics.ensureDefaults = async function ensureDefaults() {
  for (const name of defaults) await this.updateOne({ slug: slugify(name) }, { $setOnInsert: { name, slug: slugify(name) } }, { upsert: true });
};

export const Category = mongoose.model("Category", categorySchema);
