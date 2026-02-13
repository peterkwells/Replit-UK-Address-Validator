import { db } from "./db";
import { validations, type InsertValidation, type Validation } from "@shared/schema";
import { desc } from "drizzle-orm";

export interface IStorage {
  createValidation(validation: InsertValidation & { isValid: boolean; details: any }): Promise<Validation>;
  getValidations(): Promise<Validation[]>;
}

export class DatabaseStorage implements IStorage {
  async createValidation(validation: InsertValidation & { isValid: boolean; details: any }): Promise<Validation> {
    const [record] = await db
      .insert(validations)
      .values(validation)
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
}

export const storage = new DatabaseStorage();
