import { defineConfig } from "drizzle-kit";

if (!process.env.SQL_SERVER_HOST) {
  throw new Error("SQL_SERVER_HOST is required for database connection");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mssql",
  dbCredentials: {
    host: process.env.SQL_SERVER_HOST!,
    port: parseInt(process.env.SQL_SERVER_PORT || "1433"),
    user: process.env.SQL_SERVER_USER!,
    password: process.env.SQL_SERVER_PASSWORD!,
    database: process.env.SQL_SERVER_DATABASE!,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
});