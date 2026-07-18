import app from "./app.js";
import prisma from "./config/database.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AquaFlow API running on port ${PORT}`);
});

const shutdown = async (signal) => {
  console.log(`\n${signal} received, closing Prisma connection...`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
