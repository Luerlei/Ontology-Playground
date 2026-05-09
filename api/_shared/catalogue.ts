import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

interface CataloguePayload {
  generatedAt: string;
  count: number;
  entries: unknown[];
}

export interface SaveCatalogueRequest {
  id: string;
  ontology: unknown;
  bindings?: unknown[];
  metadata?: {
    name?: string;
    description?: string;
    icon?: string;
    category?: string;
    tags?: string[];
    author?: string;
    notes?: string;
  };
}

const SAFE_ID_RE = /^[a-z0-9][a-z0-9/_-]*[a-z0-9]$|^[a-z0-9]$/;

function getWorkspaceRoot(): string {
  // api/dist/<func>/index.js -> workspace root is ../../..
  return resolve(__dirname, '../../..');
}

function getCatalogueRoot(): string {
  return join(getWorkspaceRoot(), 'catalogue');
}

function getPublicCatalogueFile(): string {
  return join(getWorkspaceRoot(), 'public', 'catalogue.json');
}

let buildInFlight: Promise<void> | null = null;
let lastBuildMs = 0;
const MIN_REBUILD_INTERVAL_MS = 3000;

function latestMtimeMs(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;
  const stack = [dirPath];
  let latest = 0;

  while (stack.length > 0) {
    const current = stack.pop() as string;
    const stat = statSync(current);
    if (stat.mtimeMs > latest) latest = stat.mtimeMs;
    if (stat.isDirectory()) {
      for (const name of readdirSync(current)) {
        stack.push(join(current, name));
      }
    }
  }

  return latest;
}

async function runCatalogueBuild(): Promise<void> {
  const cwd = getWorkspaceRoot();
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(npmCmd, ['run', 'catalogue:build'], {
      cwd,
      stdio: 'pipe',
      shell: false,
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', (error) => rejectPromise(error));
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(stderr || `catalogue:build failed with exit code ${code}`));
    });
  });
}

function readCatalogueFile(): CataloguePayload {
  const outputFile = getPublicCatalogueFile();
  if (!existsSync(outputFile)) {
    throw new Error('public/catalogue.json not found');
  }
  return JSON.parse(readFileSync(outputFile, 'utf-8')) as CataloguePayload;
}

export async function ensureCatalogueFresh(): Promise<CataloguePayload> {

  const now = Date.now();
  const outputFile = getPublicCatalogueFile();

  const shouldBuild =
    !existsSync(outputFile)
    || (now - lastBuildMs) > MIN_REBUILD_INTERVAL_MS
    || latestMtimeMs(getCatalogueRoot()) > statSync(outputFile).mtimeMs;

  if (shouldBuild) {
    if (!buildInFlight) {
      buildInFlight = runCatalogueBuild()
        .then(() => {
          lastBuildMs = Date.now();
        })
        .finally(() => {
          buildInFlight = null;
        });
    }
    await buildInFlight;
  }

  return readCatalogueFile();
}

function sanitizeId(id: string): string {
  const trimmed = id.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed || trimmed.includes('..') || !SAFE_ID_RE.test(trimmed)) {
    throw new Error('Invalid catalogue id');
  }
  return trimmed;
}

function validateOntologyShape(ontology: unknown): asserts ontology is { name?: string; description?: string; entityTypes: unknown[]; relationships: unknown[] } {
  if (!ontology || typeof ontology !== 'object') {
    throw new Error('ontology is required');
  }
  const obj = ontology as Record<string, unknown>;
  if (!Array.isArray(obj.entityTypes) || !Array.isArray(obj.relationships)) {
    throw new Error('ontology.entityTypes and ontology.relationships must be arrays');
  }
}

export async function saveCatalogueEntry(req: SaveCatalogueRequest): Promise<void> {
  const safeId = sanitizeId(req.id);
  validateOntologyShape(req.ontology);

  const root = getWorkspaceRoot();
  const catalogueRoot = getCatalogueRoot();
  const parts = safeId.split('/');
  const slug = parts[parts.length - 1];
  const modelDir = resolve(catalogueRoot, ...parts);

  if (!modelDir.startsWith(catalogueRoot)) {
    throw new Error('Invalid catalogue path');
  }

  mkdirSync(modelDir, { recursive: true });

  const ontologyFile = join(modelDir, `${slug}.json`);
  const metadataFile = join(modelDir, 'metadata.json');

  writeFileSync(
    ontologyFile,
    `${JSON.stringify({ ontology: req.ontology, bindings: req.bindings ?? [] }, null, 2)}\n`,
    'utf-8',
  );

  const existingMetadata = existsSync(metadataFile)
    ? (JSON.parse(readFileSync(metadataFile, 'utf-8')) as Record<string, unknown>)
    : {};
  const ontologyObj = req.ontology as { name?: string; description?: string };

  const metadata = {
    name: req.metadata?.name || ontologyObj.name || String(existingMetadata.name || slug),
    description: req.metadata?.description || ontologyObj.description || String(existingMetadata.description || ''),
    icon: req.metadata?.icon || String(existingMetadata.icon || '📦'),
    category: req.metadata?.category || String(existingMetadata.category || 'general'),
    tags: Array.isArray(req.metadata?.tags)
      ? req.metadata?.tags
      : (Array.isArray(existingMetadata.tags) ? existingMetadata.tags : []),
    author: req.metadata?.author || String(existingMetadata.author || ''),
    notes: req.metadata?.notes || String(existingMetadata.notes || ''),
  };

  writeFileSync(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`, 'utf-8');

  await runCatalogueBuild();

  // Ensure updated catalogue file exists after rebuild
  const outputFile = join(root, 'public', 'catalogue.json');
  if (!existsSync(outputFile)) {
    throw new Error('catalogue build completed but output file is missing');
  }
}
