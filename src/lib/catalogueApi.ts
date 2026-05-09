import type { Catalogue } from '../types/catalogue';
import type { Ontology, DataBinding } from '../data/ontology';

const DYNAMIC_CATALOGUE_ENDPOINT = '/api/catalogue-sync';
const UPDATE_CATALOGUE_ENDPOINT = '/api/catalogue-update';

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const body = await res.text();

  if (!res.ok) {
    throw new Error(body || `Request failed (${res.status})`);
  }

  if (!body.trim()) {
    throw new Error('Request succeeded but returned an empty response body');
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error('Request succeeded but returned invalid JSON');
  }
}

export async function fetchCatalogueDynamic(): Promise<Catalogue> {
  try {
    const dynamicRes = await fetch(DYNAMIC_CATALOGUE_ENDPOINT, { cache: 'no-store' });
    return await parseJsonResponse<Catalogue>(dynamicRes);
  } catch {
    const staticRes = await fetch(`${import.meta.env.BASE_URL}catalogue.json`, { cache: 'no-store' });
    return await parseJsonResponse<Catalogue>(staticRes);
  }
}



export interface CatalogueUpdateRequest {
  id: string;
  ontology: Ontology;
  bindings: DataBinding[];
  metadata: {
    name: string;
    description: string;
    icon?: string;
    category?: string;
    tags?: string[];
    author?: string;
    notes?: string;
  };
}

export async function updateCatalogueEntry(payload: CatalogueUpdateRequest): Promise<void> {
  const res = await fetch(UPDATE_CATALOGUE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await parseJsonResponse<{ ok: true }>(res);
}
