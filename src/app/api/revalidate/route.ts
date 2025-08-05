import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  await revalidatePath('/');
  return Response.json({ revalidated: true });
}
