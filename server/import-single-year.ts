import { Pool } from "pg";
import { parse } from "csv-parse";
import { Readable } from "stream";

const BASE_URL = "http://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com";
const BATCH_SIZE = 4000;

const year = parseInt(process.argv[2] || "0");
const forceClean = process.argv[3] === "--clean";
if (!year || year < 1995 || year > 2030) {
  console.error("Usage: npx tsx server/import-single-year.ts <year> [--clean]");
  process.exit(1);
}

function normalizePostcode(pc: string): string {
  const clean = pc.replace(/\s+/g, "").toUpperCase();
  if (clean.length < 5) return clean;
  const outward = clean.slice(0, -3);
  const inward = clean.slice(-3);
  return `${outward} ${inward}`;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();

  try {
    const countRes = await client.query(
      `SELECT COUNT(*) as cnt FROM price_paid_transactions WHERE transfer_date LIKE $1`,
      [year + '%']
    );
    const existingCount = Number(countRes.rows[0].cnt);

    if (forceClean && existingCount > 0) {
      console.log(`Force cleaning ${existingCount} existing records for ${year}...`);
      await client.query(`DELETE FROM price_paid_transactions WHERE transfer_date LIKE $1`, [year + '%']);
      console.log(`Cleaned.`);
    }

    const url = `${BASE_URL}/pp-${year}.csv`;
    console.log(`Downloading ${url}...`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed: ${response.status}`);
      process.exit(1);
    }

    const text = await response.text();
    const totalLines = text.split("\n").filter(l => l.trim()).length;

    const currentCount = forceClean ? 0 : existingCount;
    console.log(`${totalLines} lines, existing: ${currentCount}`);

    if (currentCount >= totalLines - 10) {
      console.log(`Year ${year} fully imported. Skipping.`);
      return;
    }

    const existingIds = new Set<string>();
    if (currentCount > 0) {
      const idsRes = await client.query(
        `SELECT transaction_id FROM price_paid_transactions WHERE transfer_date LIKE $1`,
        [year + '%']
      );
      for (const row of idsRes.rows) {
        existingIds.add(row.transaction_id);
      }
      console.log(`Loaded ${existingIds.size} existing IDs for dedup`);
    }

    let batch: any[][] = [];
    let totalInserted = 0;
    let skipped = 0;

    const parser = parse({ quote: '"', delimiter: ",", relax_column_count: true });
    const readable = Readable.from(text);
    readable.pipe(parser);

    for await (const row of parser) {
      if (row.length < 15) continue;
      const postcode = normalizePostcode(row[3] || "");
      if (!postcode) continue;

      const txId = (row[0] || "").replace(/[{}]/g, "");
      if (existingIds.has(txId)) {
        skipped++;
        continue;
      }

      batch.push([
        txId, row[1] || "0", row[2] || "", postcode,
        row[4] || null, row[5] || null, row[6] || null,
        row[7] || null, row[8] || null, row[9] || null,
        row[10] || null, row[11] || null, row[12] || null,
        row[13] || null, row[14] || null,
      ]);

      if (batch.length >= BATCH_SIZE) {
        await insertBatch(client, batch);
        totalInserted += batch.length;
        if (totalInserted % 100000 === 0) {
          console.log(`  ${totalInserted.toLocaleString()} inserted, ${skipped.toLocaleString()} skipped...`);
        }
        batch = [];
      }
    }

    if (batch.length > 0) {
      await insertBatch(client, batch);
      totalInserted += batch.length;
    }

    console.log(`Done: ${year} - ${totalInserted.toLocaleString()} new, ${skipped.toLocaleString()} skipped`);
  } finally {
    client.release();
    await pool.end();
  }
}

async function insertBatch(client: any, batch: any[][]) {
  const cols = [
    "transaction_id", "price", "transfer_date", "postcode",
    "property_type", "old_new", "duration", "paon", "saon",
    "street", "locality", "town", "district", "county", "category"
  ];
  const placeholders: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const row of batch) {
    const ph: string[] = [];
    for (const val of row) {
      ph.push(`$${idx++}`);
      values.push(val);
    }
    placeholders.push(`(${ph.join(",")})`);
  }

  await client.query(
    `INSERT INTO price_paid_transactions (${cols.join(",")}) VALUES ${placeholders.join(",")}`,
    values
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
