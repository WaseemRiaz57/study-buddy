import { UAParser } from "ua-parser-js";

/**
 * Account-security helpers — kept framework-agnostic and side-effect free so they
 * can be reused by API routes, the auth callbacks, and (where relevant) tests.
 */

export type DeviceType = "laptop" | "phone" | "tablet";

export interface ParsedDevice {
  /** Friendly device label, e.g. "Apple iPhone" or "Windows Desktop". */
  device: string;
  /** Operating system, e.g. "macOS 13.4". */
  os: string;
  /** Browser + major version, e.g. "Chrome 124". */
  browser: string;
  /** Coarse device class used to pick an icon on the client. */
  deviceType: DeviceType;
}

/**
 * Parse a raw User-Agent string into a stable, display-ready device descriptor.
 * Falls back gracefully when the UA is missing or unrecognised.
 */
export function parseUserAgent(uaString: string | null | undefined): ParsedDevice {
  const result = new UAParser(uaString || "").getResult();

  const browserName = result.browser.name || "Unknown browser";
  const browserMajor = result.browser.version
    ? ` ${result.browser.version.split(".")[0]}`
    : "";
  const osName = result.os.name || "Unknown OS";
  const osVersion = result.os.version ? ` ${result.os.version}` : "";

  const type = result.device.type; // "mobile" | "tablet" | undefined (desktop)
  let deviceType: DeviceType = "laptop";
  if (type === "mobile") deviceType = "phone";
  else if (type === "tablet") deviceType = "tablet";

  let device: string;
  if (result.device.model) {
    device = [result.device.vendor, result.device.model].filter(Boolean).join(" ");
  } else {
    device = `${osName} ${deviceType === "laptop" ? "Desktop" : "Device"}`;
  }

  return {
    device: device.trim() || "Unknown device",
    os: `${osName}${osVersion}`.trim(),
    browser: `${browserName}${browserMajor}`.trim(),
    deviceType,
  };
}

/**
 * Password strength gate used both client- and server-side: minimum 8 chars with
 * at least one letter and one number. Kept intentionally simple and predictable.
 */
export function isStrongPassword(password: string | null | undefined): boolean {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

export interface SecurityScoreInput {
  mfaEnabled: boolean;
  passwordStrong: boolean;
}

/**
 * Security score algorithm: base 50, +25 when any MFA factor is enabled,
 * +25 when the account has a verified-strong password. Range: 50–100.
 */
export function computeSecurityScore({
  mfaEnabled,
  passwordStrong,
}: SecurityScoreInput): number {
  let score = 50;
  if (mfaEnabled) score += 25;
  if (passwordStrong) score += 25;
  return score;
}

export type SecurityTone = "strong" | "moderate" | "weak";

/** Human-readable status derived from the numeric score. */
export function securityScoreStatus(score: number): {
  tone: SecurityTone;
  label: string;
  headline: string;
} {
  if (score >= 90) {
    return { tone: "strong", label: "Strong", headline: "Your account is well protected" };
  }
  if (score >= 70) {
    return { tone: "moderate", label: "Moderate", headline: "Your account could be safer" };
  }
  return { tone: "weak", label: "At Risk", headline: "Your account needs attention" };
}

/**
 * Best-effort network/location extraction from request headers. Works with the
 * geo headers injected by common edge providers (Vercel / Cloudflare) and never
 * throws — returns sensible fallbacks for local/dev requests.
 */
export function getRequestNetworkInfo(
  get: (key: string) => string | null | undefined
): { ipAddress: string; location: string } {
  const forwarded = (get("x-forwarded-for") || "").split(",")[0]?.trim();
  const ipAddress = forwarded || get("x-real-ip") || "";

  const decode = (value: string | null | undefined) => {
    if (!value) return "";
    try {
      return decodeURIComponent(value).trim();
    } catch {
      return value.trim();
    }
  };

  const city = decode(get("x-vercel-ip-city")) || decode(get("cf-ipcity"));
  const country =
    (get("x-vercel-ip-country") || get("cf-ipcountry") || "").trim();

  const location = [city, country].filter(Boolean).join(", ") || "Unknown location";

  return { ipAddress, location };
}
