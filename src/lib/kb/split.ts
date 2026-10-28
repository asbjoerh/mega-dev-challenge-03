// How #4471 splits into the problems it holds, counted the way the desk counts (CauseTable): every
// report under its cause from causes.ts. The desk's notes (desk-notes.json) mark the reports that
// are a one-day move, not a swap: they stay counted where they're filed and also make up `shift`.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'shift';

export const PROBLEMS: Record<Problem, { what: string; seenAs: string }> = {
  parser: {
    what: 'The shared parser reads every date month first; day-first tenants get day and month swapped.',
    seenAs: '7 April arrives as 4 July',
  },
  hint: {
    what: 'booking-v3 prints MM/DD/YYYY under its date field for day-first tenants; people type month first, the form reads it day first.',
    seenAs: 'same swap, only through booking-v3 forms',
  },
  shift: {
    what: 'The date moves by exactly one day, not a swap; the same meeting shows different days for people in different time zones.',
    seenAs: 'Tuesday 12 May shows as Monday 11 May',
  },
};


// `merged`: the unique reports in the ticket; a shift report also counts under its cause.
export type ProblemGroup = { problem: Problem | 'unplaced'; reports: Report[]; tenants: number; firstSeen: string; lastSeen: string };

// One id, one report; only reports merged into `ticket`.
export function splitTicket(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { merged: number; groups: ProblemGroup[] } {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const by = new Map<ProblemGroup['problem'], Report[]>();
  const add = (p: ProblemGroup['problem'], r: Report) => by.set(p, [...(by.get(p) ?? []), r]);
  for (const r of merged) {
    add(causeOf(r, tenantOf(r)) ?? 'unplaced', r);
    if (oneDayMove.includes(r.id)) add('shift', r);
  }
  const groups = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return { problem, reports: rs, tenants: new Set(rs.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1] };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { merged: merged.length, groups };
}
