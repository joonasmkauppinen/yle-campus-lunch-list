import { describe, expect, it, vi } from "vitest";

import { triggerRevalidation } from "./revalidate.js";

describe("triggerRevalidation", () => {
  it("skips revalidation when not in production and force is not set", async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      const result = await triggerRevalidation({
        frontendUrl: "https://campus-lunch.example.com",
      });
      expect(result.skipped).toBe(true);
      expect(result.success).toBe(true);
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  it("returns error if frontend URL is missing in production", async () => {
    const origEnv = process.env.NODE_ENV;
    const origUrl = process.env.FRONTEND_URL;
    process.env.NODE_ENV = "production";
    delete process.env.FRONTEND_URL;
    delete process.env.REVALIDATE_URL;

    try {
      const result = await triggerRevalidation();
      expect(result.success).toBe(false);
      expect(result.error ?? "").toMatch(/FRONTEND_URL/);
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.FRONTEND_URL = origUrl;
    }
  });

  it("successfully calls revalidation endpoint when forced or in production", async () => {
    let requestedUrl = "";
    let authHeader = "";
    let customHeader = "";

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((url, init) => {
        requestedUrl =
          typeof url === "string"
            ? url
            : url instanceof URL
              ? url.toString()
              : (url as Request).url;
        const headers = (init?.headers ?? {}) as Record<string, string>;
        authHeader = headers.Authorization ?? "";
        customHeader = headers["x-revalidate-secret"] ?? "";

        return Promise.resolve(
          new Response(JSON.stringify({ revalidated: true, paths: ["/"] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      });

    try {
      const result = await triggerRevalidation({
        frontendUrl: "https://campus-lunch.example.com/",
        secret: "test-secret-123",
        force: true,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(requestedUrl).toBe(
        "https://campus-lunch.example.com/api/revalidate",
      );
      expect(authHeader).toBe("Bearer test-secret-123");
      expect(customHeader).toBe("test-secret-123");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("handles HTTP error status codes gracefully", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    try {
      const result = await triggerRevalidation({
        frontendUrl: "https://campus-lunch.example.com",
        secret: "wrong-secret",
        force: true,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error ?? "").toMatch(/HTTP 401/);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("catches network errors and does not throw", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() =>
        Promise.reject(new Error("Connection refused")),
      );

    try {
      const result = await triggerRevalidation({
        frontendUrl: "http://localhost:3000",
        force: true,
      });

      expect(result.success).toBe(false);
      expect(result.error ?? "").toMatch(/Connection refused/);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
