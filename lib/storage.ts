const COLUMN_WIDTHS_KEY = "agency-task-dashboard.table-column-widths.v1";
const GROUP_BY_DEPARTMENT_KEY = "agency-task-dashboard.group-by-department.v1";

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
