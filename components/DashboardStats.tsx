import {
  ListChecks,
  Loader,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  Timer,
  Building2,
} from "lucide-react";
import { Task } from "@/lib/types";
import { averageDuration, isOverdue } from "@/lib/duration";
import RadialGauge from "./RadialGauge";

interface GaugeColors {
  track: string;
  progress: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  sub?: string;
  percent?: number;
  gauge?: GaugeColors;
}

function StatCard({ label, value, icon: Icon, accent, sub, percent, gauge }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
        {percent !== undefined && gauge ? (
          <RadialGauge percent={percent} trackColor={gauge.track} progressColor={gauge.progress}>
            <Icon className={`h-3.5 w-3.5 ${accent}`} />
          </RadialGauge>
        ) : (
          <span className={`rounded-lg p-1.5 ${accent}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {sub ? (
        <div className="mt-0.5 text-xs text-slate-500">{sub}</div>
      ) : percent !== undefined ? (
        <div className="mt-0.5 text-xs text-slate-500">{percent}% of total</div>
      ) : null}
    </div>
  );
}

const GAUGE_COLORS: Record<string, GaugeColors> = {
  blue: { track: "#dbeafe", progress: "#2563eb" },
  emerald: { track: "#d1fae5", progress: "#059669" },
  rose: { track: "#ffe4e6", progress: "#e11d48" },
  orange: { track: "#ffedd5", progress: "#ea580c" },
  cyan: { track: "#cffafe", progress: "#0891b2" },
};

export default function DashboardStats({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const onHold = tasks.filter((t) => t.status === "On Hold").length;
  const overdue = tasks.filter(isOverdue).length;
  const avgDuration = averageDuration(tasks);

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const deptCounts = new Map<string, number>();
  let totalActive = 0;
  for (const t of tasks) {
    if (t.status === "Completed" || t.status === "Cancelled") continue;
    deptCounts.set(t.department, (deptCounts.get(t.department) ?? 0) + 1);
    totalActive += 1;
  }
  let topDept = "—";
  let topDeptCount = 0;
  for (const [dept, count] of deptCounts) {
    if (count > topDeptCount) {
      topDept = dept;
      topDeptCount = count;
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      <StatCard
        label="Total Tasks"
        value={total}
        icon={ListChecks}
        accent="bg-slate-100 text-slate-600"
      />
      <StatCard
        label="In Progress"
        value={inProgress}
        icon={Loader}
        accent="text-blue-600"
        percent={pct(inProgress)}
        gauge={GAUGE_COLORS.blue}
      />
      <StatCard
        label="Completed"
        value={completed}
        icon={CheckCircle2}
        accent="text-emerald-600"
        percent={pct(completed)}
        gauge={GAUGE_COLORS.emerald}
      />
      <StatCard
        label="Overdue"
        value={overdue}
        icon={AlertTriangle}
        accent="text-rose-600"
        percent={pct(overdue)}
        gauge={GAUGE_COLORS.rose}
      />
      <StatCard
        label="On Hold"
        value={onHold}
        icon={PauseCircle}
        accent="text-orange-600"
        percent={pct(onHold)}
        gauge={GAUGE_COLORS.orange}
      />
      <StatCard
        label="Avg. Duration"
        value={`${avgDuration}d`}
        icon={Timer}
        accent="bg-violet-100 text-violet-600"
      />
      <StatCard
        label="Busiest Dept."
        value={topDept}
        sub={topDeptCount > 0 ? `${topDeptCount} active tasks` : undefined}
        icon={Building2}
        accent="text-cyan-600"
        percent={totalActive > 0 ? Math.round((topDeptCount / totalActive) * 100) : undefined}
        gauge={GAUGE_COLORS.cyan}
      />
    </div>
  );
}
