import { Task, isClosedStatus } from "@/lib/types";
import { averageDuration, isOverdue } from "@/lib/duration";
import { AlertTriangle } from "lucide-react";

export default function DepartmentBreakdown({
  tasks,
  departments,
}: {
  tasks: Task[];
  departments: string[];
}) {
  const rows = departments.map((dept) => {
    const deptTasks = tasks.filter((t) => t.department === dept);
    const active = deptTasks.filter((t) => !isClosedStatus(t.status));
    const completed = deptTasks.filter((t) => t.status === "Completed");
    const overdue = deptTasks.filter(isOverdue);
    const onTrack = active.length - overdue.length;
    return {
      dept,
      total: deptTasks.length,
      active: active.length,
      onTrack,
      completed: completed.length,
      overdue: overdue.length,
      avgDuration: averageDuration(deptTasks),
    };
  });

  const maxTotal = Math.max(1, ...rows.map((r) => r.total));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Department Breakdown</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Active, completed, and overdue tasks by department
      </p>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.dept}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-800">{r.dept}</span>
              <span className="flex items-center gap-3 text-xs text-slate-500">
                <span>{r.active} active</span>
                <span>{r.completed} done</span>
                <span>{r.avgDuration}d avg</span>
                {r.overdue > 0 && (
                  <span className="flex items-center gap-1 font-medium text-rose-600">
                    <AlertTriangle className="h-3 w-3" />
                    {r.overdue}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${(r.onTrack / maxTotal) * 100}%` }}
              />
              <div
                className="h-full bg-rose-500"
                style={{ width: `${(r.overdue / maxTotal) * 100}%` }}
              />
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${(r.completed / maxTotal) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
