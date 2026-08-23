export interface RevalidateOptions {
  frontendUrl?: string;
  secret?: string;
  force?: boolean;
}

export interface RevalidateResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
  status?: number;
}

/**
 * Triggers on-demand ISR revalidation on the Next.js frontend application.
 * Note: Per project requirements, revalidation is skipped in non-production environments
 * (NODE_ENV !== "production") unless explicitly forced.
 */
export async function triggerRevalidation(
  options?: RevalidateOptions,
): Promise<RevalidateResult> {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction && !options?.force) {
    console.log(
      "[Revalidate] Skipping frontend revalidation (not in production mode).",
    );
    return { success: true, skipped: true };
  }

  const rawUrl =
    options?.frontendUrl ??
    process.env.FRONTEND_URL ??
    process.env.REVALIDATE_URL;

  if (!rawUrl) {
    const msg =
      "[Revalidate] FRONTEND_URL (or REVALIDATE_URL) is not configured. Skipping revalidation.";
    console.warn(msg);
    return { success: false, error: msg };
  }

  const secret = options?.secret ?? process.env.REVALIDATION_SECRET;
  const baseUrl = rawUrl.replace(/\/+$/, "");
  const targetEndpoint = `${baseUrl}/api/revalidate`;

  console.log(`[Revalidate] Triggering revalidation at ${targetEndpoint}...`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
    headers["x-revalidate-secret"] = secret;
  }

  try {
    const response = await fetch(targetEndpoint, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      const errorMsg = `Revalidation request failed with HTTP ${response.status}: ${errorBody}`;
      console.error(`[Revalidate] ${errorMsg}`);
      return {
        success: false,
        status: response.status,
        error: errorMsg,
      };
    }

    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    console.log(
      "[Revalidate] Successfully revalidated frontend cache:",
      JSON.stringify(data),
    );
    return { success: true, status: response.status };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Unknown network error";
    console.error(`[Revalidate] Error triggering revalidation: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}
