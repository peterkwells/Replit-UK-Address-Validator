import { db } from "./db";
import { councilTaxAddresses } from "@shared/schema";
import { sql } from "drizzle-orm";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
// @ts-ignore - csv-parse/sync types

const DATASETS: { council: string; url: string }[] = [
  { council: "Aberdeenshire Council", url: "https://drive.google.com/uc?export=download&id=1zSKt3EIURFP-WOmm2BLeCmuf9yBfyxkF" },
  { council: "Birmingham City Council", url: "https://drive.google.com/uc?export=download&id=11mFnqYnXW_cNRrKeppIsIgMOs9A52VUa" },
  { council: "Bradford Council", url: "https://drive.google.com/uc?export=download&id=13OyhGedQCoKJXBBJbxPUWm5kAdFmXfXA" },
  { council: "Brent Council", url: "https://drive.google.com/uc?export=download&id=1bKi-mAcpcX9CeDnlEoDZLscO3l4Y8RsM" },
  { council: "Brighton & Hove City Council", url: "https://drive.google.com/uc?export=download&id=1ElqOPZ8OCF0oTjNYxD0ORBwsbCzTmm7C" },
  { council: "Bristol City Council", url: "https://drive.google.com/uc?export=download&id=1zEzufILubmDNAQvhzGbRczUtNoJrNuD3" },
  { council: "Camden Council", url: "https://drive.google.com/uc?export=download&id=1LHisoJEM7uXW4eodddV1-X9Oac0u-aS3" },
  { council: "Cornwall Council", url: "https://drive.google.com/uc?export=download&id=1gVxSlk0oCzxy6wzlTvgadJQ8lVZxQNmb" },
  { council: "Durham County Council", url: "https://drive.google.com/uc?export=download&id=1biAJJ8P9TaX0WJhvE_2Yky6aHemktJ08" },
  { council: "Ealing Council", url: "https://drive.google.com/uc?export=download&id=1WyMUpUoCCajp7PM20zoxpp6lkPotIGeQ" },
  { council: "Hackney Council", url: "https://drive.google.com/uc?export=download&id=16B9vV-ERcfW4B--YN7FpdmqjUDKchG4Z" },
  { council: "Isle of Wight Council", url: "https://drive.google.com/uc?export=download&id=1S4cnJIkelcmqwJwok5yDzw8O1T-ltMXY" },
  { council: "Islington Council", url: "https://drive.google.com/uc?export=download&id=1M--m1C1QzSVZ7gldbezmQrXbAqPqn1aE" },
  { council: "Leeds City Council", url: "https://drive.google.com/uc?export=download&id=1-goEmDTjb1h3K9nMIkChA-Be6CDMMcSm" },
  { council: "Lewisham Council", url: "https://drive.google.com/uc?export=download&id=1tZOjnRA0lhwpOxxOnAO0IHG3IcGwMhW4" },
  { council: "Lichfield District Council", url: "https://drive.google.com/uc?export=download&id=11jzD3zSRpLYP1QOXYclDSQr5C7bIsPRs" },
  { council: "London Borough of Bexley", url: "https://drive.google.com/uc?export=download&id=1AUkwe-G579UNimh6yZybOpT9KMBRo00q" },
  { council: "Manchester City Council", url: "https://drive.google.com/uc?export=download&id=1iFRYfDjfvC1EFwYmL88AZ2XxgThYpZ-B" },
  { council: "Milton Keynes City Council", url: "https://drive.google.com/uc?export=download&id=1F2ESkI55_TZBTP0THStbpV4ywKHMZ1wg" },
  { council: "Newham Council", url: "https://drive.google.com/uc?export=download&id=1mbiSoXDHnCLCxXYu3LrqXNQC7TiGxlb1" },
  { council: "Northumberland County Council", url: "https://drive.google.com/uc?export=download&id=1kNELdTbrDgHee5p5uCsEA-u4W-95BSvd" },
  { council: "Plymouth City Council", url: "https://drive.google.com/uc?export=download&id=1wjKPFxr1uI0zj7DdwMxkWWI40mkSWPhr" },
  { council: "Rhondda Cynon Taf", url: "https://drive.google.com/uc?export=download&id=1O5SqEJdmWvSxSnKN3EvyMDV-gyB2epcV" },
  { council: "Royal Borough of Greenwich", url: "https://drive.google.com/uc?export=download&id=1bErEyfJ4C4rEP1XnDIVkM7Hby50NP1n0" },
  { council: "Southwark Council", url: "https://drive.google.com/uc?export=download&id=1xdOUUFVUkHW366FGAsaGGUXc3yCwZ-S8" },
  { council: "Wigan Council", url: "https://drive.google.com/uc?export=download&id=1XQIAbO_kzI2S_3tkr5iR_2M8z2jtKP7G" },
  { council: "Wiltshire Council", url: "https://drive.google.com/uc?export=download&id=1UDK8DmRMnylnW_4NUT4FNzjiNUeUxXaw" },
];

const TMP_DIR = "/tmp/council_tax_import";

async function downloadAndExtract(council: string, url: string): Promise<string | null> {
  const safeCouncil = council.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const zipPath = path.join(TMP_DIR, `${safeCouncil}.zip`);
  const extractDir = path.join(TMP_DIR, safeCouncil);

  try {
    console.log(`  Downloading ${council}...`);
    const confirmUrl = url.includes("?") ? `${url}&confirm=t` : `${url}?confirm=t`;
    execSync(`curl -L -o "${zipPath}" "${confirmUrl}" --max-time 180 --silent --show-error`, {
      timeout: 200000,
    });

    const stats = fs.statSync(zipPath);
    if (stats.size < 5000) {
      const content = fs.readFileSync(zipPath, "utf8");
      if (content.includes("html") || content.includes("Google") || content.includes("<!DOCTYPE")) {
        console.log(`  WARNING: ${council} - Got HTML page instead of zip, retrying without confirm...`);
        execSync(`curl -L -o "${zipPath}" "${url}" --max-time 180 --silent --show-error`, {
          timeout: 200000,
        });
      }
    }

    fs.mkdirSync(extractDir, { recursive: true });
    execSync(`unzip -o "${zipPath}" -d "${extractDir}"`, { timeout: 30000 });

    const csvFiles = execSync(`find "${extractDir}" -name "*.csv" -type f`)
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean);

    if (csvFiles.length === 0) {
      console.log(`  WARNING: No CSV files found for ${council}`);
      return null;
    }

    const ctbandsCsv = csvFiles.find((f) => f.includes("CTBAND")) || csvFiles[0];
    return ctbandsCsv;
  } catch (err: any) {
    console.error(`  ERROR downloading/extracting ${council}: ${err.message}`);
    return null;
  }
}

async function importCsv(council: string, csvPath: string): Promise<number> {
  const raw = fs.readFileSync(csvPath, "utf8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  const BATCH_SIZE = 2000;
  let imported = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = batch
      .map((r: any) => {
        const postcode = (r.POSTCODE || "").trim().toUpperCase();
        if (!postcode) return null;
        return {
          council,
          addr1: (r.ADDR1 || "").trim() || null,
          addr2: (r.ADDR2 || "").trim() || null,
          addr3: (r.ADDR3 || "").trim() || null,
          addr4: (r.ADDR4 || "").trim() || null,
          addr5: (r.ADDR5 || "").trim() || null,
          postcode,
          uprn: (r.UPRN || "").trim() || null,
        };
      })
      .filter(Boolean);

    if (values.length > 0) {
      await db.insert(councilTaxAddresses).values(values as any);
      imported += values.length;
    }

    if (i % 10000 === 0 && i > 0) {
      console.log(`    ...imported ${imported} records so far`);
    }
  }

  return imported;
}

async function main() {
  console.log("Council Tax Address Import");
  console.log("=========================\n");

  const existingCouncils = await db
    .select({ council: councilTaxAddresses.council })
    .from(councilTaxAddresses)
    .groupBy(councilTaxAddresses.council);

  const importedSet = new Set(existingCouncils.map(r => r.council));
  console.log(`Already imported: ${importedSet.size} councils (${Array.from(importedSet).join(', ')})\n`);

  fs.mkdirSync(TMP_DIR, { recursive: true });

  let totalImported = 0;
  const results: { council: string; count: number; status: string }[] = [];

  for (const dataset of DATASETS) {
    if (importedSet.has(dataset.council)) {
      console.log(`\nSkipping ${dataset.council} (already imported)`);
      results.push({ council: dataset.council, count: 0, status: "SKIPPED" });
      continue;
    }
    console.log(`\nProcessing: ${dataset.council}`);

    const csvPath = await downloadAndExtract(
      dataset.council,
      dataset.url
    );

    if (!csvPath) {
      results.push({ council: dataset.council, count: 0, status: "FAILED" });
      continue;
    }

    try {
      const count = await importCsv(dataset.council, csvPath);
      totalImported += count;
      results.push({ council: dataset.council, count, status: "OK" });
      console.log(`  Imported ${count} records for ${dataset.council}`);
    } catch (err: any) {
      console.error(`  ERROR importing ${dataset.council}: ${err.message}`);
      results.push({ council: dataset.council, count: 0, status: "ERROR" });
    }
  }

  console.log("\n\n=== IMPORT SUMMARY ===");
  console.log(`Total records imported: ${totalImported}`);
  console.log("\nBy council:");
  for (const r of results) {
    console.log(`  ${r.council}: ${r.count} records (${r.status})`);
  }

  try {
    execSync(`rm -rf ${TMP_DIR}`);
  } catch {}

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
