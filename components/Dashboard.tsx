"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Department, Priority, PROTECTED_STATUSES, Task, TaskFormValues, TaskStatus } from "@/lib/types";
import { loadGroupByDepartment, saveGroupByDepartment } from "@/lib/storage";
import { daysActive, currentDepartmentDuration } from "@/lib/duration";
import {
  DashboardData,
  addDepartment as addDepartmentAction,
  addStatus as addStatusAction,
  createTask,
  deleteDepartment as deleteDepartmentAction,
  deleteStatus as deleteStatusAction,
  deleteTask,
  getDashboardData,
  renameDepartment as renameDepartmentAction,
  renameStatus as renameStatusAction,
  updateTask,
} from "@/lib/actions";
import DashboardStats from "@/components/DashboardStats";
import DepartmentBreakdown from "@/components/DepartmentBreakdown";
import FiltersBar, { SortKey } from "@/components/FiltersBar";
import TaskTable from "@/components/TaskTable";
import TaskModal from "@/components/TaskModal";
import ManageCategoriesModal from "@/components/ManageCategoriesModal";

const PRIORITY_ORDER: Record<Priority, number> = { Low: 0, Medium: 1, High: 2, Urgent: 3 };

export default function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [departments, setDepartments] = useState<Department[]>(initialData.departments);
  const [statuses, setStatuses] = useState<TaskStatus[]>(initialData.statuses);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<Department | "All">("All");
  const [status, setStatus] = useState<TaskStatus | "All">("All");
  const [priority, setPriority] = useState<Priority | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("startDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [groupByDepartment, setGroupByDepartment] = useState(false);

  useEffect(() => {
    setGroupByDepartment(loadGroupByDepartment());
  }, []);

  useEffect(() => {
    saveGroupByDepartment(groupByDepartment);
  }, [groupByDepartment]);

  const refresh = async () => {
    try {
      const data = await getDashboardData();
      setTasks(data.tasks);
      setDepartments(data.departments);
      setStatuses(data.statuses);
    } catch {
      setErrorBanner("Couldn't reach the database. Your last change may not have saved.");
    }
  };

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

  const handleSave = async (values: TaskFormValues, id: string | null) => {
    setModalOpen(false);
    setEditingTask(null);
    try {
      if (id) await updateTask(id, values);
      else await createTask(values);
      await refresh();
    } catch {
      setErrorBanner("Couldn't save that task. Please try again.");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteTask(target.id);
      await refresh();
    } catch {
      setErrorBanner("Couldn't delete that task. Please try again.");
    }
  };

  const departmentUsage = (name: string) => tasks.filter((t) => t.department === name).length;
  const statusUsage = (name: string) => tasks.filter((t) => t.status === name).length;

  const addDepartment = async (name: string): Promise<string | null> => {
    const error = await addDepartmentAction(name);
    if (!error) await refresh();
    return error;
  };

  const renameDepartment = async (oldName: string, newName: string): Promise<string | null> => {
    const error = await renameDepartmentAction(oldName, newName);
    if (!error) {
      await refresh();
      setDepartment((d) => (d === oldName ? newName : d));
    }
    return error;
  };

  const deleteDepartment = async (name: string, reassignTo: string | null): Promise<void> => {
    await deleteDepartmentAction(name, reassignTo);
    await refresh();
    setDepartment((d) => (d === name ? "All" : d));
  };

  const addStatus = async (name: string): Promise<string | null> => {
    const error = await addStatusAction(name);
    if (!error) await refresh();
    return error;
  };

  const renameStatus = async (oldName: string, newName: string): Promise<string | null> => {
    const error = await renameStatusAction(oldName, newName);
    if (!error) {
      await refresh();
      setStatus((s) => (s === oldName ? newName : s));
    }
    return error;
  };

  const deleteStatus = async (name: string, reassignTo: string | null): Promise<void> => {
    await deleteStatusAction(name, reassignTo);
    await refresh();
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

      {errorBanner && (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-center text-sm text-rose-700 sm:px-6 lg:px-8">
          {errorBanner}
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="ml-3 font-medium underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

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
