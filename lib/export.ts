import { format, parseISO } from "date-fns";
import { Task } from "./types";
import { currentDepartmentDuration, daysActive, isOverdue } from "./duration";

const fmtDate = (iso: string | null) => (iso ? format(parseISO(iso), "MMM d, yyyy") : "—");

const timestamp = () => format(new Date(), "yyyy-MM-dd_HHmm");

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const TABLE_COLUMNS = [
  "Task",
  "Department",
  "Assigned",
  "Status",
  "Priority",
  "Start",
  "End",
  "Days Active",
  "Dept. Duration",
] as const;

const taskRow = (task: Task): (string | number)[] => {
  const overdue = isOverdue(task);
  return [
    task.name,
    task.department,
    task.assignedPerson || "—",
    task.status,
    task.priority,
    fmtDate(task.startDate),
    `${fmtDate(task.endDate)}${overdue ? " (overdue)" : ""}`,
    `${daysActive(task)}d`,
    `${currentDepartmentDuration(task)}d`,
  ];
};

export const exportTasksToExcel = async (tasks: Task[]): Promise<void> => {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Riymar Task Dashboard";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Tasks");
  sheet.columns = [
    { header: "Task", key: "name", width: 32 },
    { header: "Description", key: "description", width: 40 },
    { header: "Department", key: "department", width: 18 },
    { header: "Assigned", key: "assignedPerson", width: 18 },
    { header: "Status", key: "status", width: 18 },
    { header: "Priority", key: "priority", width: 12 },
    { header: "Start Date", key: "startDate", width: 14 },
    { header: "End Date", key: "endDate", width: 14 },
    { header: "Overdue", key: "overdue", width: 10 },
    { header: "Days Active", key: "daysActive", width: 12 },
    { header: "Dept. Duration (days)", key: "deptDuration", width: 18 },
    { header: "Notes", key: "notes", width: 40 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  for (const task of tasks) {
    sheet.addRow({
      name: task.name,
      description: task.description,
      department: task.department,
      assignedPerson: task.assignedPerson,
      status: task.status,
      priority: task.priority,
      startDate: fmtDate(task.startDate),
      endDate: fmtDate(task.endDate),
      overdue: isOverdue(task) ? "Yes" : "No",
      daysActive: daysActive(task),
      deptDuration: currentDepartmentDuration(task),
      notes: task.notes,
    });
  }

  sheet.autoFilter = { from: "A1", to: "L1" };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `riymar-tasks_${timestamp()}.xlsx`
  );
};

export const exportTasksToPDF = async (tasks: Task[]): Promise<void> => {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

  doc.setFontSize(14);
  doc.text("Riymar Task Dashboard", 40, 36);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Exported ${format(new Date(), "MMM d, yyyy 'at' h:mm a")} · ${tasks.length} task${tasks.length === 1 ? "" : "s"}`, 40, 52);

  autoTable(doc, {
    startY: 66,
    head: [[...TABLE_COLUMNS]],
    body: tasks.map(taskRow),
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [30, 41, 59] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.dataKey === 6) {
        const raw = String(data.cell.raw ?? "");
        if (raw.includes("(overdue)")) {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  doc.save(`riymar-tasks_${timestamp()}.pdf`);
};
