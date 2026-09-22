import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const linked = searchParams.get("linked");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const rawNext = searchParams.get("next") ?? "/";
  // Validate next parameter to prevent open-redirect vulnerabilities
  const safeNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\") ? rawNext : "/";

  // If OAuth error occurred (e.g. identity already linked or user cancelled)
  if (error || errorDescription) {
    const errorMsg = errorDescription || error || "Authentication failed.";
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(errorMsg)}`);
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project")) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        await supabase.auth.exchangeCodeForSession(code);
      } catch (err) {
        console.warn("Server-side code exchange skipped or failed:", err);
      }
    }
  }

  const redirectUrl = new URL(safeNext, origin);

  // Forward PKCE code to client so browser-based supabase-js can complete exchange with localStorage verifier
  if (code) {
    redirectUrl.searchParams.set("code", code);
  }

  // Preserve identity linking status flag if present
  if (linked) {
    redirectUrl.searchParams.set("linked", linked);
  }

  return NextResponse.redirect(redirectUrl.toString());
}
