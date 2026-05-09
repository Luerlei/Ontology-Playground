import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { saveCatalogueEntry } from '../_shared/catalogue';

const catalogueUpdate: AzureFunction = async function (_context: Context, req: HttpRequest): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  if (req.method?.toUpperCase() !== 'POST') {
    return {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Method not allowed' },
    };
  }

  try {
    const body = req.body as {
      id?: string;
      ontology?: unknown;
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
    };

    if (!body?.id || !body?.ontology) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'id and ontology are required' },
      };
    }

    await saveCatalogueEntry({
      id: body.id,
      ontology: body.ontology,
      bindings: body.bindings ?? [],
      metadata: body.metadata,
    });

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { ok: true },
    };
  } catch (error) {
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: error instanceof Error ? error.message : 'Failed to update catalogue entry' },
    };
  }
};

export default catalogueUpdate;
