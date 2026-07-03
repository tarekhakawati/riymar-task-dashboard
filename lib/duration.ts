import { differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  Department,
  DepartmentHistoryEntry,
  Task,
  isClosedStatus,
} from "./types";

export const todayISO = (): string => format(new Date(), "yyyy-MM-dd");

const diffDays = (laterISO: string, earlierISO: string): number => {
  const value = differenceInCalendarDays(
    parseISO(laterISO),
    parseISO(earlierISO)
  );
  return Math.max(0, value);
};

/**
 * Days Active:
 * - Completed/Cancelled with an end date -> End Date minus Start Date
 * - Otherwise -> today minus Start Date
 */
export const daysActive = (task: Task): number => {
  if (isClosedStatus(task.status) && task.endDate) {
    return diffDays(task.endDate, task.startDate);
  }
  return diffDays(todayISO(), task.startDate);
};

export const isOverdue = (task: Task): boolean => {
  if (!task.endDate || isClosedStatus(task.status)) return false;
  return differenceInCalendarDays(parseISO(task.endDate), parseISO(todayISO())) < 0;
};

const currentHistoryEntry = (task: Task): DepartmentHistoryEntry | undefined =>
  task.departmentHistory[task.departmentHistory.length - 1];

/**
 * Department Duration: days between entering the current department period
 * and either it being closed (leftAt), the task's completion, or today.
 */
export const currentDepartmentDuration = (task: Task): number => {
  const entry = currentHistoryEntry(task);
  if (!entry) return 0;
  const end =
    entry.leftAt ??
    (isClosedStatus(task.status) && task.endDate ? task.endDate : todayISO());
  return diffDays(end, entry.enteredAt);
};

export const averageDuration = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((sum, t) => sum + daysActive(t), 0);
  return Math.round((total / tasks.length) * 10) / 10;
};

/**
 * Given the previous task state and the new form values, produce an updated
 * departmentHistory: closing the previous period on department change, and
 * closing the current period when the task becomes Completed/Cancelled.
 */
export const advanceDepartmentHistory = (
  previous: Task | null,
  next: { department: Department; status: Task["status"]; endDate: string | null; startDate: string }
): DepartmentHistoryEntry[] => {
  const today = todayISO();

  if (!previous) {
    const enteredAt = next.startDate || today;
    const leftAt = isClosedStatus(next.status) ? next.endDate ?? today : null;
    return [{ department: next.department, enteredAt, leftAt }];
  }

  let history = previous.departmentHistory.map((e) => ({ ...e }));
  if (history.length === 0) {
    history = [{ department: previous.department, enteredAt: previous.startDate, leftAt: null }];
  }

  const last = history[history.length - 1];

  if (next.department !== previous.department) {
    if (last.leftAt === null) {
      last.leftAt = today;
    }
    history.push({ department: next.department, enteredAt: today, leftAt: null });
  }

  if (isClosedStatus(next.status)) {
    const current = history[history.length - 1];
    if (current.leftAt === null) {
      current.leftAt = next.endDate ?? today;
    }
  }

  return history;
};
