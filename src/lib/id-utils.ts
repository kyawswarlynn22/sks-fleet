/**
 * Utility functions for handling ID conversions between different data types
 * (UUID strings vs integer IDs) consistently across the codebase.
 */

/**
 * Converts any ID type to a string for use in React keys, Select values, etc.
 */
export function toStringId(id: string | number | null | undefined): string {
  if (id === null || id === undefined) return "";
  return String(id);
}

/**
 * Compares two IDs for equality, handling both string and number types.
 */
export function idsMatch(
  id1: string | number | null | undefined,
  id2: string | number | null | undefined
): boolean {
  if (id1 === null || id1 === undefined || id2 === null || id2 === undefined) {
    return false;
  }
  return String(id1) === String(id2);
}

/**
 * Formats an ID for display (truncates long UUIDs, shows full integers).
 */
export function formatIdForDisplay(
  id: string | number | null | undefined,
  maxLength: number = 8
): string {
  if (id === null || id === undefined) return "—";
  const strId = String(id);
  // If it's a UUID (contains hyphens and is long), truncate it
  if (strId.includes("-") && strId.length > maxLength) {
    return strId.slice(0, maxLength);
  }
  // For integers or short strings, show the full value
  return strId;
}

/**
 * Finds an item in an array by ID, comparing as strings.
 */
export function findById<T extends { id: string | number }>(
  items: T[] | null | undefined,
  id: string | number | null | undefined
): T | undefined {
  if (!items || id === null || id === undefined) return undefined;
  return items.find((item) => idsMatch(item.id, id));
}

/**
 * Filters items by matching ID field.
 */
export function filterById<T extends Record<string, any>>(
  items: T[] | null | undefined,
  idField: keyof T,
  id: string | number | null | undefined
): T[] {
  if (!items || id === null || id === undefined) return [];
  return items.filter((item) => idsMatch(item[idField], id));
}
