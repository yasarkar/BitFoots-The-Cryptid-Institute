/**
 * Shared PostgREST schema-drift helpers.
 *
 * The application code can be ahead of the live Supabase schema: a column that
 * exists in `supabase/schema.sql` (e.g. `is_custom_avatar`) may not exist in the
 * running database yet. PostgREST answers those requests with a hard
 * `400 / 42703 (undefined_column)` - or `PGRST204` when the schema cache is
 * stale - which used to reject the *whole* statement. A profile upsert that also
 * carried a Zcash shielded address was therefore refused in full, so the address
 * was silently lost even though the UI reported a successful save.
 *
 * These helpers detect the offending column, drop it and retry, so an outdated
 * live schema degrades gracefully instead of rejecting writes/reads entirely.
 */

export interface PostgrestErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}

export interface PostgrestResultLike<T = unknown> {
  data?: T | null;
  error?: PostgrestErrorLike | null;
}

export interface SchemaToleranceOptions {
  /** How many times a statement may be retried without a missing column. */
  maxAttempts?: number;
  /** Columns that must never be stripped (defaults to the primary key). */
  protectedItems?: readonly string[];
}

export interface SchemaTolerantUpsertResult {
  error: PostgrestErrorLike | null;
  droppedColumns: string[];
  /** The payload that was actually accepted by the database. */
  payload: Record<string, unknown>;
}

export interface SchemaTolerantSelectResult<T> {
  data: T | null;
  error: PostgrestErrorLike | null;
  droppedColumns: string[];
}

const DEFAULT_MAX_ATTEMPTS = 4;

/** Columns that must never be dropped, otherwise the statement loses its target row. */
export const PROTECTED_COLUMNS: readonly string[] = ["id"];

const MISSING_COLUMN_PATTERNS: readonly RegExp[] = [
  // 42703: `column profiles.is_custom_avatar does not exist`
  /column\s+(?:"?[\w$]+"?\.)?"?([\w$]+)"?\s+does not exist/i,
  // PGRST204: `Could not find the 'is_custom_avatar' column of 'profiles' in the schema cache`
  /could not find the '([\w$]+)' column/i,
];

/**
 * Extracts the column name PostgREST complained about, or `null` when the error
 * is unrelated to a missing column.
 */
export function extractMissingColumn(error?: PostgrestErrorLike | null): string | null {
  if (!error) return null;

  const haystack = [error.message, error.details, error.hint]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ");

  if (!haystack) return null;

  for (const pattern of MISSING_COLUMN_PATTERNS) {
    const match = pattern.exec(haystack);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * True when the database refused the request because of the credentials the
 * server used (invalid/rotated API key, expired JWT, RLS denial) rather than
 * because of the payload. Surfacing this separately stops "saved" toasts from
 * hiding a deployment whose `SUPABASE_SERVICE_ROLE_KEY` is no longer valid.
 */
export function isDatabaseAuthError(error?: PostgrestErrorLike | null): boolean {
  if (!error) return false;

  const code = (error.code || "").toUpperCase();
  if (code === "401" || code === "403" || code === "42501" || code === "PGRST301" || code === "PGRST302") {
    return true;
  }

  const haystack = `${error.message ?? ""} ${error.details ?? ""}`;
  return /invalid api key|no api key found|invalid jwt|jwt expired|unauthorized/i.test(haystack);
}

function pickKeys(record: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of keys) {
    picked[key] = record[key];
  }
  return picked;
}

/**
 * Runs `run(items)` and, while the database reports a missing column, retries the
 * call with that column removed. Returns the last response, the accepted items
 * and the list of columns the live schema does not know about.
 */
async function runToleratingMissingColumns<T>(
  items: string[],
  run: (active: string[]) => PromiseLike<PostgrestResultLike<T> | null | undefined>,
  options: SchemaToleranceOptions = {}
): Promise<{ result: PostgrestResultLike<T> | null | undefined; active: string[]; dropped: string[] }> {
  const { maxAttempts = DEFAULT_MAX_ATTEMPTS, protectedItems = PROTECTED_COLUMNS } = options;

  const active = [...items];
  const dropped: string[] = [];
  let result = await run(active);

  for (let attempt = 0; attempt < maxAttempts && result?.error; attempt++) {
    const missing = extractMissingColumn(result.error);
    if (!missing || protectedItems.includes(missing) || !active.includes(missing)) break;

    active.splice(active.indexOf(missing), 1);
    dropped.push(missing);
    result = await run(active);
  }

  return { result, active, dropped };
}

/**
 * `upsert` with tolerance for columns the live schema does not have yet.
 *
 * Use it for every `profiles` write so one unknown column can never discard the
 * rest of the payload (username, avatar, Zcash shielded address, ...).
 */
export async function upsertTolerantToSchema(
  payload: Record<string, unknown>,
  run: (record: Record<string, unknown>) => PromiseLike<PostgrestResultLike<unknown> | null | undefined>,
  options: SchemaToleranceOptions = {}
): Promise<SchemaTolerantUpsertResult> {
  const keys = Object.keys(payload);
  const { result, active, dropped } = await runToleratingMissingColumns(
    keys,
    (activeKeys) => run(pickKeys(payload, activeKeys)),
    options
  );

  return {
    error: result?.error ?? null,
    droppedColumns: dropped,
    payload: pickKeys(payload, active),
  };
}

/**
 * `select` with tolerance for columns the live schema does not have yet.
 *
 * Use it for every `profiles` read so a single missing column cannot make the
 * whole lookup fail (which previously made persisted values look "never saved").
 */
export async function selectTolerantToSchema<T>(
  columns: string[],
  run: (columns: string[]) => PromiseLike<PostgrestResultLike<T> | null | undefined>,
  options: SchemaToleranceOptions = {}
): Promise<SchemaTolerantSelectResult<T>> {
  const { result, dropped } = await runToleratingMissingColumns(columns, run, options);

  return {
    data: (result?.data ?? null) as T | null,
    error: result?.error ?? null,
    droppedColumns: dropped,
  };
}
