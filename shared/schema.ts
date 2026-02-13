import { pgTable, text, serial, boolean, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const councilTaxAddresses = pgTable("council_tax_addresses", {
  id: serial("id").primaryKey(),
  council: text("council").notNull(),
  addr1: text("addr1"),
  addr2: text("addr2"),
  addr3: text("addr3"),
  addr4: text("addr4"),
  addr5: text("addr5"),
  postcode: text("postcode").notNull(),
  uprn: text("uprn"),
}, (table) => [
  index("idx_ct_postcode").on(table.postcode),
]);

export type CouncilTaxAddress = typeof councilTaxAddresses.$inferSelect;

export const validations = pgTable("validations", {
  id: serial("id").primaryKey(),
  line1: text("line1"),
  line2: text("line2"),
  town: text("town"),
  postcode: text("postcode").notNull(),
  isValid: boolean("is_valid").notNull(),
  details: jsonb("details"), // Store API response or error info
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertValidationSchema = createInsertSchema(validations).pick({
  line1: true,
  line2: true,
  town: true,
  postcode: true,
});

export type Validation = typeof validations.$inferSelect;
export type InsertValidation = z.infer<typeof insertValidationSchema>;
