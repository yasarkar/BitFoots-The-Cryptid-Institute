import { NextRequest, NextResponse } from "next/server";
import { assertJsonRequest, getClientKey, rateLimit } from "@/lib/apiGuard";
import { issueRunToken } from "@/lib/runTokens";
import { isChapterId, type ChapterId } from "@/lib/scoring";

export const dynamic = "force-dynamic";

interface ChapterStartRequest {
  chapterId: number;
}

/**
 * Issues a single-use run token (SEC-4).
 *
 * The client must call this when a sector run actually begins; the completion
 * route then derives the run duration from the server-side issue timestamp
 * instead of trusting `startTime`/`endTime` supplied by the browser.
 */
export async function POST(req: NextRequest) {
  try {
    const guardError = assertJsonRequest(req);
    if (guardError) {
      return NextResponse.json({ success: false, error: guardError.error }, { status: guardError.status });
    }

    if (!rateLimit(getClientKey(req, "chapter-start"), 30, 60_000)) {
      return NextResponse.json(
        { success: false, error: "Too many run token requests. Please slow down." },
        { status: 429 }
      );
    }

    const body: ChapterStartRequest = await req.json().catch(() => ({}) as ChapterStartRequest);

    // Validate the raw value: sector ids are numeric, never coerced strings.
    if (!isChapterId(body?.chapterId)) {
      return NextResponse.json(
        { success: false, error: "Invalid sector ID for run token." },
        { status: 400 }
      );
    }

    const chapterId: ChapterId = body.chapterId;
    const issuedAt = Date.now();
    const runToken = issueRunToken(chapterId, issuedAt);

    return NextResponse.json({
      success: true,
      chapterId,
      runToken,
      issuedAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to issue run verification token.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
