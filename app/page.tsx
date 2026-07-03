"use client";

import { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { Trash2 } from "lucide-react";
import {
  DEFAULT_DEPARTMENTS,
  DEFAULT_STATUSES,
  Department,
  Priority,
  PROTECTED_STATUSES,
  Task,
  TaskFormValues,
  TaskStatus,
} from "@/lib/types";
import {
  loadDepartments,
  loadGroupByDepartment,
  loadStatuses,
  loadTasks,
  saveDepartments,
  saveGroupByDepartment,
  saveStatuses,
  saveTasks,
} from "@/lib/storage";
import { buildSampleTasks } from "@/lib/sampleData";
import { advanceDepartmentHistory, daysActive, currentDepartmentDuration } from "@/lib/duration";
import DashboardStats from "@/components/DashboardStats";
import DepartmentBreakdown from "@/components/DepartmentBreakdown";
import FiltersBar, { SortKey } from "@/components/FiltersBar";
import TaskTable from "@/components/TaskTable";
import TaskModal from "@/components/TaskModal";
import ManageCategoriesModal from "@/components/ManageCategoriesModal";

const PRIORITY_ORDER: Record<Priority, number> = { Low: 0, Medium: 1, High: 2, Urgent: 3 };

const normalize = (s: string) => s.trim().toLowerCase();

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [statuses, setStatuses] = useState<TaskStatus[]>(DEFAULT_STATUSES);
  const [hydrated, setHydrated] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<Department | "All">("All");
  const [status, setStatus] = useState<TaskStatus | "All">("All");
  const [priority, setPriority] = useState<Priority | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("startDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [groupByDepartment, setGroupByDepartment] = useState(false);

  useEffect(() => {
    const storedTasks = loadTasks();
    setTasks(storedTasks && storedTasks.length > 0 ? storedTasks : buildSampleTasks());
    setDepartments(loadDepartments());
    setStatuses(loadStatuses());
    setGroupByDepartment(loadGroupByDepartment());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveTasks(tasks);
  }, [tasks, hydrated]);

  useEffect(() => {
    if (hydrated) saveDepartments(departments);
  }, [departments, hydrated]);

  useEffect(() => {
    if (hydrated) saveStatuses(statuses);
  }, [statuses, hydrated]);

  useEffect(() => {
    if (hydrated) saveGroupByDepartment(groupByDepartment);
  }, [groupByDepartment, hydrated]);

  const statusOrder = useMemo(
    () => Object.fromEntries(statuses.map((s, i) => [s, i])) as Record<string, number>,
    [statuses]
  );

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = tasks.filter((t) => {
      if (department !== "All" && t.department !== department) return false;
      if (status !== "All" && t.status !== status) return false;
      if (priority !== "All" && t.priority !== priority) return false;
      if (q) {
        const haystack = `${t.name} ${t.description} ${t.assignedPerson} ${t.notes}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "status":
          return ((statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0)) * dir;
        case "priority":
          return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir;
        case "duration":
          return (daysActive(a) - daysActive(b)) * dir;
        case "endDate":
          return ((a.endDate ?? "") < (b.endDate ?? "") ? -1 : 1) * dir;
        case "startDate":
        default:
          return (a.startDate < b.startDate ? -1 : 1) * dir;
      }
    });

    return result;
  }, [tasks, search, department, status, priority, sortKey, sortDir, statusOrder]);

  const openCreateModal = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSave = (values: TaskFormValues, id: string | null) => {
    const now = new Date().toISOString();

    if (id) {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const departmentHistory = advanceDepartmentHistory(t, {
            department: values.department,
            status: values.status,
            endDate: values.endDate,
            startDate: values.startDate,
          });
          return { ...t, ...values, departmentHistory, updatedAt: now };
        })
      );
    } else {
      const departmentHistory = advanceDepartmentHistory(null, {
        department: values.department,
        status: values.status,
        endDate: values.endDate,
        startDate: values.startDate,
      });
      const newTask: Task = {
        ...values,
        id: uuid(),
        departmentHistory,
        createdAt: now,
        updatedAt: now,
      };
      setTasks((prev) => [newTask, ...prev]);
    }

    setModalOpen(false);
    setEditingTask(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setTasks((prev) => prev.filter((t) => t.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  const departmentUsage = (name: string) => tasks.filter((t) => t.department === name).length;
  const statusUsage = (name: string) => tasks.filter((t) => t.status === name).length;

  const addDepartment = (name: string): string | null => {
    if (!name) return "Department name is required.";
    if (departments.some((d) => normalize(d) === normalize(name))) {
      return "That department already exists.";
    }
    setDepartments((prev) => [...prev, name]);
    return null;
  };

  const renameDepartment = (oldName: string, newName: string): string | null => {
    if (!newName) return "Department name is required.";
    if (departments.some((d) => normalize(d) === normalize(newName) && d !== oldName)) {
      return "That department already exists.";
    }
    setDepartments((prev) => prev.map((d) => (d === oldName ? newName : d)));
    setTasks((prev) =>
      prev.map((t) =>
        t.department === oldName
          ? {
              ...t,
              department: newName,
              departmentHistory: t.departmentHistory.map((h) =>
                h.department === oldName ? { ...h, department: newName } : h
              ),
            }
          : t
      )
    );
    setDepartment((d) => (d === oldName ? newName : d));
    return null;
  };

  const deleteDepartment = (name: string, reassignTo: string | null) => {
    if (departments.length <= 1) return;
    const affected = tasks.filter((t) => t.department === name);
    if (affected.length > 0) {
      if (!reassignTo || reassignTo === name) return;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.department !== name) return t;
          const departmentHistory = advanceDepartmentHistory(t, {
            department: reassignTo,
            status: t.status,
            endDate: t.endDate,
            startDate: t.startDate,
          });
          return { ...t, department: reassignTo, departmentHistory };
        })
      );
    }
    setDepartments((prev) => prev.filter((d) => d !== name));
    setDepartment((d) => (d === name ? "All" : d));
  };

  const addStatus = (name: string): string | null => {
    if (!name) return "Status name is required.";
    if (statuses.some((s) => normalize(s) === normalize(name))) {
      return "That status already exists.";
    }
    setStatuses((prev) => [...prev, name]);
    return null;
  };

  const renameStatus = (oldName: string, newName: string): string | null => {
    if (PROTECTED_STATUSES.includes(oldName as (typeof PROTECTED_STATUSES)[number])) {
      return "This status is locked and can't be renamed.";
    }
    if (!newName) return "Status name is required.";
    if (statuses.some((s) => normalize(s) === normalize(newName) && s !== oldName)) {
      return "That status already exists.";
    }
    setStatuses((prev) => prev.map((s) => (s === oldName ? newName : s)));
    setTasks((prev) => prev.map((t) => (t.status === oldName ? { ...t, status: newName } : t)));
    setStatus((s) => (s === oldName ? newName : s));
    return null;
  };

  const deleteStatus = (name: string, reassignTo: string | null) => {
    if (PROTECTED_STATUSES.includes(name as (typeof PROTECTED_STATUSES)[number])) return;
    if (statuses.length <= 1) return;
    const affected = tasks.filter((t) => t.status === name);
    if (affected.length > 0) {
      if (!reassignTo || reassignTo === name) return;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.status !== name) return t;
          const departmentHistory = advanceDepartmentHistory(t, {
            department: t.department,
            status: reassignTo,
            endDate: t.endDate,
            startDate: t.startDate,
          });
          return { ...t, status: reassignTo, departmentHistory };
        })
      );
    }
    setStatuses((prev) => prev.filter((s) => s !== name));
    setStatus((s) => (s === name ? "All" : s));
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/riymar-logo.svg" alt="Riymar" className="h-9 w-auto" />
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Riymar Task Dashboard</h1>
            <p className="text-xs text-slate-500">
              Track tasks, departments, and turnaround time across the agency
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <DashboardStats tasks={tasks} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <DepartmentBreakdown tasks={tasks} departments={departments} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Current Department Time</h2>
            <p className="mt-0.5 text-xs text-slate-500">Days each active task has spent in its department</p>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              {tasks
                .filter((t) => t.status !== "Completed" && t.status !== "Cancelled")
                .sort((a, b) => currentDepartmentDuration(b) - currentDepartmentDuration(a))
                .slice(0, 8)
                .map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-slate-700">{t.name}</span>
                    <span className="ml-2 shrink-0 text-xs font-medium text-slate-500">
                      {currentDepartmentDuration(t)}d in {t.department}
                    </span>
                  </div>
                ))}
              {tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled").length === 0 && (
                <p className="text-xs text-slate-400">No active tasks.</p>
              )}
            </div>
          </div>
        </div>

        <FiltersBar
          search={search}
          onSearchChange={setSearch}
          department={department}
          onDepartmentChange={setDepartment}
          departments={departments}
          status={status}
          onStatusChange={setStatus}
          statuses={statuses}
          priority={priority}
          onPriorityChange={setPriority}
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sortDir={sortDir}
          onToggleSortDir={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          groupByDepartment={groupByDepartment}
          onToggleGroupByDepartment={() => setGroupByDepartment((g) => !g)}
          onAddTask={openCreateModal}
          onManageCategories={() => setManageOpen(true)}
        />

        <TaskTable
          tasks={filteredTasks}
          onEdit={openEditModal}
          onDelete={setPendingDelete}
          groupByDepartment={groupByDepartment}
        />
      </main>

      <TaskModal
        open={modalOpen}
        task={editingTask}
        departments={departments}
        statuses={statuses}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSave}
      />

      <ManageCategoriesModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        departments={departments}
        statuses={statuses}
        protectedStatuses={PROTECTED_STATUSES}
        departmentUsage={departmentUsage}
        statusUsage={statusUsage}
        onAddDepartment={addDepartment}
        onRenameDepartment={renameDepartment}
        onDeleteDepartment={deleteDepartment}
        onAddStatus={addStatus}
        onRenameStatus={renameStatus}
        onDeleteStatus={deleteStatus}
      />

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Delete task?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="mt-3 truncate text-sm text-slate-600">
              &ldquo;{pendingDelete.name}&rdquo;
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
