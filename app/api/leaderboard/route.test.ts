import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

describe("GET /api/leaderboard", () => {
  it("returns leaderboard list successfully with mock fallback", async () => {
    const req = new NextRequest("https://bitfoots.vercel.app/api/leaderboard");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.leaderboard)).toBe(true);
    expect(data.leaderboard.length).toBeGreaterThan(0);
    expect(data.leaderboard[0]).toHaveProperty("rank");
    expect(data.leaderboard[0]).toHaveProperty("total_points");
    expect(data.leaderboard[0]).toHaveProperty("x_username");
  });

  it("identifies target user in leaderboard when userId query parameter is provided", async () => {
    // a0000000-0000-4000-8000-000000000001 is satoshi_footprint in devMockStore
    const req = new NextRequest(
      "https://bitfoots.vercel.app/api/leaderboard?userId=a0000000-0000-4000-8000-000000000001"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.currentUserEntry).toBeDefined();
    expect(data.currentUserEntry.user_id).toBe("a0000000-0000-4000-8000-000000000001");
    expect(typeof data.userRank).toBe("number");
  });

  it("handles unknown userId gracefully without crashing", async () => {
    const req = new NextRequest(
      "https://bitfoots.vercel.app/api/leaderboard?userId=00000000-0000-0000-0000-000000000000"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.currentUserEntry).toBeNull();
    expect(data.userRank).toBeNull();
  });
});
