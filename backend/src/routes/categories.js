import { Router } from "express";
import { Category } from "../models/Category.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json({ categories });
  } catch (error) { next(error); }
});

export default router;
