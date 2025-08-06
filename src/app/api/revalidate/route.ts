import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';

// Using GET here is not recommended, but it's good enough for now. This can be removed once there
// is a proper database for the main page data.
export async function GET(_: NextRequest) {
  revalidatePath('/');
  return Response.json({ revalidated: true });
}
