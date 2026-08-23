import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { triggerRevalidation } from "./revalidate.js";

void describe("triggerRevalidation", () => {
  void it("skips revalidation when not in production and force is not set", async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      const result = await triggerRevalidation({
        frontendUrl: "https://campus-lunch.example.com",
      });
      assert.equal(result.skipped, true);
      assert.equal(result.success, true);
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  void it("returns error if frontend URL is missing in production", async () => {
    const origEnv = process.env.NODE_ENV;
    const origUrl = process.env.FRONTEND_URL;
    process.env.NODE_ENV = "production";
    delete process.env.FRONTEND_URL;
    delete process.env.REVALIDATE_URL;

    try {
      const result = await triggerRevalidation();
      assert.equal(result.success, false);
      assert.match(result.error ?? "", /FRONTEND_URL/);
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.FRONTEND_URL = origUrl;
    }
  });

  void it("successfully calls revalidation endpoint when forced or in production", async () => {
    const origFetch = globalThis.fetch;
    let requestedUrl = "";
    let authHeader = "";
    let customHeader = "";

    globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
      requestedUrl =
        typeof url === "string"
          ? url
          : url instanceof URL
            ? url.toString()
            : url.url;
      const headers = (init?.headers ?? {}) as Record<string, string>;
      authHeader = headers.Authorization ?? "";
      customHeader = headers["x-revalidate-secret"] ?? "";

      return Promise.resolve(
        new Response(JSON.stringify({ revalidated: true, paths: ["/"] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }) as typeof fetch;

    try {
      const result = await triggerRevalidation({
        frontendUrl: "https://campus-lunch.example.com/",
        secret: "test-secret-123",
        force: true,
      });

      assert.equal(result.success, true);
      assert.equal(result.status, 200);
      assert.equal(
        requestedUrl,
        "https://campus-lunch.example.com/api/revalidate",
      );
      assert.equal(authHeader, "Bearer test-secret-123");
      assert.equal(customHeader, "test-secret-123");
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  void it("handles HTTP error status codes gracefully", async () => {
    const origFetch = globalThis.fetch;

    globalThis.fetch = (() => {
      return Promise.resolve(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }) as typeof fetch;

    try {
      const result = await triggerRevalidation({
        frontendUrl: "https://campus-lunch.example.com",
        secret: "wrong-secret",
        force: true,
      });

      assert.equal(result.success, false);
      assert.equal(result.status, 401);
      assert.match(result.error ?? "", /HTTP 401/);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  void it("catches network errors and does not throw", async () => {
    const origFetch = globalThis.fetch;

    globalThis.fetch = (() => {
      return Promise.reject(new Error("Connection refused"));
    }) as typeof fetch;

    try {
      const result = await triggerRevalidation({
        frontendUrl: "http://localhost:3000",
        force: true,
      });

      assert.equal(result.success, false);
      assert.match(result.error ?? "", /Connection refused/);
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});
