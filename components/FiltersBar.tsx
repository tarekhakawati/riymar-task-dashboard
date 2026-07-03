"use client";

import { Department, Priority, PRIORITIES, TaskStatus } from "@/lib/types";
import { Plus, Search, ArrowDownUp, Settings, Rows3 } from "lucide-react";

export type SortKey = "startDate" | "endDate" | "status" | "priority" | "duration" | "name";

interface FiltersBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  department: Department | "All";
  onDepartmentChange: (v: Department | "All") => void;
  departments: Department[];
  status: TaskStatus | "All";
  onStatusChange: (v: TaskStatus | "All") => void;
  statuses: TaskStatus[];
  priority: Priority | "All";
  onPriorityChange: (v: Priority | "All") => void;
  sortKey: SortKey;
  onSortKeyChange: (v: SortKey) => void;
  sortDir: "asc" | "desc";
  onToggleSortDir: () => void;
  groupByDepartment: boolean;
  onToggleGroupByDepartment: () => void;
  onAddTask: () => void;
  onManageCategories: () => void;
}

export default function FiltersBar({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  departments,
  status,
  onStatusChange,
  statuses,
  priority,
  onPriorityChange,
  sortKey,
  onSortKeyChange,
  sortDir,
  onToggleSortDir,
  groupByDepartment,
  onToggleGroupByDepartment,
  onAddTask,
  onManageCategories,
}: FiltersBarProps) {
  const selectClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          className={selectClass}
          value={department}
          onChange={(e) => onDepartmentChange(e.target.value as Department | "All")}
        >
          <option value="All">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus | "All")}
        >
          <option value="All">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as Priority | "All")}
        >
          <option value="All">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <select
            className={selectClass}
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
          >
            <option value="startDate">Sort: Start Date</option>
            <option value="endDate">Sort: End Date</option>
            <option value="status">Sort: Status</option>
            <option value="priority">Sort: Priority</option>
            <option value="duration">Sort: Duration</option>
            <option value="name">Sort: Name</option>
          </select>
          <button
            type="button"
            onClick={onToggleSortDir}
            title={sortDir === "asc" ? "Ascending" : "Descending"}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:bg-slate-50"
          >
            <ArrowDownUp className={`h-4 w-4 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleGroupByDepartment}
          title="Group tasks by department"
          aria-pressed={groupByDepartment}
          className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
            groupByDepartment
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Rows3 className="h-4 w-4" />
          Group by Dept.
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onManageCategories}
          title="Manage departments & statuses"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Manage</span>
        </button>
        <button
          type="button"
          onClick={onAddTask}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>
    </div>
  );
}
