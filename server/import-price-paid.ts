import { db } from "./db";
import { pricePaidTransactions } from "@shared/schema";
import { sql } from "drizzle-orm";
import { parse } from "csv-parse";
import { Readable } from "stream";

const YEARS = [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const BASE_URL = "http://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com";
const BATCH_SIZE = 500;

function normalizePostcode(pc: string): string {
  const clean = pc.replace(/\s+/g, "").toUpperCase();
  if (clean.length < 5) return clean;
  const outward = clean.slice(0, -3);
  const inward = clean.slice(-3);
  return `${outward} ${inward}`;
}

async function getImportedYears(): Promise<Set<string>> {
  const result = await db.execute(
    sql`SELECT DISTINCT SUBSTRING(transfer_date, 1, 4) as year FROM price_paid_transactions`
  );
  const years = new Set<string>();
  for (const row of result.rows as any[]) {
    years.add(row.year);
  }
  return years;
}

async function importYear(year: number): Promise<number> {
  const url = `${BASE_URL}/pp-${year}.csv`;
  console.log(`  Downloading ${url}...`);

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`  Failed to download ${year}: ${response.status}`);
    return 0;
  }

  const text = await response.text();
  const lines = text.trim().split("\n");
  console.log(`  Downloaded ${lines.length} lines for ${year}`);

  let batch: any[] = [];
  let totalInserted = 0;

  const parser = parse({
    quote: '"',
    delimiter: ",",
    relax_column_count: true,
  });

  const readable = Readable.from(text);
  readable.pipe(parser);

  for await (const row of parser) {
    if (row.length < 15) continue;

    const postcode = normalizePostcode(row[3] || "");
    if (!postcode) continue;

    batch.push({
      transactionId: (row[0] || "").replace(/[{}]/g, ""),
      price: row[1] || "0",
      transferDate: row[2] || "",
      postcode,
      propertyType: row[4] || null,
      oldNew: row[5] || null,
      duration: row[6] || null,
      paon: row[7] || null,
      saon: row[8] || null,
      street: row[9] || null,
      locality: row[10] || null,
      town: row[11] || null,
      district: row[12] || null,
      county: row[13] || null,
      category: row[14] || null,
    });

    if (batch.length >= BATCH_SIZE) {
      await db.insert(pricePaidTransactions).values(batch);
      totalInserted += batch.length;
      if (totalInserted % 50000 === 0) {
        console.log(`  Inserted ${totalInserted.toLocaleString()} records...`);
      }
      batch = [];
    }
  }

  if (batch.length > 0) {
    await db.insert(pricePaidTransactions).values(batch);
    totalInserted += batch.length;
  }

  console.log(`  Completed ${year}: ${totalInserted.toLocaleString()} records`);
  return totalInserted;
}

async function main() {
  console.log("HM Land Registry Price Paid Data Import");
  console.log("=======================================\n");

  const importedYears = await getImportedYears();
  console.log(`Already imported years: ${[...importedYears].join(", ") || "none"}\n`);

  let totalImported = 0;

  for (const year of YEARS) {
    if (importedYears.has(String(year))) {
      console.log(`Skipping ${year} (already imported)`);
      continue;
    }

    console.log(`Importing ${year}...`);
    try {
      const count = await importYear(year);
      totalImported += count;
    } catch (err) {
      console.error(`Failed to import ${year}:`, err);
    }
  }

  const totalResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM price_paid_transactions`
  );
  const total = (totalResult.rows[0] as any).count;

  console.log(`\nImport complete. Total records in database: ${Number(total).toLocaleString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
