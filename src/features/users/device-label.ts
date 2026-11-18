/** A short, human label for a session's user agent: "Chrome on Windows". Rough by design. */

const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/Android/, "Android"],
  [/iPhone|iPad|iPod/, "iOS"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/CrOS/, "ChromeOS"],
  [/Linux/, "Linux"],
];

const first = (ua: string, table: [RegExp, string][]) => table.find(([pattern]) => pattern.test(ua))?.[1];

export function deviceLabel(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";
  const browser = first(userAgent, BROWSERS);
  const system = first(userAgent, SYSTEMS);
  if (browser && system) return `${browser} on ${system}`;
  return browser ?? system ?? "Unknown device";
}
