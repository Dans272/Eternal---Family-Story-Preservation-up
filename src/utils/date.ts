
import { MONTHS } from '../constants.tsx';
import { gedcomDateToSortKey } from './gedcom';

// Re-export for backward compatibility
export const parseGedcomDate = gedcomDateToSortKey;

export const parseGedcomMonthDayYear = (dateStr?: string) => {
  if (!dateStr) return {};
  const cleaned = dateStr.toUpperCase().replace(/ABT\.?|EST\.?|BEF\.?|AFT\.?|BET\.?|AND\b|CAL\.?/g, '').trim();
  const yearMatch = cleaned.match(/\b(\d{4})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
  const monthIndex = MONTHS.findIndex((m) => new RegExp(`\\b${m}\\b`).test(cleaned));
  const month = monthIndex >= 0 ? monthIndex + 1 : undefined;
  let day: number | undefined;
  if (month) {
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const mIdx = parts.findIndex((p) => p === MONTHS[month - 1]);
    if (mIdx > 0) {
      const candidate = parseInt(parts[mIdx - 1], 10);
      if (!Number.isNaN(candidate) && candidate >= 1 && candidate <= 31) day = candidate;
    }
  }
  return { month, day, year };
};

export const formatFullDate = (dateStr?: string): string => {
  if (!dateStr) return 'Undated';
  // Strip GEDCOM qualifiers for display
  const clean = dateStr.replace(/^(ABT\.?|EST\.?|BEF\.?|AFT\.?|CAL\.?|CIR\.?|CIRCA)\s*/i, '').trim();
  const { month, day, year } = parseGedcomMonthDayYear(dateStr);
  if (year && month && day) {
    try {
      return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      });
    } catch { /* fall through */ }
  }
  if (year && month) {
    const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
    return `${monthName} ${year}`;
  }
  if (year) return String(year);
  return clean || 'Undated';
};
