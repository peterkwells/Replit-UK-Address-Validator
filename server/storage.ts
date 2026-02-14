import { db } from "./db";
import { validations, councilTaxAddresses, pricePaidTransactions, type InsertValidation, type Validation, type CouncilTaxAddress, type PricePaidTransaction } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

export interface IStorage {
  createValidation(validation: InsertValidation & { isValid: boolean; details: any }): Promise<Validation>;
  getValidations(): Promise<Validation[]>;
  getCouncilTaxAddresses(postcode: string): Promise<CouncilTaxAddress[]>;
  getCouncilTaxCount(): Promise<number>;
  getPricePaidByPostcode(postcode: string): Promise<PricePaidTransaction[]>;
}

export class DatabaseStorage implements IStorage {
  async createValidation(validation: InsertValidation & { isValid: boolean; details: any }): Promise<Validation> {
    const [record] = await db
      .insert(validations)
      .values({
        line1: validation.line1 || null,
        line2: validation.line2 || null,
        town: validation.town || null,
        postcode: validation.postcode,
        isValid: !!validation.isValid,
        details: validation.details,
      })
      .returning();
    return record;
  }

  async getValidations(): Promise<Validation[]> {
    return await db
      .select()
      .from(validations)
      .orderBy(desc(validations.createdAt))
      .limit(50);
  }

  async getCouncilTaxAddresses(postcode: string): Promise<CouncilTaxAddress[]> {
    const normalized = postcode.toUpperCase().replace(/\s+/g, ' ').trim();
    return await db
      .select()
      .from(councilTaxAddresses)
      .where(eq(councilTaxAddresses.postcode, normalized));
  }

  async getCouncilTaxCount(): Promise<number> {
    const result = await db.select().from(councilTaxAddresses).limit(1);
    return result.length;
  }

  async getPricePaidByPostcode(postcode: string): Promise<PricePaidTransaction[]> {
    const normalized = postcode.toUpperCase().replace(/\s+/g, ' ').trim();
    return await db
      .select()
      .from(pricePaidTransactions)
      .where(eq(pricePaidTransactions.postcode, normalized));
  }
}

export const storage = new DatabaseStorage();
