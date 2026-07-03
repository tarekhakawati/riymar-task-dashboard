import { DEFAULT_DEPARTMENTS, DEFAULT_STATUSES, Task } from "./types";

const TASKS_KEY = "agency-task-dashboard.tasks.v1";
const DEPARTMENTS_KEY = "agency-task-dashboard.departments.v1";
const STATUSES_KEY = "agency-task-dashboard.statuses.v1";
const COLUMN_WIDTHS_KEY = "agency-task-dashboard.table-column-widths.v1";
const GROUP_BY_DEPARTMENT_KEY = "agency-task-dashboard.group-by-department.v1";

const loadStringList = (key: string): string[] | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((v) => typeof v === "string")) return null;
    return parsed as string[];
  } catch {
    return null;
  }
};

const saveStringList = (key: string, values: string[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) - fail silently
  }
};

export const loadTasks = (): Task[] | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TASKS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as Task[];
  } catch {
    return null;
  }
};

export const saveTasks = (tasks: Task[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) - fail silently
  }
};

export const loadDepartments = (): string[] =>
  loadStringList(DEPARTMENTS_KEY) ?? DEFAULT_DEPARTMENTS;

export const saveDepartments = (departments: string[]): void =>
  saveStringList(DEPARTMENTS_KEY, departments);

export const loadStatuses = (): string[] => loadStringList(STATUSES_KEY) ?? DEFAULT_STATUSES;

export const saveStatuses = (statuses: string[]): void => saveStringList(STATUSES_KEY, statuses);

export const loadColumnWidths = (): Record<string, number> | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COLUMN_WIDTHS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Record<string, number>;
  } catch {
    return null;
  }
};

export const saveColumnWidths = (widths: Record<string, number>): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(widths));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) - fail silently
  }
};

export const loadGroupByDepartment = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(GROUP_BY_DEPARTMENT_KEY) === "true";
  } catch {
    return false;
  }
};

export const saveGroupByDepartment = (value: boolean): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GROUP_BY_DEPARTMENT_KEY, String(value));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) - fail silently
  }
};
