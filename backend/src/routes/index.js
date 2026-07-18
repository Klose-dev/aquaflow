import express from "express";

import authRoutes from "./auth.routes.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

router.get("/test", (req, res) => {
  res.json({ message: "AquaFlow API is running" });
});

router.use("/auth", authRoutes);

export default router;
