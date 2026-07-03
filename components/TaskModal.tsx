"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PRIORITIES, Task, TaskFormValues } from "@/lib/types";
import { todayISO } from "@/lib/duration";

interface TaskModalProps {
  open: boolean;
  task: Task | null;
  departments: string[];
  statuses: string[];
  onClose: () => void;
  onSave: (values: TaskFormValues, id: string | null) => void;
}

const buildEmptyForm = (departments: string[], statuses: string[]): TaskFormValues => ({
  name: "",
  description: "",
  department: departments[0] ?? "",
  status: statuses[0] ?? "",
  startDate: todayISO(),
  endDate: null,
  priority: "Medium",
  assignedPerson: "",
  notes: "",
});

export default function TaskModal({
  open,
  task,
  departments,
  statuses,
  onClose,
  onSave,
}: TaskModalProps) {
  const [form, setForm] = useState<TaskFormValues>(() => buildEmptyForm(departments, statuses));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        name: task.name,
        description: task.description,
        department: task.department,
        status: task.status,
        startDate: task.startDate,
        endDate: task.endDate,
        priority: task.priority,
        assignedPerson: task.assignedPerson,
        notes: task.notes,
      });
    } else {
      setForm(buildEmptyForm(departments, statuses));
    }
    setError(null);
  }, [open, task, departments, statuses]);

  if (!open) return null;

  const update = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Task name is required.");
      return;
    }
    if (!form.startDate) {
      setError("Start date is required.");
      return;
    }
    if (form.endDate && form.endDate < form.startDate) {
      setError("End date cannot be before the start date.");
      return;
    }
    setError(null);
    onSave(form, task?.id ?? null);
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const labelClass = "mb-1 block text-xs font-medium text-slate-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className={labelClass}>Task Name</label>
            <input
              type="text"
              className={inputClass}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Homepage Redesign Mockups"
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>Task Description</label>
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Brief summary of the task"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Department Responsible</label>
              <select
                className={inputClass}
                value={form.department}
                onChange={(e) => update("department", e.target.value as TaskFormValues["department"])}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Task Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => update("status", e.target.value as TaskFormValues["status"])}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.endDate ?? ""}
                onChange={(e) => update("endDate", e.target.value || null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Priority</label>
              <select
                className={inputClass}
                value={form.priority}
                onChange={(e) => update("priority", e.target.value as TaskFormValues["priority"])}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Assigned Person</label>
              <input
                type="text"
                className={inputClass}
                value={form.assignedPerson}
                onChange={(e) => update("assignedPerson", e.target.value)}
                placeholder="e.g. Layla Haddad"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              className={`${inputClass} min-h-16 resize-y`}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Any additional context or updates"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {task ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
