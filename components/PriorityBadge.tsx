import { Priority } from "@/lib/types";
import { ArrowDown, ArrowUp, Equal, Flame } from "lucide-react";

const STYLES: Record<Priority, string> = {
  Low: "bg-slate-100 text-slate-600 ring-slate-200",
  Medium: "bg-sky-50 text-sky-700 ring-sky-200",
  High: "bg-orange-50 text-orange-700 ring-orange-200",
  Urgent: "bg-red-50 text-red-700 ring-red-200",
};

const ICON: Record<Priority, React.ElementType> = {
  Low: ArrowDown,
  Medium: Equal,
  High: ArrowUp,
  Urgent: Flame,
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const Icon = ICON[priority];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STYLES[priority]}`}
    >
      <Icon className="h-3 w-3" />
      {priority}
    </span>
  );
}
