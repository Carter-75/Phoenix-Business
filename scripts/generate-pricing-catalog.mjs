// Generates frontend/src/app/services/pricing-catalog.generated.ts from the
// backend pricing engine, so the frontend never hand-carries a second copy
// of the catalog. The backend service is the single source of truth.
//
// Run with: node scripts/generate-pricing-catalog.mjs
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const {
  BASE_PROJECTS,
  FEATURE_ADDONS,
  EXTRA_PAGE_PRICE,
  PRICING_FLOORS
} = require('../backend/services/pricing.service.js');

const baseProjects = Object.values(BASE_PROJECTS);
const featureAddons = Object.values(FEATURE_ADDONS);

const header = [
  '// GENERATED FILE. DO NOT EDIT BY HAND.',
  '// Source of truth: backend/services/pricing.service.js',
  '// Regenerate with: node scripts/generate-pricing-catalog.mjs',
  ''
].join('\n');

const contents = [
  header,
  `export const SEED_BASE_PROJECTS = ${JSON.stringify(baseProjects, null, 2)};`,
  '',
  `export const SEED_FEATURE_ADDONS = ${JSON.stringify(featureAddons, null, 2)};`,
  '',
  `export const SEED_EXTRA_PAGE_PRICE = ${JSON.stringify(EXTRA_PAGE_PRICE)};`,
  '',
  `export const SEED_PRICING_FLOORS = ${JSON.stringify(PRICING_FLOORS, null, 2)};`,
  ''
].join('\n');

const outPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'frontend',
  'src',
  'app',
  'services',
  'pricing-catalog.generated.ts'
);

writeFileSync(outPath, contents);
console.log(
  `Wrote ${outPath} (${baseProjects.length} projects, ${featureAddons.length} addons)`
);
