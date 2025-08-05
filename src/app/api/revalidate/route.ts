import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(_: NextRequest) {
  revalidatePath("/");
  return NextResponse.json({ revalidated: true });
}
