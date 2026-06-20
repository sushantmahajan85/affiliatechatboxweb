import type { ChangeEvent, ChangeEventHandler } from "react";

const SCRIPT_BLOCK_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const STYLE_BLOCK_RE = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
const HTML_TAG_RE = /<[^>]*>/g;
const ANGLE_BRACKET_RE = /[<>＜＞]/g;
const HTML_LT_ENTITY_RE = /&lt;|&#0*60;|&#x0*3c;?/gi;
const HTML_GT_ENTITY_RE = /&gt;|&#0*62;|&#x0*3e;?/gi;

const SANITIZABLE_INPUT_TYPES = new Set([
  "text",
  "search",
  "tel",
  "url",
  "email",
]);

/** Strip HTML/script content and angle brackets from user-supplied text. */
export function sanitizePlainTextInput(input: string): string {
  if (!input) return input;

  let value = input;
  value = value.replace(SCRIPT_BLOCK_RE, "");
  value = value.replace(STYLE_BLOCK_RE, "");
  value = value.replace(HTML_TAG_RE, "");
  value = value.replace(HTML_LT_ENTITY_RE, "");
  value = value.replace(HTML_GT_ENTITY_RE, "");
  value = value.replace(ANGLE_BRACKET_RE, "");
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
  onChange(sanitizePlainTextInput(value));
}

export function sanitizeInputEventValue(
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
): void {
  if (!onChange) return;
  const sanitized = sanitizePlainTextInput(event.target.value);
  if (sanitized !== event.target.value) {
    event.target.value = sanitized;
  }
  onChange(event);
}

const MAX_SANITIZE_DEPTH = 24;

function shouldRecurse(value: unknown): value is Record<string, unknown> | unknown[] {
  if (value == null || typeof value !== "object") return false;
  if (value instanceof Date) return false;
  if (typeof Blob !== "undefined" && value instanceof Blob) return false;
  if (typeof File !== "undefined" && value instanceof File) return false;
  return true;
}

/** Deep-sanitize string fields in JSON request bodies before they leave the client. */
export function sanitizeRequestPayload<T>(value: T, depth = 0): T {
  if (depth > MAX_SANITIZE_DEPTH) return value;
  if (value == null) return value;
  if (typeof value === "string") return sanitizePlainTextInput(value) as T;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeRequestPayload(item, depth + 1)) as T;
  }
  if (!shouldRecurse(value)) return value;

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    out[key] = sanitizeRequestPayload(nested, depth + 1);
  }
  return out as T;
}

export function sanitizeFormData(formData: FormData): FormData {
  const sanitized = new FormData();
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      sanitized.append(key, sanitizePlainTextInput(value));
    } else {
      sanitized.append(key, value);
    }
  }
  return sanitized;
}

import type { FetchArgs } from '@reduxjs/toolkit/query';

export function sanitizeFetchArgs(args: string | FetchArgs): string | FetchArgs {
  if (typeof args === "string") return args;

  const method = String(args.method || "GET").toUpperCase();
  if (!["POST", "PUT", "PATCH"].includes(method) || args.body == null) {
    return args;
  }

  if (typeof FormData !== "undefined" && args.body instanceof FormData) {
    return { ...args, body: sanitizeFormData(args.body) };
  }

  if (typeof args.body === "string") {
    try {
      const parsed = JSON.parse(args.body);
      return { ...args, body: JSON.stringify(sanitizeRequestPayload(parsed)) };
    } catch {
      return { ...args, body: sanitizePlainTextInput(args.body) };
    }
  }

  if (typeof args.body === "object") {
    return { ...args, body: sanitizeRequestPayload(args.body) };
  }

  return args;
}
