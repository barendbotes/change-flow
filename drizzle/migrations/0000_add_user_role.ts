import { pgTable, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export async function up(db) {
  await db.schema.alterTable("user").addColumn(
    "role",
    varchar("role", { enum: ["ADMIN", "USER"] })
      .notNull()
      .default("USER")
  );
}

export async function down(db) {
  await db.schema.alterTable("user").dropColumn("role");
}
