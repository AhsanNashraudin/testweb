import { NextResponse } from 'next/server';
import { buildPreview, previewSchema } from '@/lib/checkout';
import { readJson, apiError } from '@/lib/api';

export async function POST(req: Request) {
  try {
    return NextResponse.json(await buildPreview(previewSchema.parse(await readJson(req))));
  } catch (e) {
    return apiError(e);
  }
}
