export const DEFAULT_DEPARTMENTS = [
  "Creative",
  "Design",
  "Social Media",
  "Strategy",
  "Accounts",
  "Production",
  "Development",
  "Management",
];

export type Department = string;

export const DEFAULT_STATUSES = [
  "Not Started",
  "In Progress",
  "Waiting for Approval",
  "On Hold",
  "Completed",
  "Cancelled",
];

export type TaskStatus = string;

/**
 * "Completed" and "Cancelled" are protected: they can't be renamed or
 * deleted because duration/overdue math keys off these exact labels.
 */
export const PROTECTED_STATUSES = ["Completed", "Cancelled"] as const;

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export type Priority = (typeof PRIORITIES)[number];

export interface DepartmentHistoryEntry {
  department: Department;
  enteredAt: string; // ISO date (YYYY-MM-DD)
  leftAt: string | null; // ISO date (YYYY-MM-DD) or null if current
}

export interface Task {
  id: string;
  name: string;
  description: string;
  department: Department;
  status: TaskStatus;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD
  priority: Priority;
  assignedPerson: string;
  notes: string;
  departmentHistory: DepartmentHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export type TaskFormValues = Omit<
  Task,
  "id" | "departmentHistory" | "createdAt" | "updatedAt"
>;

export const isClosedStatus = (status: TaskStatus) =>
  status === "Completed" || status === "Cancelled";
