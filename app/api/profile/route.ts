import { NextRequest, NextResponse } from "next/server";
import { isValidUuid } from "@/lib/uuid";
import { assertJsonRequest, getClientKey, rateLimit } from "@/lib/apiGuard";
import { sanitizeUnlockedSectors } from "@/lib/scoring";
import { supabaseAdmin, isSupabaseAnyConfigured } from "@/lib/supabaseAdmin";
import { isDatabaseAuthError, upsertTolerantToSchema } from "@/lib/postgrest";

export const dynamic = "force-dynamic";

const USERNAME_MAX_LENGTH = 40;
const AVATAR_URL_MAX_LENGTH = 512;
const ZCASH_ADDRESS_MAX_LENGTH = 320; // Zcash Unified Addresses (u1...) are typically 213+ characters
const FALLBACK_AVATAR_URL = "/bitfoot-heads/bitfoot-head-01.png";

export interface ProfileSyncRequest {
  userId: string;
  username?: string;
  avatarUrl?: string;
  isCustomAvatar?: boolean;
  zcashAddress?: string;
  isGuest?: boolean;
  unlockedSectors?: number[];
}

function sanitizeUsername(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, USERNAME_MAX_LENGTH);
  return trimmed || undefined;
}

function sanitizeAvatarUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > AVATAR_URL_MAX_LENGTH) return FALLBACK_AVATAR_URL;
  if (trimmed.includes("..") || trimmed.includes("\\")) return FALLBACK_AVATAR_URL;
  if (trimmed.startsWith("/") || trimmed.startsWith("https://")) return trimmed;
  return FALLBACK_AVATAR_URL;
}

function sanitizeZcashAddress(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > ZCASH_ADDRESS_MAX_LENGTH) return undefined;
  return trimmed;
}

/**
 * SEC-3: guest and self-service profile writes.
 *
 * The `profiles` RLS policy no longer permits anonymous clients to modify
 * rows, so the browser posts the (sanitised) delta here and the service role
 * performs the upsert after validation.
 */
export async function POST(req: NextRequest) {
  try {
    const guardError = assertJsonRequest(req);
    if (guardError) {
      return NextResponse.json({ success: false, error: guardError.error }, { status: guardError.status });
    }

    if (!rateLimit(getClientKey(req, "profile-sync"), 30, 60_000)) {
      return NextResponse.json(
        { success: false, error: "Too many profile sync requests. Please slow down." },
        { status: 429 }
      );
    }

    const body: ProfileSyncRequest | null = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Malformed profile sync payload." }, { status: 400 });
    }

    // A hunter can only ever write the row that matches its own UUID.
    if (!isValidUuid(body.userId || "")) {
      return NextResponse.json({ success: false, error: "Invalid hunter ID format." }, { status: 400 });
    }

    const username = sanitizeUsername(body.username);
    const avatarUrl = sanitizeAvatarUrl(body.avatarUrl);
    const zcashAddress = sanitizeZcashAddress(body.zcashAddress);
    const unlockedSectors =
      body.unlockedSectors === undefined ? undefined : sanitizeUnlockedSectors(body.unlockedSectors);
    const isCustomAvatar = body.isCustomAvatar !== undefined ? Boolean(body.isCustomAvatar) : undefined;

    const record: Record<string, unknown> = {
      id: body.userId,
      updated_at: new Date().toISOString(),
    };

    if (username) record.x_username = username;
    if (avatarUrl) record.x_avatar_url = avatarUrl;
    if (isCustomAvatar !== undefined) record.is_custom_avatar = isCustomAvatar;
    if (zcashAddress) record.zcash_address = zcashAddress;
    if (body.isGuest !== undefined) record.is_guest = Boolean(body.isGuest);
    if (unlockedSectors) record.unlocked_sectors = unlockedSectors;

    if (Object.keys(record).length <= 2) {
      return NextResponse.json(
        { success: false, error: "No profile fields supplied for sync." },
        { status: 400 }
      );
    }

    let isLiveSupabase = false;
    let droppedColumns: string[] = [];

    if (isSupabaseAnyConfigured && supabaseAdmin) {
      const client = supabaseAdmin;

      // The live database may lag behind `supabase/schema.sql` (e.g. it can still
      // miss `is_custom_avatar`). PostgREST then rejects the whole statement, so a
      // save that also carried a Zcash shielded address used to be discarded in
      // full. Retry without the unknown column instead of losing the rest.
      const {
        error,
        droppedColumns: schemaMisses,
        payload,
      } = await upsertTolerantToSchema(record, (nextPayload) =>
        client.from("profiles").upsert(nextPayload, { onConflict: "id" })
      );

      droppedColumns = schemaMisses;

      if (error) {
        console.error("Supabase profile sync failed:", error.message);
        return NextResponse.json(
          {
            success: false,
            error: isDatabaseAuthError(error)
              ? "Profile sync rejected: the server key was refused by the database. Set a valid SUPABASE_SERVICE_ROLE_KEY (and run supabase/schema.sql)."
              : "Profile sync rejected by the database.",
            details: error.message,
          },
          { status: 500 }
        );
      }

      if (Object.keys(payload).length <= 2) {
        // Only `id` + `updated_at` survived: nothing the client asked for could be stored.
        return NextResponse.json(
          {
            success: false,
            error: `Live database schema is missing every supplied profile column (${droppedColumns.join(
              ", "
            )}). Run supabase/schema.sql.`,
          },
          { status: 500 }
        );
      }

      if (droppedColumns.length > 0) {
        console.warn(
          `Profile sync skipped columns missing from the live schema (${droppedColumns.join(
            ", "
          )}). Run supabase/schema.sql so the database matches the application code.`
        );
      }

      isLiveSupabase = true;
    }

    return NextResponse.json({
      success: true,
      isLiveSupabase,
      userId: body.userId,
      unlockedSectors: unlockedSectors ?? null,
      droppedColumns,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to sync hunter profile.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
