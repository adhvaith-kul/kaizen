import { Category } from '../types';

// ─────────────────────────────────────────────────────────────
//  EDIT THIS FILE to change the habit categories app-wide.
//  Each entry needs:
//    label  – the display name (used as the Category key)
//    emoji  – shown next to the category in forms & logs
// ─────────────────────────────────────────────────────────────
export interface CategoryMeta {
  label: Category;
  emoji: string;
}

export const DEFAULT_CATEGORIES: CategoryMeta[] = [
  { label: 'Health', emoji: '💪' },
  { label: 'Finance', emoji: '💸' },
  { label: 'Work', emoji: '💼' },
  { label: 'Upskill', emoji: '🧠' },
  { label: 'Social', emoji: '🥂' },
];

/** Plain list of category labels — use wherever a string[] is needed. */
export const DEFAULT_CATEGORY_LABELS: Category[] = DEFAULT_CATEGORIES.map(c => c.label);

/** Emoji lookup keyed by label — use wherever CATEGORY_EMOJIS Record was used. */
export const CATEGORY_EMOJI_MAP: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map(c => [c.label, c.emoji])
);
