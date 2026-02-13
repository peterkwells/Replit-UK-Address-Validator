import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post(api.validations.create.path, async (req, res) => {
    try {
      const input = api.validations.create.input.parse(req.body);
      
      // Call postcodes.io
      const cleanPostcode = input.postcode.replace(/\s/g, '');
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      const data = await response.json();
      
      const isValid = response.status === 200 && data.status === 200 && data.result;
      
      const record = await storage.createValidation({
        ...input,
        isValid,
        details: isValid ? data.result : { error: "Invalid Postcode" },
      });
      
      res.json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      // Handle other errors gracefully
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.validations.list.path, async (req, res) => {
    const records = await storage.getValidations();
    res.json(records);
  });

  // Seed data if empty
  const existing = await storage.getValidations();
  if (existing.length === 0) {
    await storage.createValidation({
      line1: "Buckingham Palace",
      line2: "Westminster",
      town: "London",
      postcode: "SW1A 1AA",
      isValid: true,
      details: { country: "England", region: "London", admin_district: "Westminster" }
    });
    
    await storage.createValidation({
      line1: "Invalid Place",
      town: "Nowhere",
      postcode: "XX1 1XX",
      isValid: false,
      details: { error: "Invalid Postcode" }
    });
  }

  return httpServer;
}
