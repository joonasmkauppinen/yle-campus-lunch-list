import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { RESTAURANT_CONFIGS } from "~/config/restaurants";
import { env } from "~/env";

function extractSecret(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const customHeader = request.headers.get("x-revalidate-secret");
  if (customHeader) {
    return customHeader.trim();
  }

  const querySecret = request.nextUrl.searchParams.get("secret");
  if (querySecret) {
    return querySecret.trim();
  }

  return null;
}

function authenticateRequest(request: NextRequest): {
  authorized: boolean;
  error?: string;
  status?: number;
} {
  const expectedSecret = env.REVALIDATION_SECRET?.trim();

  // If secret is set, enforce matching token
  if (expectedSecret) {
    const providedSecret = extractSecret(request);
    if (!providedSecret || providedSecret !== expectedSecret) {
      return {
        authorized: false,
        error: "Unauthorized: Invalid or missing secret token",
        status: 401,
      };
    }
    return { authorized: true };
  }

  // If secret is not set, reject in production for safety
  if (env.NODE_ENV === "production") {
    return {
      authorized: false,
      error: "Server misconfiguration: REVALIDATION_SECRET is not set",
      status: 500,
    };
  }

  // Allow in development mode if no secret configured
  return { authorized: true };
}

function handleRevalidation(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (!auth.authorized) {
    return Response.json(
      { error: auth.error },
      {
        status: auth.status ?? 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const revalidatedPaths: string[] = [];

  // Check for specific target path in query or json body
  const customPath = request.nextUrl.searchParams.get("path");
  if (customPath) {
    revalidatePath(customPath);
    revalidatedPaths.push(customPath);
  } else {
    // Revalidate root layout tree (all nested pages)
    revalidatePath("/", "layout");
    revalidatedPaths.push("/ (layout)");

    // Explicitly revalidate key routes
    revalidatePath("/");
    revalidatedPaths.push("/");

    revalidatePath("/api/current-day-menus");
    revalidatedPaths.push("/api/current-day-menus");

    for (const config of RESTAURANT_CONFIGS) {
      const restaurantPath = `/restaurant/${config.id}`;
      revalidatePath(restaurantPath);
      revalidatedPaths.push(restaurantPath);
    }
  }

  return Response.json(
    {
      revalidated: true,
      paths: revalidatedPaths,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export function POST(request: NextRequest) {
  return handleRevalidation(request);
}

export function GET(request: NextRequest) {
  return handleRevalidation(request);
}
