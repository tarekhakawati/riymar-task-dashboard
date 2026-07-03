import { TaskStatus } from "@/lib/types";

const STYLES: Record<string, string> = {
  "Not Started": "bg-slate-100 text-slate-600 ring-slate-200",
  "In Progress": "bg-blue-50 text-blue-700 ring-blue-200",
  "Waiting for Approval": "bg-amber-50 text-amber-700 ring-amber-200",
  "On Hold": "bg-orange-50 text-orange-700 ring-orange-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Cancelled: "bg-rose-50 text-rose-600 ring-rose-200",
};

const DOT: Record<string, string> = {
  "Not Started": "bg-slate-400",
  "In Progress": "bg-blue-500",
  "Waiting for Approval": "bg-amber-500",
  "On Hold": "bg-orange-500",
  Completed: "bg-emerald-500",
  Cancelled: "bg-rose-500",
};

const FALLBACK_PALETTE: { style: string; dot: string }[] = [
  { style: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  { style: "bg-cyan-50 text-cyan-700 ring-cyan-200", dot: "bg-cyan-500" },
  { style: "bg-pink-50 text-pink-700 ring-pink-200", dot: "bg-pink-500" },
  { style: "bg-lime-50 text-lime-700 ring-lime-200", dot: "bg-lime-500" },
  { style: "bg-indigo-50 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
];

const fallbackFor = (status: string) => {
  let hash = 0;
  for (let i = 0; i < status.length; i++) hash = (hash * 31 + status.charCodeAt(i)) >>> 0;
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const fallback = fallbackFor(status);
  const style = STYLES[status] ?? fallback.style;
  const dot = DOT[status] ?? fallback.dot;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}
