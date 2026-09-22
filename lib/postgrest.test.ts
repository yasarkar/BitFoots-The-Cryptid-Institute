import { describe, it, expect, vi } from "vitest";
import {
  extractMissingColumn,
  isDatabaseAuthError,
  selectTolerantToSchema,
  upsertTolerantToSchema,
  PROTECTED_COLUMNS,
} from "./postgrest";

const SCHEMA_CACHE_MISS = {
  code: "PGRST204",
  message: "Could not find the 'is_custom_avatar' column of 'profiles' in the schema cache",
};

const UNDEFINED_COLUMN = {
  code: "42703",
  message: "column profiles.highest_score does not exist",
};

describe("extractMissingColumn", () => {
  it("reads the column from a 42703 undefined_column error", () => {
    expect(extractMissingColumn(UNDEFINED_COLUMN)).toBe("highest_score");
  });

  it("reads the column from a PGRST204 schema cache miss", () => {
    expect(extractMissingColumn(SCHEMA_CACHE_MISS)).toBe("is_custom_avatar");
  });

  it("also inspects details and hint when the message is generic", () => {
    expect(
      extractMissingColumn({
        message: "Bad request",
        details: "column profiles.zcash_address does not exist",
      })
    ).toBe("zcash_address");
  });

  it("ignores unrelated database errors", () => {
    expect(extractMissingColumn({ code: "23502", message: 'null value in column "x_username"' })).toBeNull();
    expect(extractMissingColumn(null)).toBeNull();
    expect(extractMissingColumn(undefined)).toBeNull();
  });

  it("keeps the primary key protected by default", () => {
    expect(PROTECTED_COLUMNS).toContain("id");
  });
});

describe("isDatabaseAuthError", () => {
  it("flags rejected credentials and RLS denials", () => {
    expect(isDatabaseAuthError({ code: "401", message: "Invalid API key" })).toBe(true);
    expect(isDatabaseAuthError({ code: "42501", message: "permission denied for table profiles" })).toBe(
      true
    );
    expect(isDatabaseAuthError({ message: "Invalid JWT" })).toBe(true);
    expect(isDatabaseAuthError({ message: "No API key found in request" })).toBe(true);
  });

  it("does not flag schema or payload problems", () => {
    expect(isDatabaseAuthError(UNDEFINED_COLUMN)).toBe(false);
    expect(isDatabaseAuthError({ code: "23502", message: 'null value in column "x_username"' })).toBe(false);
    expect(isDatabaseAuthError(null)).toBe(false);
  });
});

describe("upsertTolerantToSchema", () => {
  it("retries without the missing column and reports what was dropped", async () => {
    const seen: Record<string, unknown>[] = [];
    const run = vi.fn(async (record: Record<string, unknown>) => {
      seen.push(record);
      return "is_custom_avatar" in record ? { error: SCHEMA_CACHE_MISS } : { error: null };
    });

    const result = await upsertTolerantToSchema(
      { id: "a0000000-0000-4000-8000-000000000001", zcash_address: "u1abc", is_custom_avatar: true },
      run
    );

    expect(result.error).toBeNull();
    expect(result.droppedColumns).toEqual(["is_custom_avatar"]);
    expect(result.payload).toEqual({
      id: "a0000000-0000-4000-8000-000000000001",
      zcash_address: "u1abc",
    });
    expect(seen).toHaveLength(2);
    expect(seen[1].is_custom_avatar).toBeUndefined();
    expect(seen[1].zcash_address).toBe("u1abc");
  });

  it("drops several unknown columns in sequence", async () => {
    const run = vi.fn(async (record: Record<string, unknown>) => {
      if ("is_custom_avatar" in record) return { error: SCHEMA_CACHE_MISS };
      if ("highest_score" in record) return { error: UNDEFINED_COLUMN };
      return { error: null };
    });

    const result = await upsertTolerantToSchema(
      {
        id: "a0000000-0000-4000-8000-000000000002",
        zcash_address: "u1abc",
        is_custom_avatar: true,
        highest_score: 10,
      },
      run
    );

    expect(result.error).toBeNull();
    expect(result.droppedColumns).toEqual(["is_custom_avatar", "highest_score"]);
    expect(result.payload).toEqual({ id: "a0000000-0000-4000-8000-000000000002", zcash_address: "u1abc" });
  });

  it("never strips the primary key", async () => {
    const run = vi.fn(async () => ({
      error: { code: "42703", message: "column profiles.id does not exist" },
    }));

    const result = await upsertTolerantToSchema({ id: "a0000000-0000-4000-8000-000000000003" }, run);

    expect(result.droppedColumns).toEqual([]);
    expect(result.error?.code).toBe("42703");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("surfaces unmapped database errors unchanged", async () => {
    const error = { code: "42501", message: "new row violates row-level security policy" };
    const run = vi.fn(async () => ({ error }));

    const result = await upsertTolerantToSchema({ id: "a0000000-0000-4000-8000-000000000004" }, run);

    expect(result.error).toEqual(error);
    expect(result.droppedColumns).toEqual([]);
  });
});

describe("selectTolerantToSchema", () => {
  it("retries the lookup without the missing column and still returns the row", async () => {
    const run = vi.fn(async (columns: string[]) =>
      columns.includes("is_custom_avatar")
        ? { data: null, error: SCHEMA_CACHE_MISS }
        : { data: { id: "a0000000-0000-4000-8000-000000000005", zcash_address: "u1abc" }, error: null }
    );

    const result = await selectTolerantToSchema<{ id: string; zcash_address: string }>(
      ["id", "zcash_address", "is_custom_avatar"],
      run
    );

    expect(result.error).toBeNull();
    expect(result.data?.zcash_address).toBe("u1abc");
    expect(result.droppedColumns).toEqual(["is_custom_avatar"]);
    expect(run).toHaveBeenLastCalledWith(["id", "zcash_address"]);
  });

  it("returns null data when the row does not exist", async () => {
    const result = await selectTolerantToSchema<{ id: string }>(["id"], async () => ({
      data: null,
      error: null,
    }));

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });
});
