import "dotenv/config";
import mongoose from "mongoose";
import { User } from "./models/User.js";
import { Category } from "./models/Category.js";

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_NAME) throw new Error("ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set.");
if (process.env.ADMIN_PASSWORD.length < 10) throw new Error("ADMIN_PASSWORD must contain at least 10 characters.");

await mongoose.connect(process.env.MONGODB_URI);
await Category.ensureDefaults();
const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
const existing = await User.findOne({ email });
if (existing) {
  console.log(`Admin account ${email} already exists; no changes made.`);
} else {
  await User.create({ name: process.env.ADMIN_NAME, email, password: process.env.ADMIN_PASSWORD, role: "admin" });
  console.log(`Created admin account ${email}.`);
}
await mongoose.disconnect();
