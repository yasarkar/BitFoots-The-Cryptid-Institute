import { describe, it, expect } from "vitest";
import { generateUuid, isValidUuid } from "./uuid";

describe("generateUuid", () => {
  it("produces a valid UUID v4", () => {
    const id = generateUuid();
    expect(isValidUuid(id)).toBe(true);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("produces unique values", () => {
    const set = new Set(Array.from({ length: 500 }, () => generateUuid()));
    expect(set.size).toBe(500);
  });
});

describe("isValidUuid", () => {
  it("accepts a valid v4 uuid", () => {
    expect(isValidUuid("a0000000-0000-4000-8000-000000000001")).toBe(true);
  });

  it("accepts uppercase hex (case-insensitive)", () => {
    expect(isValidUuid("A0000000-0000-4000-8000-000000000001")).toBe(true);
  });

  it("accepts v1-v5 uuids", () => {
    expect(isValidUuid("c232ab00-9414-11ec-b3c8-9f6bdeb5caeb")).toBe(true); // v1 (RFC 9562 example)
    expect(isValidUuid("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true); // v4
  });

  it("rejects the nil uuid", () => {
    expect(isValidUuid("00000000-0000-0000-0000-000000000000")).toBe(false);
  });

  it("rejects invalid version or variant nibbles", () => {
    expect(isValidUuid("a0000000-0000-6000-8000-000000000001")).toBe(false); // version 6
    expect(isValidUuid("a0000000-0000-4000-c000-000000000001")).toBe(false); // bad variant
  });

  it("rejects empty, short and malformed strings", () => {
    expect(isValidUuid("")).toBe(false);
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid("a0000000-0000-4000-8000-00000000000")).toBe(false);
    expect(isValidUuid("a0000000-00004000-8000-000000000001")).toBe(false);
  });
});
