import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  })),
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to origin root when no next param is specified", async () => {
    const req = new NextRequest("https://bitfoots.vercel.app/auth/callback");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://bitfoots.vercel.app/");
  });

  it("redirects to valid relative path", async () => {
    const req = new NextRequest("https://bitfoots.vercel.app/auth/callback?next=/sector-2");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://bitfoots.vercel.app/sector-2");
  });

  it("prevents protocol-relative open redirect (//evil.com)", async () => {
    const req = new NextRequest("https://bitfoots.vercel.app/auth/callback?next=//evil.com");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://bitfoots.vercel.app/");
  });

  it("prevents backslash-relative open redirect (/\\\\evil.com)", async () => {
    const req = new NextRequest("https://bitfoots.vercel.app/auth/callback?next=/\\evil.com");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://bitfoots.vercel.app/");
  });

  it("prevents absolute URL open redirect (https://evil.com)", async () => {
    const req = new NextRequest("https://bitfoots.vercel.app/auth/callback?next=https://evil.com");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://bitfoots.vercel.app/");
  });
});
