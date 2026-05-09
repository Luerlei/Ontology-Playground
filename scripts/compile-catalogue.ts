/**
 * Build-time catalogue compiler.
 *
 * Reads all catalogue/**\/*.rdf files, parses each via the RDF parser,
 * reads associated metadata.json, and emits public/catalogue.json.
 *
 * Usage: npx tsx scripts/compile-catalogue.ts
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, lstatSync } from 'node:fs';
import { join, basename } from 'node:path';
import { JSDOM } from 'jsdom';
import { parseRDF } from '../src/lib/rdf/parser.js';
import { serializeToRDF } from '../src/lib/rdf/serializer.js';
import { validateOntologyStyle } from './style-validator.js';
import type { CatalogueEntry, Catalogue } from '../src/types/catalogue.js';
import type { Ontology, DataBinding } from '../src/data/ontology.js';

// Provide DOMParser for the RDF parser (browser API not available in Node)
const dom = new JSDOM('');
globalThis.DOMParser = dom.window.DOMParser;

const ROOT = join(import.meta.dirname, '..');
const CATALOGUE_DIR = join(ROOT, 'catalogue');
const OUTPUT_PATH = join(ROOT, 'public', 'catalogue.json');

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface CatalogueMetadata {
  name: string;
  description: string;
  notes?: string;
  icon?: string;
  category: string;
  tags?: string[];
  author?: string;
}

// ------------------------------------------------------------------
// Validation helpers
// ------------------------------------------------------------------

const REQUIRED_METADATA_FIELDS = ['name', 'description', 'category'] as const;
const VALID_CATEGORIES = ['retail', 'healthcare', 'finance', 'manufacturing', 'education', 'food', 'media', 'events', 'general', 'iq-lab', 'school', 'fibo'];

function validateMetadata(meta: unknown, filePath: string): CatalogueMetadata {
  if (typeof meta !== 'object' || meta === null) {
    throw new Error(`${filePath}: metadata.json must be a JSON object`);
  }
  const obj = meta as Record<string, unknown>;
  for (const field of REQUIRED_METADATA_FIELDS) {
    if (typeof obj[field] !== 'string' || (obj[field] as string).length === 0) {
      throw new Error(`${filePath}: metadata.json missing required field "${field}"`);
    }
  }
  if (!VALID_CATEGORIES.includes(obj['category'] as string)) {
    throw new Error(
      `${filePath}: invalid category "${obj['category']}". Must be one of: ${VALID_CATEGORIES.join(', ')}`,
    );
  }
  return meta as CatalogueMetadata;
}

// ------------------------------------------------------------------
// Discover ontology directories
// ------------------------------------------------------------------

// Validate that a directory name is a safe slug (no traversal, no special chars)
const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9\-_]*[a-z0-9]$|^[a-z0-9]$/;

function discoverOntologyDirs(baseDir: string): string[] {
  const dirs: string[] = [];
  if (!existsSync(baseDir)) return dirs;
  for (const entry of readdirSync(baseDir)) {
    const full = join(baseDir, entry);
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) {
      console.error(`✘ ${baseDir}/${entry}: symlinks are not allowed in the catalogue`);
      continue;
    }
    if (!stat.isDirectory()) continue;
    if (!SAFE_SLUG_RE.test(entry)) {
      console.error(`✘ ${baseDir}/${entry}: directory name contains unsafe characters (only lowercase alphanumeric, hyphens, underscores allowed)`);
      continue;
    }
    dirs.push(full);
  }
  return dirs;
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------

function compile(): Catalogue {
  const entries: CatalogueEntry[] = [];
  const seenIds = new Set<string>();
  let errors = 0;

  const discovered: Array<{ dir: string; source: 'official' | 'community' | 'external'; relPath: string }> = [];

  for (const dir of discoverOntologyDirs(join(CATALOGUE_DIR, 'official'))) {
    discovered.push({ dir, source: 'official', relPath: basename(dir) });
  }

  for (const userDir of discoverOntologyDirs(join(CATALOGUE_DIR, 'community'))) {
    for (const dir of discoverOntologyDirs(userDir)) {
      discovered.push({ dir, source: 'community', relPath: `${basename(userDir)}/${basename(dir)}` });
    }
  }

  for (const sourceDir of discoverOntologyDirs(join(CATALOGUE_DIR, 'external'))) {
    for (const dir of discoverOntologyDirs(sourceDir)) {
      discovered.push({ dir, source: 'external', relPath: `${basename(sourceDir)}/${basename(dir)}` });
    }
  }

  // Backward-compatible community namespace support:
  // catalogue/<namespace>/<slug>/...
  const reservedRoots = new Set(['official', 'community', 'external']);
  for (const namespaceDir of discoverOntologyDirs(CATALOGUE_DIR)) {
    const namespace = basename(namespaceDir);
    if (reservedRoots.has(namespace)) continue;
    for (const dir of discoverOntologyDirs(namespaceDir)) {
      discovered.push({ dir, source: 'community', relPath: `${namespace}/${basename(dir)}` });
    }
  }

  for (const { dir, source, relPath } of discovered) {
      const slug = basename(dir);
      const metadataPath = join(dir, 'metadata.json');
      const rdfFiles = readdirSync(dir).filter((f: string) => f.endsWith('.rdf') || f.endsWith('.owl'));
      // JSON ontology files: <slug>.json (not metadata.json)
      const jsonFiles = readdirSync(dir).filter((f: string) => f.endsWith('.json') && f !== 'metadata.json');

      if (rdfFiles.length === 0 && jsonFiles.length === 0) {
        console.error(`✘ ${dir}: no .rdf, .owl or ontology .json file found`);
        errors++;
        continue;
      }
      if (!existsSync(metadataPath)) {
        console.error(`✘ ${dir}: missing metadata.json`);
        errors++;
        continue;
      }

      // Parse metadata
      let metadata: CatalogueMetadata;
      try {
        const raw = JSON.parse(readFileSync(metadataPath, 'utf-8'));
        metadata = validateMetadata(raw, metadataPath);
      } catch (e) {
        console.error(`✘ ${metadataPath}: ${(e as Error).message}`);
        errors++;
        continue;
      }

      // Derive a stable ID from discovery path, e.g. official/<slug> or community/<user>/<slug>
      const entryId = `${source}/${relPath}`;

      if (seenIds.has(entryId)) {
        console.error(`✘ ${dir}: duplicate catalogue path "${entryId}"`);
        errors++;
        continue;
      }

      // Parse ontology — prefer JSON (editable source) when present, otherwise fall back to RDF
      let ontology: Ontology;
      let bindings: DataBinding[];
      let sourcePath = '';
      if (jsonFiles.length > 0) {
        // Parse JSON ontology file: { ontology, bindings? } or plain ontology object
        const jsonPath = join(dir, jsonFiles[0]);
        sourcePath = jsonPath;
        try {
          const raw = JSON.parse(readFileSync(jsonPath, 'utf-8'));
          if (raw.ontology) {
            ontology = raw.ontology as Ontology;
            bindings = (raw.bindings ?? []) as DataBinding[];
          } else if (raw.entityTypes) {
            // Plain ontology object without wrapper
            ontology = raw as Ontology;
            bindings = [];
          } else {
            throw new Error('JSON file must contain an "ontology" object or a top-level ontology with "entityTypes"');
          }
          if (!ontology.entityTypes || !Array.isArray(ontology.entityTypes)) {
            throw new Error('ontology.entityTypes must be an array');
          }
        } catch (e) {
          console.error(`✘ ${jsonPath}: ${(e as Error).message}`);
          errors++;
          continue;
        }
      } else {
        // Parse RDF
        const rdfPath = join(dir, rdfFiles[0]);
        sourcePath = rdfPath;
        try {
          const rdfXml = readFileSync(rdfPath, 'utf-8');
          const parsed = parseRDF(rdfXml);
          ontology = parsed.ontology;
          bindings = parsed.bindings;
        } catch (e) {
          console.error(`✘ ${rdfPath}: ${(e as Error).message}`);
          errors++;
          continue;
        }

        // Round-trip check: serialize back and re-parse to verify fidelity
        try {
          const reserialized = serializeToRDF(ontology, bindings);
          parseRDF(reserialized);
        } catch (e) {
          console.error(`✘ ${rdfPath}: round-trip verification failed — ${(e as Error).message}`);
          errors++;
          continue;
        }
      }

      // Style validation: check naming conventions and spelling
      const styleErrors = validateOntologyStyle(ontology);
      if (styleErrors.length > 0) {
        for (const styleError of styleErrors) {
          if (styleError.severity === 'error') {
            console.error(`✘ ${sourcePath}: ${styleError.message} (in "${styleError.label}")`);
            errors++;
          } else {
            console.warn(`⚠ ${sourcePath}: ${styleError.message} (in "${styleError.label}")`);
          }
        }
        if (styleErrors.some(e => e.severity === 'error')) {
          continue;
        }
      }

      seenIds.add(entryId);
      entries.push({
        id: entryId,
        name: metadata.name,
        description: metadata.description,
        notes: metadata.notes,
        icon: metadata.icon,
        category: metadata.category,
        tags: metadata.tags ?? [],
        author: metadata.author ?? 'unknown',
        source,
        ontology,
        bindings,
      });

      console.log(`✔ ${entryId}`);
  }

  if (errors > 0) {
    throw new Error(`Catalogue compilation failed with ${errors} error(s)`);
  }

  return {
    generatedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  };
}

// ------------------------------------------------------------------
// Run
// ------------------------------------------------------------------

try {
  const catalogue = compile();
  writeFileSync(OUTPUT_PATH, JSON.stringify(catalogue, null, 2) + '\n', 'utf-8');
  console.log(`\n✔ Wrote ${catalogue.count} entries to ${OUTPUT_PATH}`);
} catch (e) {
  console.error(`\n${(e as Error).message}`);
  process.exit(1);
}
