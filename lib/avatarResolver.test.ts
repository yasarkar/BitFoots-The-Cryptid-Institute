import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getAvatarDataUri,
  isAllowedRemoteAvatarUrl,
  readDefaultAvatarDataUri,
  resolveLocalAvatarPath,
} from "./avatarResolver";

const DEFAULT_HEAD_PUBLIC_PATH = "/bitfoot-heads/bitfoot-head-01.png";

function fakeResponse(options: { ok?: boolean; contentType?: string; bytes?: number } = {}) {
  const { ok = true, contentType = "image/png", bytes = 8 } = options;
  return {
    ok,
    headers: {
      get: (name: string) => (name.toLowerCase() === "content-type" ? contentType : null),
    },
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveLocalAvatarPath", () => {
  it("resolves a legitimate head inside /public", () => {
    const resolved = resolveLocalAvatarPath(DEFAULT_HEAD_PUBLIC_PATH);
    expect(resolved).toBeTruthy();
    expect(resolved).toContain("public");
    expect(resolved).toContain("bitfoot-head-01.png");
  });

  it("blocks path traversal payloads (SEC-1 regression)", () => {
    const attacks = [
      "../.env.local",
      "../../.env.local",
      "bitfoot-heads/../../.env.local",
      "bitfoot-heads/./../../.env.local",
      "..\\..\\.env.local",
      "C:\\Windows\\win.ini",
      "/etc/passwd",
      "///etc/passwd",
      "%2e%2e/%2e%2e/.env.local",
      "bitfoot-heads/\0head.png",
    ];

    for (const attack of attacks) {
      expect(resolveLocalAvatarPath(attack)).toBeNull();
    }
  });

  it("rejects missing files, directories and oversized paths", () => {
    expect(resolveLocalAvatarPath("/bitfoot-heads/does-not-exist.png")).toBeNull();
    expect(resolveLocalAvatarPath("/bitfoot-heads")).toBeNull();
    expect(resolveLocalAvatarPath("")).toBeNull();
    expect(resolveLocalAvatarPath("a".repeat(300))).toBeNull();
  });
});

describe("isAllowedRemoteAvatarUrl", () => {
  it("allows https URLs on the avatar host allow-list", () => {
    expect(isAllowedRemoteAvatarUrl("https://pbs.twimg.com/profile_images/1/avatar.jpg")).toBe(true);
    expect(isAllowedRemoteAvatarUrl("https://lh3.googleusercontent.com/a/abc")).toBe(true);
  });

  it("blocks SSRF and downgrade attempts", () => {
    const attacks = [
      "http://pbs.twimg.com/avatar.jpg",
      "https://169.254.169.254/latest/meta-data/",
      "https://localhost:3000/secret",
      "https://127.0.0.1/secret.png",
      "https://evil.example.com/avatar.png",
      "https://pbs.twimg.com.evil.example.com/avatar.png",
      "file:///etc/passwd",
      "data:image/png;base64,AAA",
      "not a url",
      "",
    ];

    for (const attack of attacks) {
      expect(isAllowedRemoteAvatarUrl(attack)).toBe(false);
    }
  });
});

describe("getAvatarDataUri", () => {
  it("returns the bundled default head for empty input", async () => {
    const fallback = readDefaultAvatarDataUri();
    expect(fallback.startsWith("data:image/png;base64,")).toBe(true);
    expect(await getAvatarDataUri(null)).toBe(fallback);
    expect(await getAvatarDataUri("   ")).toBe(fallback);
  });

  it("never returns file content from outside /public (SEC-1 regression)", async () => {
    const fallback = readDefaultAvatarDataUri();
    const attacks = ["../../.env.local", "bitfoot-heads/../../package.json", "..\\..\\package.json"];

    for (const attack of attacks) {
      expect(await getAvatarDataUri(attack)).toBe(fallback);
    }
  });

  it("accepts a real head image from /public", async () => {
    const uri = await getAvatarDataUri("/bitfoot-heads/bitfoot-head-02.png");
    expect(uri.startsWith("data:image/png;base64,")).toBe(true);
    expect(uri).not.toBe(readDefaultAvatarDataUri());
  });

  it("keeps image data URIs and drops inline html/svg payloads", async () => {
    const png = "data:image/png;base64,iVBORw0KGgo=";
    expect(await getAvatarDataUri(png)).toBe(png);
    expect(await getAvatarDataUri("data:image/svg+xml;base64,PHN2Zz4=")).toBe(readDefaultAvatarDataUri());
    expect(await getAvatarDataUri("data:text/html;base64,PHNjcmlwdD4=")).toBe(readDefaultAvatarDataUri());
  });

  it("does not even attempt to fetch non allow-listed hosts", async () => {
    const fetchSpy = vi.fn(async () => fakeResponse());
    vi.stubGlobal("fetch", fetchSpy);

    const uri = await getAvatarDataUri("https://169.254.169.254/latest/meta-data/");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(uri).toBe(readDefaultAvatarDataUri());
  });

  it("only accepts bounded image responses from allow-listed hosts", async () => {
    const fetchSpy = vi.fn(async () => fakeResponse({ contentType: "image/png", bytes: 8 }));
    vi.stubGlobal("fetch", fetchSpy);

    const uri = await getAvatarDataUri("https://pbs.twimg.com/avatar.png");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(uri.startsWith("data:image/png;base64,")).toBe(true);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fakeResponse({ contentType: "text/html" }))
    );
    expect(await getAvatarDataUri("https://pbs.twimg.com/avatar.png")).toBe(readDefaultAvatarDataUri());

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fakeResponse({ ok: false }))
    );
    expect(await getAvatarDataUri("https://pbs.twimg.com/avatar.png")).toBe(readDefaultAvatarDataUri());

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      })
    );
    expect(await getAvatarDataUri("https://pbs.twimg.com/avatar.png")).toBe(readDefaultAvatarDataUri());
  });
});
