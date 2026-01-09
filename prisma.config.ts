// Prisma 7 configuration file
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DATABASE_URL from environment or fallback
    url: process.env["DATABASE_URL"] ?? "postgresql://localhost:5432/qaqc_saas",
  },
});
