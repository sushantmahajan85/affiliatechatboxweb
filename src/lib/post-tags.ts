export const GENERAL_POST_TYPE = "general";
const LEGACY_GENERAL_POST_TYPE = "blank";

export function isGeneralPostType(tag?: string | null): boolean {
  return !tag || tag === GENERAL_POST_TYPE || tag === LEGACY_GENERAL_POST_TYPE;
}

export function getPostTypeLabel(tag?: string | null): string {
  return isGeneralPostType(tag) ? "General" : (tag ?? "General");
}

export function parsePostHashtags(postDescription?: string | null): string[] {
  if (!postDescription?.trim()) return [];

  const matches = postDescription.match(/#[\w-]+/gi);
  if (!matches) return [];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const match of matches) {
    const label = match.slice(1);
    const key = label.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      tags.push(label);
    }
  }

  return tags;
}
