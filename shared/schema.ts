import { pgTable, text, serial, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const validations = pgTable("validations", {
  id: serial("id").primaryKey(),
  line1: text("line1"),
  line2: text("line2"),
  town: text("town"),
  postcode: text("postcode").notNull(),
  isValid: boolean("is_valid").notNull(),
  details: jsonb("details"), // Store API response or error info
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertValidationSchema = createInsertSchema(validations).pick({
  line1: true,
  line2: true,
  town: true,
  postcode: true,
});

export type Validation = typeof validations.$inferSelect;
export type InsertValidation = z.infer<typeof insertValidationSchema>;
