import type { ChangeEvent, ChangeEventHandler } from "react";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import { toast } from "sonner";

const SCRIPT_BLOCK_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i;
const STYLE_BLOCK_RE = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/i;
const HTML_TAG_RE = /<[^>]*>/;
const ANGLE_BRACKET_RE = /[<>＜＞]/;
const HTML_LT_ENTITY_RE = /&lt;|&#0*60;|&#x0*3c;?/i;
const HTML_GT_ENTITY_RE = /&gt;|&#0*62;|&#x0*3e;?/i;
const JS_PROTOCOL_RE = /javascript\s*:/i;
const EVENT_HANDLER_RE = /\bon[a-z]+\s*=/i;

export const DANGEROUS_INPUT_MESSAGE =
  "Input contains characters that are not allowed (<, >, HTML tags, or script content). Please remove them.";

const SANITIZABLE_INPUT_TYPES = new Set([
  "text",
  "search",
  "tel",
  "url",
  "email",
]);

const SKIP_VALIDATION_KEYS = new Set([
  "password",
  "oldpassword",
  "newpassword",
  "confirmpassword",
  "code",
  "otp",
  "token",
  "jwttoken",
  "linkedinaccesstoken",
  "accesstoken",
  "refreshtoken",
  "fcmtoken",
  "webfcmtoken",
]);

const MAX_VALIDATE_DEPTH = 24;

/** True when a string contains XSS-related markup or angle brackets. */
export function containsDangerousPlainText(input: string): boolean {
  if (!input) return false;
  return (
    SCRIPT_BLOCK_RE.test(input) ||
    STYLE_BLOCK_RE.test(input) ||
    HTML_TAG_RE.test(input) ||
    ANGLE_BRACKET_RE.test(input) ||
    HTML_LT_ENTITY_RE.test(input) ||
    HTML_GT_ENTITY_RE.test(input) ||
    JS_PROTOCOL_RE.test(input) ||
    EVENT_HANDLER_RE.test(input)
  );
}

function shouldSkipValidationKey(key: string): boolean {
  return SKIP_VALIDATION_KEYS.has(String(key || "").toLowerCase());
}

function shouldRecurse(value: unknown): value is Record<string, unknown> | unknown[] {
  if (value == null || typeof value !== "object") return false;
  if (value instanceof Date) return false;
  if (typeof Blob !== "undefined" && value instanceof Blob) return false;
  if (typeof File !== "undefined" && value instanceof File) return false;
  return true;
}

/** Returns the first offending field path, or null if all strings are safe. */
export function findDangerousPlainTextInValue(
  value: unknown,
  depth = 0,
  path = ""
): string | null {
  if (depth > MAX_VALIDATE_DEPTH) return null;
  if (value == null) return null;

  if (typeof value === "string") {
    return containsDangerousPlainText(value) ? path || "input" : null;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = findDangerousPlainTextInValue(value[i], depth + 1, `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }

  if (!shouldRecurse(value)) return null;

  for (const [key, nested] of Object.entries(value)) {
    if (shouldSkipValidationKey(key)) continue;
    const nextPath = path ? `${path}.${key}` : key;
    const hit = findDangerousPlainTextInValue(nested, depth + 1, nextPath);
    if (hit) return hit;
  }

  return null;
}

export function validatePlainTextFields(
  fields: Record<string, string | undefined | null>
): string | null {
  for (const [key, value] of Object.entries(fields)) {
    if (shouldSkipValidationKey(key)) continue;
    if (typeof value === "string" && containsDangerousPlainText(value)) {
      return key;
    }
  }
  return null;
}

/** Validate strings before submit; shows a toast and returns false when unsafe. */
export function assertSafePlainTextOnSubmit(
  value: string,
  options?: { silent?: boolean }
): boolean {
  if (!containsDangerousPlainText(value)) return true;
  if (!options?.silent) toast.error(DANGEROUS_INPUT_MESSAGE);
  return false;
}

export function assertSafePlainTextFieldsOnSubmit(
  fields: Record<string, string | undefined | null>
): boolean {
  const bad = validatePlainTextFields(fields);
  if (!bad) return true;
  toast.error(DANGEROUS_INPUT_MESSAGE);
  return false;
}

/** @deprecated Prefer validate-on-submit; kept for legacy callers that strip silently. */
export function sanitizePlainTextInput(input: string): string {
  if (!input) return input;

  let value = input;
  value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  value = value.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  value = value.replace(/<[^>]*>/g, "");
  value = value.replace(/&lt;|&#0*60;|&#x0*3c;?/gi, "");
  value = value.replace(/&gt;|&#0*62;|&#x0*3e;?/gi, "");
  value = value.replace(/[<>＜＞]/g, "");
  return value;
}

export function shouldSanitizeInputType(type?: string): boolean {
  if (!type) return true;
  return SANITIZABLE_INPUT_TYPES.has(type);
}

export function sanitizeTextOnChange(
  value: string,
  onChange: (value: string) => void
): void {
  onChange(value);
}

export function sanitizeInputEventValue(
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
): void {
  onChange?.(event);
}

export function validateFormDataStrings(formData: FormData): string | null {
  for (const [key, value] of formData.entries()) {
    if (shouldSkipValidationKey(key)) continue;
    if (typeof value === "string") {
      const hit = findDangerousPlainTextInValue(value, 0, key);
      if (hit) return hit;
    }
  }
  return null;
}

export function validateFetchArgs(
  args: string | FetchArgs
): { ok: true; args: string | FetchArgs } | { ok: false; message: string } {
  if (typeof args === "string") return { ok: true, args };

  const method = String(args.method || "GET").toUpperCase();
  if (!["POST", "PUT", "PATCH"].includes(method) || args.body == null) {
    return { ok: true, args };
  }

  if (typeof FormData !== "undefined" && args.body instanceof FormData) {
    const badField = validateFormDataStrings(args.body);
    if (badField) return { ok: false, message: DANGEROUS_INPUT_MESSAGE };
    return { ok: true, args };
  }

  if (typeof args.body === "string") {
    try {
      const parsed = JSON.parse(args.body);
      const badField = findDangerousPlainTextInValue(parsed);
      if (badField) return { ok: false, message: DANGEROUS_INPUT_MESSAGE };
    } catch {
      if (containsDangerousPlainText(args.body)) {
        return { ok: false, message: DANGEROUS_INPUT_MESSAGE };
      }
    }
    return { ok: true, args };
  }

  if (typeof args.body === "object") {
    const badField = findDangerousPlainTextInValue(args.body);
    if (badField) return { ok: false, message: DANGEROUS_INPUT_MESSAGE };
  }

  return { ok: true, args };
}

/** @deprecated Use validateFetchArgs in the API client instead of mutating payloads. */
export function sanitizeRequestPayload<T>(value: T, depth = 0): T {
  return value;
}

/** @deprecated Use validateFetchArgs in the API client instead of mutating payloads. */
export function sanitizeFormData(formData: FormData): FormData {
  return formData;
}

/** @deprecated Use validateFetchArgs in the API client instead of mutating payloads. */
export function sanitizeFetchArgs(args: string | FetchArgs): string | FetchArgs {
  return args;
}
