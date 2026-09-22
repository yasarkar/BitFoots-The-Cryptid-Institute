import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/telemetry", () => {
  it("returns live telemetry snapshot with valid schema", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("onlineHuntersEstimate");
    expect(typeof data.onlineHuntersEstimate).toBe("number");
    expect(data).toHaveProperty("btcBlock");
    expect(typeof data.btcBlock).toBe("string");
    expect(data).toHaveProperty("zkStatus");
    expect(data.zkStatus).toBe("ZK OK");
    expect(data).toHaveProperty("apexRecord");
    expect(data.apexRecord).toHaveProperty("name");
    expect(data.apexRecord).toHaveProperty("points");
    expect(Array.isArray(data.recentSightings)).toBe(true);
    expect(data.recentSightings.length).toBeGreaterThan(0);
    expect(data).toHaveProperty("serverTime");
  });
});
