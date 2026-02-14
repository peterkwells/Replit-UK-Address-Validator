import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import type { CouncilTaxAddress } from "@shared/schema";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchAddressLines(
  userLine1: string,
  userLine2: string,
  candidateLines: string[],
  candidateTown?: string,
  userTown?: string,
): { score: number } {
  const userFull = normalize([userLine1, userLine2].filter(Boolean).join(' '));
  if (!userFull) return { score: 0 };

  const candidateFull = normalize(candidateLines.filter(Boolean).join(' '));

  let lineScore = 0;
  if (userFull === candidateFull) {
    lineScore = 1;
  } else if (userFull.length > 0 && (candidateFull.includes(userFull) || userFull.includes(candidateFull))) {
    lineScore = 0.95;
  } else {
    const userWords = userFull.split(' ');
    const candWords = candidateFull.split(' ');
    const exactMatches = userWords.filter(w => candWords.includes(w));
    lineScore = exactMatches.length / Math.max(userWords.length, candWords.length);
  }

  const userTownNorm = normalize(userTown || '');
  const candTownNorm = normalize(candidateTown || '');
  const townScore = userTownNorm
    ? (userTownNorm === candTownNorm ? 1 : 0)
    : 0.5;

  return { score: (lineScore * 0.7) + (townScore * 0.3) };
}

function findBestMatchRoyalMail(
  userLine1: string,
  userLine2: string,
  userTown: string,
  addresses: any[]
): { matched: boolean; bestMatch: any; score: number; suggestions: string[] } {
  const userFull = normalize([userLine1, userLine2].filter(Boolean).join(' '));

  if (!userFull) {
    const suggestions = addresses
      .slice(0, 5)
      .map((a: any) => [a.line_1, a.line_2, a.post_town, a.postcode].filter(Boolean).join(', '));
    return { matched: false, bestMatch: null, score: 0, suggestions };
  }

  let bestScore = 0;
  let bestMatch: any = null;

  for (const addr of addresses) {
    const { score } = matchAddressLines(
      userLine1, userLine2,
      [addr.line_1, addr.line_2, addr.line_3],
      addr.post_town, userTown
    );
    if (score > bestScore) {
      bestScore = score;
      bestMatch = addr;
    }
  }

  const suggestions = addresses
    .slice(0, 5)
    .map((a: any) => [a.line_1, a.line_2, a.post_town, a.postcode].filter(Boolean).join(', '));

  return {
    matched: bestScore >= 0.85,
    bestMatch,
    score: bestScore,
    suggestions,
  };
}

function findBestMatchCouncilTax(
  userLine1: string,
  userLine2: string,
  userTown: string,
  addresses: CouncilTaxAddress[]
): { matched: boolean; bestMatch: CouncilTaxAddress | null; score: number; suggestions: string[]; council: string | null } {
  const userFull = normalize([userLine1, userLine2].filter(Boolean).join(' '));
  const userTownNorm = normalize(userTown);

  if (!userFull || addresses.length === 0) {
    return { matched: false, bestMatch: null, score: 0, suggestions: [], council: null };
  }

  let bestScore = 0;
  let bestMatch: CouncilTaxAddress | null = null;

  for (const addr of addresses) {
    const allLines = [addr.addr1, addr.addr2, addr.addr3, addr.addr4, addr.addr5].filter(Boolean) as string[];
    const candidateTown = allLines.find(l => {
      const norm = normalize(l);
      return norm === userTownNorm;
    }) || addr.addr3 || addr.addr4 || addr.addr2 || '';

    const addressLines = allLines.filter(l => normalize(l) !== normalize(candidateTown));

    const { score } = matchAddressLines(
      userLine1, userLine2,
      addressLines.length > 0 ? addressLines : [addr.addr1 || '', addr.addr2 || ''],
      candidateTown, userTown
    );

    if (score > bestScore) {
      bestScore = score;
      bestMatch = addr;
    }
  }

  const suggestions = addresses
    .slice(0, 5)
    .map((a) => [a.addr1, a.addr2, a.addr3, a.postcode].filter(Boolean).join(', '));

  return {
    matched: bestScore >= 0.85,
    bestMatch,
    score: bestScore,
    suggestions,
    council: bestMatch?.council || addresses[0]?.council || null,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.validations.create.path, async (req, res) => {
    try {
      const { sources, ...addressFields } = req.body;
      const input = api.validations.create.input.parse(addressFields);

      const useIdealPostcodes = sources?.idealPostcodes !== false;
      const useOpenAddresses = sources?.openAddresses !== false;

      if (!useIdealPostcodes && !useOpenAddresses) {
        return res.status(400).json({ message: "At least one data source must be selected" });
      }

      const apiKey = process.env.IDEAL_POSTCODES_API_KEY;
      if (useIdealPostcodes && !apiKey) {
        return res.status(500).json({ message: "Address lookup API key not configured" });
      }

      const cleanPostcode = input.postcode.replace(/\s/g, '');

      const [apiResponse, councilTaxAddresses] = await Promise.all([
        useIdealPostcodes
          ? fetch(`https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(cleanPostcode)}?api_key=${apiKey}`).then(r => r.json())
          : Promise.resolve(null),
        useOpenAddresses
          ? storage.getCouncilTaxAddresses(input.postcode)
          : Promise.resolve([]),
      ]);

      let royalMailResult: any = null;
      if (!apiResponse) {
        royalMailResult = { skipped: true };
      } else if (apiResponse.code === 4040) {
        royalMailResult = {
          matched: false,
          score: 0,
          error: "Postcode not found in Royal Mail database",
          matchedAddress: null,
          suggestions: [],
          totalAddresses: 0,
        };
      } else if (apiResponse.code !== 2000 || !apiResponse.result || apiResponse.result.length === 0) {
        royalMailResult = {
          matched: false,
          score: 0,
          error: apiResponse.message || "Royal Mail lookup failed",
          matchedAddress: null,
          suggestions: [],
          totalAddresses: 0,
        };
      } else {
        const rmAddresses = apiResponse.result;
        const rmResult = findBestMatchRoyalMail(
          input.line1 || '', input.line2 || '', input.town || '', rmAddresses
        );
        royalMailResult = {
          matched: rmResult.matched,
          score: Math.round(rmResult.score * 100),
          matchedAddress: rmResult.bestMatch ? {
            line_1: rmResult.bestMatch.line_1,
            line_2: rmResult.bestMatch.line_2,
            line_3: rmResult.bestMatch.line_3,
            post_town: rmResult.bestMatch.post_town,
            postcode: rmResult.bestMatch.postcode,
            county: rmResult.bestMatch.county,
            district: rmResult.bestMatch.district,
            ward: rmResult.bestMatch.ward,
          } : null,
          suggestions: rmResult.suggestions,
          totalAddresses: rmAddresses.length,
        };
      }

      let councilTaxResult: any = null;
      if (!useOpenAddresses) {
        councilTaxResult = { skipped: true };
      } else if (councilTaxAddresses.length > 0) {
        const ctResult = findBestMatchCouncilTax(
          input.line1 || '', input.line2 || '', input.town || '', councilTaxAddresses
        );
        councilTaxResult = {
          matched: ctResult.matched,
          score: Math.round(ctResult.score * 100),
          council: ctResult.council,
          matchedAddress: ctResult.bestMatch ? {
            addr1: ctResult.bestMatch.addr1,
            addr2: ctResult.bestMatch.addr2,
            addr3: ctResult.bestMatch.addr3,
            postcode: ctResult.bestMatch.postcode,
          } : null,
          suggestions: ctResult.suggestions,
          totalAddresses: councilTaxAddresses.length,
        };
      } else {
        councilTaxResult = {
          matched: false,
          score: 0,
          council: null,
          notCovered: true,
          matchedAddress: null,
          suggestions: [],
          totalAddresses: 0,
        };
      }

      const isValid = royalMailResult.skipped
        ? (councilTaxResult.matched || false)
        : royalMailResult.matched;

      const record = await storage.createValidation({
        line1: input.line1 || null,
        line2: input.line2 || null,
        town: input.town || null,
        postcode: input.postcode,
        isValid,
        details: {
          royalMail: royalMailResult,
          councilTax: councilTaxResult,
          matchScore: royalMailResult.score,
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
