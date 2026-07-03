"use client";

import { useState } from "react";
import { X, Plus, Pencil, Trash2, Lock, Check, X as XIcon } from "lucide-react";

interface CategoryListProps {
  title: string;
  description: string;
  items: string[];
  protectedItems: string[];
  usageCount: (item: string) => number;
  onAdd: (name: string) => string | null;
  onRename: (oldName: string, newName: string) => string | null;
  onDelete: (name: string, reassignTo: string | null) => void;
}

function CategoryList({
  title,
  description,
  items,
  protectedItems,
  usageCount,
  onAdd,
  onRename,
  onDelete,
}: CategoryListProps) {
  const [newValue, setNewValue] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const startEdit = (item: string) => {
    setEditingItem(item);
    setEditValue(item);
    setEditError(null);
  };

  const submitEdit = () => {
    if (!editingItem) return;
    const error = onRename(editingItem, editValue.trim());
    if (error) {
      setEditError(error);
      return;
    }
    setEditingItem(null);
    setEditError(null);
  };

  const submitAdd = () => {
    const error = onAdd(newValue.trim());
    if (error) {
      setAddError(error);
      return;
    }
    setNewValue("");
    setAddError(null);
  };

  const startDelete = (item: string) => {
    setDeletingItem(item);
    setReassignTo(items.find((i) => i !== item) ?? "");
  };

  const confirmDelete = () => {
    if (!deletingItem) return;
    onDelete(deletingItem, usageCount(deletingItem) > 0 ? reassignTo : null);
    setDeletingItem(null);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{description}</p>

      <ul className="mt-3 space-y-1.5">
        {items.map((item) => {
          const locked = protectedItems.includes(item);
          const count = usageCount(item);
          const isEditing = editingItem === item;
          const isDeleting = deletingItem === item;

          return (
            <li
              key={item}
              className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2"
            >
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitEdit();
                      if (e.key === "Escape") setEditingItem(null);
                    }}
                    className="flex-1 rounded-md border border-blue-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={submitEdit}
                    className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50"
                    title="Save"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                    title="Cancel"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-sm text-slate-800">
                    {locked && <Lock className="h-3 w-3 text-slate-400" />}
                    <span>{item}</span>
                    <span className="text-xs text-slate-400">
                      {count > 0 ? `· ${count} task${count === 1 ? "" : "s"}` : ""}
                    </span>
                  </div>
                  {!locked && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                        title="Rename"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startDelete(item)}
                        className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isEditing && editError && (
                <p className="mt-1 text-xs font-medium text-rose-600">{editError}</p>
              )}

              {isDeleting && (
                <div className="mt-2 rounded-md bg-white p-2 ring-1 ring-inset ring-slate-200">
                  {count > 0 ? (
                    <>
                      <p className="text-xs text-slate-600">
                        {count} task{count === 1 ? "" : "s"} use &ldquo;{item}&rdquo;. Reassign to:
                      </p>
                      <select
                        value={reassignTo}
                        onChange={(e) => setReassignTo(e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                      >
                        {items
                          .filter((i) => i !== item)
                          .map((i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          ))}
                      </select>
                    </>
                  ) : (
                    <p className="text-xs text-slate-600">Delete &ldquo;{item}&rdquo;?</p>
                  )}
                  <div className="mt-2 flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDeletingItem(null)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={count > 0 && !reassignTo}
                      className="rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitAdd()}
          placeholder={`Add new ${title.toLowerCase().replace(/s$/, "")}...`}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={submitAdd}
          className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
      {addError && <p className="mt-1 text-xs font-medium text-rose-600">{addError}</p>}
    </div>
  );
}

interface ManageCategoriesModalProps {
  open: boolean;
  onClose: () => void;
  departments: string[];
  statuses: string[];
  protectedStatuses: readonly string[];
  departmentUsage: (department: string) => number;
  statusUsage: (status: string) => number;
  onAddDepartment: (name: string) => string | null;
  onRenameDepartment: (oldName: string, newName: string) => string | null;
  onDeleteDepartment: (name: string, reassignTo: string | null) => void;
  onAddStatus: (name: string) => string | null;
  onRenameStatus: (oldName: string, newName: string) => string | null;
  onDeleteStatus: (name: string, reassignTo: string | null) => void;
}

export default function ManageCategoriesModal({
  open,
  onClose,
  departments,
  statuses,
  protectedStatuses,
  departmentUsage,
  statusUsage,
  onAddDepartment,
  onRenameDepartment,
  onDeleteDepartment,
  onAddStatus,
  onRenameStatus,
  onDeleteStatus,
}: ManageCategoriesModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Manage Departments &amp; Statuses</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 px-6 py-5 sm:grid-cols-2">
          <CategoryList
            title="Departments"
            description="Teams tasks can be routed through."
            items={departments}
            protectedItems={[]}
            usageCount={departmentUsage}
            onAdd={onAddDepartment}
            onRename={onRenameDepartment}
            onDelete={onDeleteDepartment}
          />
          <CategoryList
            title="Statuses"
            description="Workflow states a task can be in. Completed and Cancelled are locked because they drive duration tracking."
            items={statuses}
            protectedItems={[...protectedStatuses]}
            usageCount={statusUsage}
            onAdd={onAddStatus}
            onRename={onRenameStatus}
            onDelete={onDeleteStatus}
          />
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
