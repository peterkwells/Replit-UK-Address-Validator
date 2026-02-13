import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

function normalizeString(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchScore(userInput: string, candidate: string): number {
  const a = normalizeString(userInput);
  const b = normalizeString(candidate);
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.8;
  const aWords = a.split(' ');
  const bWords = b.split(' ');
  const matchedWords = aWords.filter(w => bWords.some(bw => bw.includes(w) || w.includes(bw)));
  return matchedWords.length / Math.max(aWords.length, 1);
}

function findBestMatch(
  userLine1: string,
  userLine2: string,
  userTown: string,
  addresses: any[]
): { matched: boolean; bestMatch: any; score: number; suggestions: string[] } {
  let bestScore = 0;
  let bestMatch: any = null;

  for (const addr of addresses) {
    const candidateLine = [addr.line_1, addr.line_2, addr.line_3].filter(Boolean).join(' ');
    const userLine = [userLine1, userLine2].filter(Boolean).join(' ');

    const lineScore = matchScore(userLine, candidateLine);
    const townScore = userTown
      ? matchScore(userTown, addr.post_town || '')
      : 0.5;

    const totalScore = (lineScore * 0.7) + (townScore * 0.3);

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMatch = addr;
    }
  }

  const suggestions = addresses
    .slice(0, 5)
    .map((a: any) => [a.line_1, a.line_2, a.post_town, a.postcode].filter(Boolean).join(', '));

  return {
    matched: bestScore >= 0.6,
    bestMatch,
    score: bestScore,
    suggestions,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.validations.create.path, async (req, res) => {
    try {
      const input = api.validations.create.input.parse(req.body);

      const apiKey = process.env.IDEAL_POSTCODES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Address lookup API key not configured" });
      }

      const cleanPostcode = input.postcode.replace(/\s/g, '');
      const lookupUrl = `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(cleanPostcode)}?api_key=${apiKey}`;
      const response = await fetch(lookupUrl);
      const data = await response.json();

      if (data.code === 4040) {
        const record = await storage.createValidation({
          line1: input.line1 || null,
          line2: input.line2 || null,
          town: input.town || null,
          postcode: input.postcode,
          isValid: false,
          details: {
            error: "Postcode not found",
            suggestions: data.suggestions || [],
          },
        });
        return res.json(record);
      }

      if (data.code !== 2000 || !data.result || data.result.length === 0) {
        const record = await storage.createValidation({
          line1: input.line1 || null,
          line2: input.line2 || null,
          town: input.town || null,
          postcode: input.postcode,
          isValid: false,
          details: { error: data.message || "Lookup failed" },
        });
        return res.json(record);
      }

      const addresses = data.result;
      const result = findBestMatch(
        input.line1 || '',
        input.line2 || '',
        input.town || '',
        addresses
      );

      const record = await storage.createValidation({
        line1: input.line1 || null,
        line2: input.line2 || null,
        town: input.town || null,
        postcode: input.postcode,
        isValid: result.matched,
        details: {
          matchScore: Math.round(result.score * 100),
          matchedAddress: result.bestMatch ? {
            line_1: result.bestMatch.line_1,
            line_2: result.bestMatch.line_2,
            line_3: result.bestMatch.line_3,
            post_town: result.bestMatch.post_town,
            postcode: result.bestMatch.postcode,
            county: result.bestMatch.county,
            district: result.bestMatch.district,
            ward: result.bestMatch.ward,
            latitude: result.bestMatch.latitude,
            longitude: result.bestMatch.longitude,
          } : null,
          suggestions: result.suggestions,
          totalAddressesAtPostcode: addresses.length,
        },
      });

      res.json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.validations.list.path, async (req, res) => {
    const records = await storage.getValidations();
    res.json(records);
  });

  return httpServer;
}
