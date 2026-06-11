import type { WorkScheduleEntry, WorkScheduleEntryType } from "../../api";
import { getColorClass } from "../calendar/calendarUtils";

export type WorkScheduleConflict = {
  entryA: WorkScheduleEntry;
  entryB: WorkScheduleEntry;
  message: string;
};

function entriesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return new Date(startA) < new Date(endB) && new Date(startB) < new Date(endA);
}

export function findWorkScheduleConflicts(entries: WorkScheduleEntry[]): WorkScheduleConflict[] {
  const conflicts: WorkScheduleConflict[] = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (a.employeeId !== b.employeeId) continue;
      if (!entriesOverlap(a.startAt, a.endAt, b.startAt, b.endAt)) continue;
      conflicts.push({
        entryA: a,
        entryB: b,
        message: `${a.employeeName}: nakładają się „${WORK_SCHEDULE_TYPE_LABELS[a.entryType]}” i „${WORK_SCHEDULE_TYPE_LABELS[b.entryType]}”`,
      });
    }
  }
  return conflicts;
}

export const WORK_SCHEDULE_ENTRY_TYPES: WorkScheduleEntryType[] = [
  "SHIFT",
  "VACATION",
  "SICK_LEAVE",
  "DAY_OFF",
  "TRAINING",
  "OTHER",
];

export const WORK_SCHEDULE_TYPE_LABELS: Record<WorkScheduleEntryType, string> = {
  SHIFT: "Zmiana / praca",
  VACATION: "Urlop",
  SICK_LEAVE: "Zwolnienie",
  DAY_OFF: "Wolne",
  TRAINING: "Szkolenie",
  OTHER: "Inne",
};

export const WORK_SCHEDULE_TYPE_COLORS: Record<WorkScheduleEntryType, string> = {
  SHIFT: "emerald",
  VACATION: "amber",
  SICK_LEAVE: "red",
  DAY_OFF: "slate",
  TRAINING: "violet",
  OTHER: "blue",
};

export function workScheduleTypeColor(type: WorkScheduleEntryType): string {
  return WORK_SCHEDULE_TYPE_COLORS[type];
}

export function workScheduleLegendClass(type: WorkScheduleEntryType): string {
  return getColorClass(WORK_SCHEDULE_TYPE_COLORS[type]);
}
