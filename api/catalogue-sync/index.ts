import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { ensureCatalogueFresh } from '../_shared/catalogue';

const catalogueSync: AzureFunction = async function (_context: Context, _req: HttpRequest): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  try {
    const catalogue = await ensureCatalogueFresh();
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: catalogue,
    };
  } catch (error) {
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: error instanceof Error ? error.message : 'Failed to load catalogue' },
    };
  }
};

export default catalogueSync;
