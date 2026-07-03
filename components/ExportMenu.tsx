"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Task } from "@/lib/types";
import { exportTasksToExcel, exportTasksToPDF } from "@/lib/export";

export default function ExportMenu({ tasks }: { tasks: Task[] }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const runExport = async (kind: "excel" | "pdf") => {
    setExporting(kind);
    try {
      if (kind === "excel") await exportTasksToExcel(tasks);
      else await exportTasksToPDF(tasks);
      setOpen(false);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={tasks.length === 0}
        title="Export current view"
        className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => runExport("excel")}
            disabled={exporting !== null}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting === "excel" ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            )}
            Export to Excel
          </button>
          <button
            type="button"
            onClick={() => runExport("pdf")}
            disabled={exporting !== null}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <FileText className="h-4 w-4 text-rose-600" />
            )}
            Export to PDF
          </button>
        </div>
      )}
    </div>
  );
}
