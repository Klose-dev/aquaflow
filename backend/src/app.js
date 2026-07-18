import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import apiRoutes from "./routes/index.js";
import errorMiddleware from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorMiddleware);

export default app;
