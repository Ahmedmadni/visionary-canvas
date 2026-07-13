/**
 * Scene 01 — asset validation.
 *
 * Two cheap network checks stand between "a URL" and "we tried to decode
 * a corrupt file and threw in the middle of the render loop":
 *
 *   probe()  — HEAD request: does the file exist, how big is it, and does
 *              the server label it plausibly?
 *   sniff()  — GETs the first bytes and compares them to the format's
 *              magic signature, so a truncated / mislabelled / HTML-error
 *              file is rejected BEFORE it reaches a Three.js loader.
 *
 * Both are pure-ish (network only, no Three.js) and fully guarded, so a
 * failure always resolves to a verdict rather than throwing.
 */

import type { Scene01AssetSpec, Scene01ValidationSpec } from "./types";

const SNIFF_BYTES = 64;

export interface ProbeResult {
  available: boolean;
  status: number;
  sizeBytes: number | null;
  contentType: string | null;
}

export async function probe(url: string, signal?: AbortSignal): Promise<ProbeResult> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-cache", signal });
    const len = res.headers.get("content-length");
    return {
      available: res.ok,
      status: res.status,
      sizeBytes: len != null ? Number(len) : null,
      contentType: res.headers.get("content-type"),
    };
  } catch {
    // Network error / abort → treat as unavailable, never throw.
    return { available: false, status: 0, sizeBytes: null, contentType: null };
  }
}

export interface SniffResult {
  valid: boolean;
  reason?: string;
}

function bytesToHex(buf: Uint8Array): string {
  let out = "";
  for (let i = 0; i < buf.length; i += 1) out += buf[i].toString(16).padStart(2, "0");
  return out;
}

function bytesToAscii(buf: Uint8Array): string {
  let out = "";
  for (let i = 0; i < buf.length; i += 1) out += String.fromCharCode(buf[i]);
  return out;
}

/**
 * Pure magic-signature test — does the file head contain any expected
 * signature? Hex signatures match against the hex dump; text signatures
 * (e.g. "#?RADIANCE") match against the ASCII view. A signature counts as
 * a hit anywhere in the head, since some containers (MP4 `ftyp`) sit a few
 * bytes in. Extracted for unit testing without a network round-trip.
 */
export function magicMatches(head: Uint8Array, magic: readonly string[]): boolean {
  if (magic.length === 0) return true;
  if (head.length === 0) return false;
  const hex = bytesToHex(head).toLowerCase();
  const ascii = bytesToAscii(head).toUpperCase();
  return magic.some((sig) => {
    const isHex = /^[0-9a-f]+$/i.test(sig) && sig.length % 2 === 0;
    return isHex ? hex.includes(sig.toLowerCase()) : ascii.includes(sig.toUpperCase());
  });
}

/**
 * Confirm the file head matches one of the expected magic signatures.
 * `magic` entries are either hex (even-length, no spaces) or an ASCII
 * signature (e.g. "#?RADIANCE"). A magic that appears anywhere in the
 * first `SNIFF_BYTES` counts as a hit — some container formats (MP4
 * `ftyp`) sit a few bytes in.
 */
export async function sniff(
  url: string,
  validation: Scene01ValidationSpec,
  signal?: AbortSignal,
): Promise<SniffResult> {
  if (validation.magic.length === 0) return { valid: true };

  try {
    const res = await fetch(url, {
      headers: { Range: `bytes=0-${SNIFF_BYTES - 1}` },
      cache: "no-cache",
      signal,
    });
    if (!res.ok && res.status !== 206) {
      return { valid: false, reason: `sniff fetch status ${res.status}` };
    }
    const head = new Uint8Array(await res.arrayBuffer());
    if (head.length === 0) return { valid: false, reason: "empty file" };

    return magicMatches(head, validation.magic)
      ? { valid: true }
      : { valid: false, reason: `magic mismatch (head: ${bytesToHex(head).slice(0, 24)}…)` };
  } catch {
    return { valid: false, reason: "sniff network error" };
  }
}

export interface ValidationVerdict {
  ok: boolean;
  available: boolean;
  reason?: string;
  probe: ProbeResult;
  /** Non-fatal advisories (e.g. file larger than the briefed budget). */
  warnings: string[];
}

/**
 * Full pre-decode gate: probe for existence, sniff for integrity, and
 * compare the delivered size against the briefed budget (advisory only).
 */
export async function validate(
  url: string,
  validation: Scene01ValidationSpec,
  spec: Scene01AssetSpec,
  signal?: AbortSignal,
): Promise<ValidationVerdict> {
  const probeResult = await probe(url, signal);
  const warnings: string[] = [];

  if (!probeResult.available) {
    return {
      ok: false,
      available: false,
      reason: `not available (status ${probeResult.status})`,
      probe: probeResult,
      warnings,
    };
  }

  if (
    probeResult.contentType &&
    validation.contentTypes.length > 0 &&
    !validation.contentTypes.some((ct) => probeResult.contentType!.startsWith(ct))
  ) {
    warnings.push(`unexpected content-type "${probeResult.contentType}"`);
  }

  if (probeResult.sizeBytes != null) {
    const mb = probeResult.sizeBytes / (1024 * 1024);
    if (mb > spec.maxFileSizeMb) {
      warnings.push(`file ${mb.toFixed(1)}MB exceeds budget ${spec.maxFileSizeMb}MB`);
    }
    if (probeResult.sizeBytes < 16) {
      return {
        ok: false,
        available: true,
        reason: "file too small to be valid",
        probe: probeResult,
        warnings,
      };
    }
  }

  const sniffResult = await sniff(url, validation, signal);
  if (!sniffResult.valid) {
    return {
      ok: false,
      available: true,
      reason: sniffResult.reason ?? "corrupt file",
      probe: probeResult,
      warnings,
    };
  }

  return { ok: true, available: true, probe: probeResult, warnings };
}
