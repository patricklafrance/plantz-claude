/**
 * Standalone seed script for the plants data.
 *
 * Generates plant data as a plain JSON array and writes it
 * to apps/host/public/ as a static fallback.
 *
 * Usage:  pnpm seed-plants
 *
 * The primary seeding mechanism is now `plantsDb.reset(defaultSeedPlants)`
 * in the MSW setup. This script is available for generating a static JSON
 * file if needed.
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { generatePlants } from "../packages/plants-core/src/msw/seedData.ts";

// ── Main ──

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedJsonPublic = resolve(__dirname, "../apps/host/public/seed-plants.json");

const plants = generatePlants();
const json = JSON.stringify(plants, null, 2);

writeFileSync(seedJsonPublic, json, "utf-8");

// oxlint-disable-next-line eslint/no-console -- CLI script; console output is intentional
console.log(`Generated ${plants.length} plants -> apps/host/public/seed-plants.json`);
