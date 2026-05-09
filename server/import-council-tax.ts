import { db } from "./db";
import { councilTaxAddresses, councilTaxDatasetVersions } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { sendEmail } from "./resend";

const NOTIFY_EMAIL = "peterkwells@gmail.com";

const TMP_DIR = "/tmp/council_tax_import";

interface DatasetEntry {
  council: string;
  releaseDate: string;
  geocodedUrl: string;
}

async function scrapeDataadaptive(): Promise<DatasetEntry[]> {
  console.log("Fetching dataset list from https://www.datadaptive.com/addr/ ...");
  const res = await fetch("https://www.datadaptive.com/addr/");
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Datadaptive page`);
  const html = await res.text();

  const datasets: DatasetEntry[] = [];

  // Split on <hr> separators — each block is one council entry
  const blocks = html.split(/<hr>/i);

  for (const block of blocks) {
    // Council name is in <b>...</b> inside a <p> tag
    const nameMatch = block.match(/<b>([^<]+)<\/b>/i);
    if (!nameMatch) continue;
    const council = nameMatch[1].trim();
    if (!council || council.length < 3) continue;

    // Extract release date: <td class="col1">Extract or release date:</td><td>VALUE</td>
    const dateMatch = block.match(/<td[^>]*>Extract or release date:<\/td><td>([^<]+)<\/td>/i);
    if (!dateMatch) continue;
    const releaseDate = dateMatch[1].trim();

    // Extract geocoded URL — only present when it's a Google Drive link (N/A entries have no <a> tag)
    const geocodedMatch = block.match(/<td[^>]*>Geocoded data:<\/td><td><a href="(https:\/\/drive\.google\.com\/[^"]+)"/i);
    if (!geocodedMatch) continue; // skip N/A entries

    const geocodedUrl = geocodedMatch[1].trim();

    datasets.push({ council, releaseDate, geocodedUrl });
  }

  console.log(`Found ${datasets.length} geocoded datasets on the page.\n`);
  return datasets;
}

async function downloadAndExtract(council: string, url: string): Promise<string | null> {
  const safeCouncil = council.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const zipPath = path.join(TMP_DIR, `${safeCouncil}.zip`);
  const extractDir = path.join(TMP_DIR, safeCouncil);

  // Validate URL is a Google Drive URL before using it
  if (!url.startsWith("https://drive.google.com/")) {
    console.error(`  SKIPPING ${council} — unexpected URL format: ${url}`);
    return null;
  }

  const cookieJar = path.join(TMP_DIR, `${safeCouncil}_cookies.txt`);

  try {
    console.log(`  Downloading ${council}...`);

    // Step 1: initial request — follows redirects, saves cookies, may return warning HTML for large files
    const firstResponse = execFileSync("curl", [
      "-L", "-c", cookieJar, "-b", cookieJar,
      "-o", zipPath, url,
      "--max-time", "300", "--silent", "--show-error",
    ], { timeout: 320000 }).toString();

    const stats = fs.statSync(zipPath);
    if (stats.size < 10000) {
      const html = fs.readFileSync(zipPath, "utf8");
      if (html.includes("Virus scan warning") || html.includes("uc-warning") || html.includes("uuid")) {
        // Step 2: extract uuid and file id from the Google Drive warning page form
        const uuidMatch = html.match(/name="uuid" value="([^"]+)"/);
        const idMatch = html.match(/name="id" value="([^"]+)"/);
        if (uuidMatch && idMatch) {
          const uuid = uuidMatch[1];
          const fileId = idMatch[1];
          console.log(`  Large file detected — using confirmation bypass (uuid: ${uuid.slice(0, 8)}...)`);
          // Step 3: re-download via drive.usercontent.google.com with uuid + cookies
          execFileSync("curl", [
            "-L", "-b", cookieJar,
            "-o", zipPath,
            `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t&uuid=${uuid}`,
            "--max-time", "300", "--silent", "--show-error",
          ], { timeout: 320000 });
        } else {
          console.log(`  WARNING: ${council} - Got HTML page but could not extract uuid`);
        }
      }
    }

    fs.mkdirSync(extractDir, { recursive: true });
    execFileSync("unzip", ["-o", zipPath, "-d", extractDir], { timeout: 30000 });

    const csvFiles = execFileSync("find", [extractDir, "-name", "*.csv", "-type", "f"])
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean);

    if (csvFiles.length === 0) {
      console.log(`  WARNING: No CSV files found for ${council}`);
      return null;
    }

    // Prefer CTBAND CSV (the address bands file), fall back to first CSV
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

    if (i % 20000 === 0 && i > 0) {
      console.log(`    ...imported ${imported} records so far`);
    }
  }

  return imported;
}

async function getVersionMap(): Promise<Map<string, string>> {
  const rows = await db.select().from(councilTaxDatasetVersions);
  return new Map(rows.map(r => [r.council, r.releaseDate]));
}

async function upsertVersion(council: string, releaseDate: string, recordCount: number) {
  await db
    .insert(councilTaxDatasetVersions)
    .values({ council, releaseDate, recordCount })
    .onConflictDoUpdate({
      target: councilTaxDatasetVersions.council,
      set: { releaseDate, recordCount, importedAt: sql`now()` },
    });
}

async function deleteCouncilRecords(council: string) {
  console.log(`  Deleting existing records for ${council}...`);
  await db.delete(councilTaxAddresses).where(eq(councilTaxAddresses.council, council));
}

async function main() {
  console.log("Council Tax Address Import (with smart refresh)");
  console.log("===============================================\n");

  // Scrape the Datadaptive page for current dataset list
  const datasets = await scrapeDataadaptive();

  if (datasets.length === 0) {
    console.error("No datasets found — check if the Datadaptive page structure has changed.");
    process.exit(1);
  }

  // Load existing version tracking
  const versionMap = await getVersionMap();
  console.log(`Tracking table has ${versionMap.size} previously imported councils.\n`);

  fs.mkdirSync(TMP_DIR, { recursive: true });

  let totalImported = 0;
  const results: { council: string; count: number; status: string; releaseDate: string }[] = [];

  for (const dataset of datasets) {
    const storedDate = versionMap.get(dataset.council);

    if (storedDate === dataset.releaseDate) {
      console.log(`Skipping ${dataset.council} — already up to date (${dataset.releaseDate})`);
      results.push({ council: dataset.council, count: 0, status: "UP_TO_DATE", releaseDate: dataset.releaseDate });
      continue;
    }

    // If storedDate is undefined, the council is either brand new or was imported before
    // the tracking table existed. Either way, delete any existing records and re-import cleanly.
    const isUpdate = storedDate !== undefined;
    if (isUpdate) {
      console.log(`\nUpdating: ${dataset.council} (stored: ${storedDate} → new: ${dataset.releaseDate})`);
    } else {
      console.log(`\nImporting: ${dataset.council} (${dataset.releaseDate})`);
    }

    const csvPath = await downloadAndExtract(dataset.council, dataset.geocodedUrl);
    if (!csvPath) {
      results.push({ council: dataset.council, count: 0, status: "FAILED", releaseDate: dataset.releaseDate });
      continue;
    }

    try {
      // Always delete before re-importing to avoid duplicates (handles both updates
      // and councils previously imported without the tracking table)
      await deleteCouncilRecords(dataset.council);

      const count = await importCsv(dataset.council, csvPath);
      totalImported += count;
      await upsertVersion(dataset.council, dataset.releaseDate, count);
      results.push({ council: dataset.council, count, status: isUpdate ? "UPDATED" : "NEW", releaseDate: dataset.releaseDate });
      console.log(`  ✓ ${count.toLocaleString()} records imported for ${dataset.council}`);
    } catch (err: any) {
      console.error(`  ERROR importing ${dataset.council}: ${err.message}`);
      results.push({ council: dataset.council, count: 0, status: "ERROR", releaseDate: dataset.releaseDate });
    }
  }

  console.log("\n\n=== IMPORT SUMMARY ===");
  console.log(`New records imported this run: ${totalImported.toLocaleString()}`);

  const byStatus = {
    NEW: results.filter(r => r.status === "NEW"),
    UPDATED: results.filter(r => r.status === "UPDATED"),
    UP_TO_DATE: results.filter(r => r.status === "UP_TO_DATE"),
    FAILED: results.filter(r => r.status === "FAILED"),
    ERROR: results.filter(r => r.status === "ERROR"),
  };

  if (byStatus.NEW.length > 0) {
    console.log(`\nNew councils imported (${byStatus.NEW.length}):`);
    for (const r of byStatus.NEW) console.log(`  + ${r.council}: ${r.count.toLocaleString()} records (${r.releaseDate})`);
  }
  if (byStatus.UPDATED.length > 0) {
    console.log(`\nUpdated councils (${byStatus.UPDATED.length}):`);
    for (const r of byStatus.UPDATED) console.log(`  ↑ ${r.council}: ${r.count.toLocaleString()} records (${r.releaseDate})`);
  }
  if (byStatus.UP_TO_DATE.length > 0) {
    console.log(`\nAlready up to date (${byStatus.UP_TO_DATE.length}): ${byStatus.UP_TO_DATE.map(r => r.council).join(", ")}`);
  }
  if (byStatus.FAILED.length > 0 || byStatus.ERROR.length > 0) {
    console.log(`\nFailed (${byStatus.FAILED.length + byStatus.ERROR.length}):`);
    for (const r of [...byStatus.FAILED, ...byStatus.ERROR]) console.log(`  ✗ ${r.council} (${r.status})`);
  }

  // Get total DB counts for summary
  const totalRows = await db.select({ count: sql<number>`count(*)` }).from(councilTaxAddresses);
  const totalCouncils = await db.select({ count: sql<number>`count(distinct council)` }).from(councilTaxAddresses);
  const totalAddresses = Number(totalRows[0].count);
  const totalCouncilCount = Number(totalCouncils[0].count);
  console.log(`\nDatabase totals: ${totalCouncilCount} councils, ${totalAddresses.toLocaleString()} address records`);

  try {
    execFileSync("rm", ["-rf", TMP_DIR]);
  } catch {}

  // Send completion notification email
  try {
    const newList = byStatus.NEW.map(r => `<li>${r.council}: ${r.count.toLocaleString()} records (${r.releaseDate})</li>`).join("");
    const updatedList = byStatus.UPDATED.map(r => `<li>${r.council}: ${r.count.toLocaleString()} records (${r.releaseDate})</li>`).join("");
    const failedList = [...byStatus.FAILED, ...byStatus.ERROR].map(r => `<li>${r.council} (${r.status})</li>`).join("");

    await sendEmail(
      NOTIFY_EMAIL,
      "Council tax data import complete",
      `<h2>Council Tax Data Import Complete</h2>
      <p><strong>${totalCouncilCount} councils, ${totalAddresses.toLocaleString()} address records</strong> now in the database.</p>
      ${byStatus.NEW.length > 0 ? `<h3>New councils imported (${byStatus.NEW.length})</h3><ul>${newList}</ul>` : ""}
      ${byStatus.UPDATED.length > 0 ? `<h3>Updated councils (${byStatus.UPDATED.length})</h3><ul>${updatedList}</ul>` : ""}
      ${byStatus.UP_TO_DATE.length > 0 ? `<p>${byStatus.UP_TO_DATE.length} councils were already up to date and skipped.</p>` : ""}
      ${failedList ? `<h3>Failed</h3><ul>${failedList}</ul>` : ""}
      `
    );
    console.log(`\nNotification email sent to ${NOTIFY_EMAIL}`);
  } catch (err: any) {
    console.warn(`\nCould not send notification email: ${err.message}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
