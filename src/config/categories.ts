import { Category } from '../types';

export interface CategoryMeta {
  label: Category;
  emoji: string;
}

export const DEFAULT_CATEGORIES: CategoryMeta[] = [
  { label: 'Health', emoji: '' },
  { label: 'Finance', emoji: '' },
  { label: 'Work', emoji: '' },
  { label: 'Upskill', emoji: '' },
  { label: 'Social', emoji: '' },
];

/** Plain list of category labels — use wherever a string[] is needed. */
export const DEFAULT_CATEGORY_LABELS: Category[] = DEFAULT_CATEGORIES.map(c => c.label);

/** Emoji lookup keyed by label — returns empty string or label */
export const CATEGORY_EMOJI_MAP: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map(c => [c.label, c.emoji || ''])
);
