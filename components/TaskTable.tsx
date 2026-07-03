"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Pencil, Trash2, AlertTriangle, Inbox, ChevronDown } from "lucide-react";
import { Task } from "@/lib/types";
import { currentDepartmentDuration, daysActive, isOverdue } from "@/lib/duration";
import { loadColumnWidths, saveColumnWidths } from "@/lib/storage";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  groupByDepartment?: boolean;
}

interface ColumnDef {
  key: string;
  label: string;
  defaultWidth: number;
  minWidth: number;
  align?: "right";
}

const COLUMNS: ColumnDef[] = [
  { key: "task", label: "Task", defaultWidth: 280, minWidth: 160 },
  { key: "department", label: "Department", defaultWidth: 160, minWidth: 100 },
  { key: "assigned", label: "Assigned", defaultWidth: 120, minWidth: 90 },
  { key: "status", label: "Status", defaultWidth: 170, minWidth: 120 },
  { key: "priority", label: "Priority", defaultWidth: 110, minWidth: 90 },
  { key: "start", label: "Start", defaultWidth: 110, minWidth: 90 },
  { key: "end", label: "End", defaultWidth: 150, minWidth: 100 },
  { key: "daysActive", label: "Days Active", defaultWidth: 110, minWidth: 90 },
  { key: "deptDuration", label: "Dept. Duration", defaultWidth: 130, minWidth: 100 },
  { key: "actions", label: "Actions", defaultWidth: 90, minWidth: 80, align: "right" },
];

const DEFAULT_WIDTHS: Record<string, number> = Object.fromEntries(
  COLUMNS.map((c) => [c.key, c.defaultWidth])
);

const DOT_PALETTE = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-lime-500",
  "bg-indigo-500",
];

const dotColorFor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return DOT_PALETTE[hash % DOT_PALETTE.length];
};

const fmtDate = (iso: string | null) => (iso ? format(parseISO(iso), "MMM d, yyyy") : "—");

export default function TaskTable({ tasks, onEdit, onDelete, groupByDepartment }: TaskTableProps) {
  const [widths, setWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const resizing = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const stored = loadColumnWidths();
    if (stored) setWidths((w) => ({ ...w, ...stored }));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const r = resizing.current;
      if (!r) return;
      const col = COLUMNS.find((c) => c.key === r.key);
      const min = col?.minWidth ?? 80;
      const next = Math.max(min, r.startWidth + (e.clientX - r.startX));
      setWidths((w) => ({ ...w, [r.key]: next }));
    };
    const handleMouseUp = () => {
      if (!resizing.current) return;
      resizing.current = null;
      setWidths((w) => {
        saveColumnWidths(w);
        return w;
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startResize = (key: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = { key, startX: e.clientX, startWidth: widths[key] };
  };

  const resetWidth = (key: string) => () => {
    const col = COLUMNS.find((c) => c.key === key);
    if (!col) return;
    setWidths((w) => {
      const next = { ...w, [key]: col.defaultWidth };
      saveColumnWidths(next);
      return next;
    });
  };

  const columns = useMemo(
    () => (groupByDepartment ? COLUMNS.filter((c) => c.key !== "department") : COLUMNS),
    [groupByDepartment]
  );

  const tableWidth = useMemo(
    () => columns.reduce((sum, c) => sum + (widths[c.key] ?? c.defaultWidth), 0),
    [columns, widths]
  );

  const groups = useMemo(() => {
    if (!groupByDepartment) return null;
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const list = map.get(task.department);
      if (list) list.push(task);
      else map.set(task.department, [task]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tasks, groupByDepartment]);

  const toggleGroup = (dept: string) =>
    setCollapsed((c) => ({ ...c, [dept]: !c[dept] }));

  const renderRow = (task: Task) => {
    const overdue = isOverdue(task);
    return (
      <tr
        key={task.id}
        className={`transition-colors hover:bg-slate-50 ${overdue ? "bg-rose-50/60" : ""}`}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {overdue && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500" />}
            <span className="min-w-0 flex-1 truncate font-medium text-slate-900" title={task.name}>
              {task.name}
            </span>
          </div>
          {task.description && (
            <p className="mt-0.5 truncate text-xs text-slate-400" title={task.description}>
              {task.description}
            </p>
          )}
        </td>
        {!groupByDepartment && (
          <td className="truncate px-4 py-3 text-slate-600" title={task.department}>
            {task.department}
          </td>
        )}
        <td className="truncate px-4 py-3 text-slate-600" title={task.assignedPerson || undefined}>
          {task.assignedPerson || "—"}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={task.status} />
        </td>
        <td className="px-4 py-3">
          <PriorityBadge priority={task.priority} />
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{fmtDate(task.startDate)}</td>
        <td className={`px-4 py-3 whitespace-nowrap ${overdue ? "font-medium text-rose-600" : "text-slate-600"}`}>
          {fmtDate(task.endDate)}
          {overdue && <span className="ml-1 text-xs">(overdue)</span>}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{daysActive(task)}d</td>
        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{currentDepartmentDuration(task)}d</td>
        <td className="px-4 py-3">
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => onEdit(task)}
              title="Edit task"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task)}
              title="Delete task"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <Inbox className="h-8 w-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">No tasks match your filters</p>
        <p className="text-xs text-slate-400">Try adjusting search, filters, or add a new task.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="text-left text-sm" style={{ tableLayout: "fixed", width: tableWidth }}>
          <colgroup>
            {columns.map((c) => (
              <col key={c.key} style={{ width: widths[c.key] ?? c.defaultWidth }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`relative px-4 py-3 font-medium ${c.align === "right" ? "text-right" : ""}`}
                >
                  {c.label}
                  <div
                    onMouseDown={startResize(c.key)}
                    onDoubleClick={resetWidth(c.key)}
                    title="Drag to resize · double-click to reset"
                    className="group absolute right-0 top-0 h-full w-2 cursor-col-resize select-none"
                  >
                    <div className="mx-auto h-full w-px bg-slate-200 group-hover:w-1 group-hover:bg-blue-400" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          {groups ? (
            groups.map(([dept, deptTasks]) => {
              const isCollapsed = collapsed[dept];
              const overdueCount = deptTasks.filter(isOverdue).length;
              return (
                <tbody key={dept} className="divide-y divide-slate-100">
                  <tr
                    onClick={() => toggleGroup(dept)}
                    className="cursor-pointer border-b border-slate-200 bg-slate-50/80 hover:bg-slate-100"
                  >
                    <td colSpan={columns.length} className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                        />
                        <span className={`h-2 w-2 shrink-0 rounded-full ${dotColorFor(dept)}`} />
                        <span className="font-semibold text-slate-800">{dept}</span>
                        <span className="text-xs font-medium text-slate-400">
                          {deptTasks.length} task{deptTasks.length === 1 ? "" : "s"}
                        </span>
                        {overdueCount > 0 && (
                          <span className="flex items-center gap-1 text-xs font-medium text-rose-600">
                            <AlertTriangle className="h-3 w-3" />
                            {overdueCount} overdue
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {!isCollapsed && deptTasks.map(renderRow)}
                </tbody>
              );
            })
          ) : (
            <tbody className="divide-y divide-slate-100">{tasks.map(renderRow)}</tbody>
          )}
        </table>
      </div>
    </div>
  );
}
