"use server";

import { prisma } from "./db";
import { advanceDepartmentHistory } from "./duration";
import { buildSampleTasks } from "./sampleData";
import {
  DEFAULT_DEPARTMENTS,
  DEFAULT_STATUSES,
  PROTECTED_STATUSES,
  Task,
  TaskFormValues,
} from "./types";

const normalize = (s: string) => s.trim().toLowerCase();

const toTask = (
  row: {
    id: string;
    name: string;
    description: string;
    department: string;
    status: string;
    startDate: string;
    endDate: string | null;
    priority: string;
    assignedPerson: string;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
    departmentHistory: { department: string; enteredAt: string; leftAt: string | null }[];
  }
): Task => ({
  id: row.id,
  name: row.name,
  description: row.description,
  department: row.department,
  status: row.status,
  startDate: row.startDate,
  endDate: row.endDate,
  priority: row.priority as Task["priority"],
  assignedPerson: row.assignedPerson,
  notes: row.notes,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  departmentHistory: row.departmentHistory.map((h) => ({
    department: h.department,
    enteredAt: h.enteredAt,
    leftAt: h.leftAt,
  })),
});

const taskInclude = {
  departmentHistory: { orderBy: { createdAt: "asc" as const } },
};

const ensureSeeded = async () => {
  const departmentCount = await prisma.department.count();
  if (departmentCount === 0) {
    await prisma.department.createMany({
      data: DEFAULT_DEPARTMENTS.map((name, order) => ({ name, order })),
    });
  }

  const statusCount = await prisma.status.count();
  if (statusCount === 0) {
    await prisma.status.createMany({
      data: DEFAULT_STATUSES.map((name, order) => ({
        name,
        order,
        isProtected: (PROTECTED_STATUSES as readonly string[]).includes(name),
      })),
    });
  }

  const taskCount = await prisma.task.count();
  if (taskCount === 0) {
    for (const sample of buildSampleTasks()) {
      await prisma.task.create({
        data: {
          name: sample.name,
          description: sample.description,
          department: sample.department,
          status: sample.status,
          startDate: sample.startDate,
          endDate: sample.endDate,
          priority: sample.priority,
          assignedPerson: sample.assignedPerson,
          notes: sample.notes,
          departmentHistory: {
            create: sample.departmentHistory.map((h) => ({
              department: h.department,
              enteredAt: h.enteredAt,
              leftAt: h.leftAt,
            })),
          },
        },
      });
    }
  }
};

export interface DashboardData {
  tasks: Task[];
  departments: string[];
  statuses: string[];
}

export const getDashboardData = async (): Promise<DashboardData> => {
  await ensureSeeded();

  const [taskRows, departmentRows, statusRows] = await Promise.all([
    prisma.task.findMany({ include: taskInclude, orderBy: { createdAt: "desc" } }),
    prisma.department.findMany({ orderBy: { order: "asc" } }),
    prisma.status.findMany({ orderBy: { order: "asc" } }),
  ]);

  return {
    tasks: taskRows.map(toTask),
    departments: departmentRows.map((d) => d.name),
    statuses: statusRows.map((s) => s.name),
  };
};

export const createTask = async (values: TaskFormValues): Promise<Task> => {
  const history = advanceDepartmentHistory(null, {
    department: values.department,
    status: values.status,
    endDate: values.endDate,
    startDate: values.startDate,
  });

  const row = await prisma.task.create({
    data: {
      name: values.name,
      description: values.description,
      department: values.department,
      status: values.status,
      startDate: values.startDate,
      endDate: values.endDate,
      priority: values.priority,
      assignedPerson: values.assignedPerson,
      notes: values.notes,
      departmentHistory: {
        create: history.map((h) => ({
          department: h.department,
          enteredAt: h.enteredAt,
          leftAt: h.leftAt,
        })),
      },
    },
    include: taskInclude,
  });

  return toTask(row);
};

export const updateTask = async (id: string, values: TaskFormValues): Promise<Task> => {
  const existing = await prisma.task.findUniqueOrThrow({ where: { id }, include: taskInclude });
  const history = advanceDepartmentHistory(toTask(existing), {
    department: values.department,
    status: values.status,
    endDate: values.endDate,
    startDate: values.startDate,
  });

  const row = await prisma.$transaction(async (tx) => {
    await tx.departmentHistoryEntry.deleteMany({ where: { taskId: id } });
    return tx.task.update({
      where: { id },
      data: {
        name: values.name,
        description: values.description,
        department: values.department,
        status: values.status,
        startDate: values.startDate,
        endDate: values.endDate,
        priority: values.priority,
        assignedPerson: values.assignedPerson,
        notes: values.notes,
        departmentHistory: {
          create: history.map((h) => ({
            department: h.department,
            enteredAt: h.enteredAt,
            leftAt: h.leftAt,
          })),
        },
      },
      include: taskInclude,
    });
  });

  return toTask(row);
};

export const deleteTask = async (id: string): Promise<void> => {
  await prisma.task.delete({ where: { id } });
};

export const addDepartment = async (name: string): Promise<string | null> => {
  const trimmed = name.trim();
  if (!trimmed) return "Department name is required.";
  const existing = await prisma.department.findMany();
  if (existing.some((d) => normalize(d.name) === normalize(trimmed))) {
    return "That department already exists.";
  }
  const maxOrder = existing.reduce((m, d) => Math.max(m, d.order), -1);
  await prisma.department.create({ data: { name: trimmed, order: maxOrder + 1 } });
  return null;
};

export const renameDepartment = async (oldName: string, newName: string): Promise<string | null> => {
  const trimmed = newName.trim();
  if (!trimmed) return "Department name is required.";
  const existing = await prisma.department.findMany();
  if (existing.some((d) => normalize(d.name) === normalize(trimmed) && d.name !== oldName)) {
    return "That department already exists.";
  }

  await prisma.$transaction([
    prisma.department.update({ where: { name: oldName }, data: { name: trimmed } }),
    prisma.task.updateMany({ where: { department: oldName }, data: { department: trimmed } }),
    prisma.departmentHistoryEntry.updateMany({
      where: { department: oldName },
      data: { department: trimmed },
    }),
  ]);

  return null;
};

export const deleteDepartment = async (name: string, reassignTo: string | null): Promise<void> => {
  const departmentCount = await prisma.department.count();
  if (departmentCount <= 1) return;

  const affected = await prisma.task.findMany({
    where: { department: name },
    include: taskInclude,
  });

  if (affected.length > 0) {
    if (!reassignTo || reassignTo === name) return;
    for (const task of affected) {
      const history = advanceDepartmentHistory(toTask(task), {
        department: reassignTo,
        status: task.status,
        endDate: task.endDate,
        startDate: task.startDate,
      });
      await prisma.$transaction(async (tx) => {
        await tx.departmentHistoryEntry.deleteMany({ where: { taskId: task.id } });
        await tx.task.update({
          where: { id: task.id },
          data: {
            department: reassignTo,
            departmentHistory: {
              create: history.map((h) => ({
                department: h.department,
                enteredAt: h.enteredAt,
                leftAt: h.leftAt,
              })),
            },
          },
        });
      });
    }
  }

  await prisma.department.delete({ where: { name } });
};

export const addStatus = async (name: string): Promise<string | null> => {
  const trimmed = name.trim();
  if (!trimmed) return "Status name is required.";
  const existing = await prisma.status.findMany();
  if (existing.some((s) => normalize(s.name) === normalize(trimmed))) {
    return "That status already exists.";
  }
  const maxOrder = existing.reduce((m, s) => Math.max(m, s.order), -1);
  await prisma.status.create({ data: { name: trimmed, order: maxOrder + 1 } });
  return null;
};

export const renameStatus = async (oldName: string, newName: string): Promise<string | null> => {
  if ((PROTECTED_STATUSES as readonly string[]).includes(oldName)) {
    return "This status is locked and can't be renamed.";
  }
  const trimmed = newName.trim();
  if (!trimmed) return "Status name is required.";
  const existing = await prisma.status.findMany();
  if (existing.some((s) => normalize(s.name) === normalize(trimmed) && s.name !== oldName)) {
    return "That status already exists.";
  }

  await prisma.$transaction([
    prisma.status.update({ where: { name: oldName }, data: { name: trimmed } }),
    prisma.task.updateMany({ where: { status: oldName }, data: { status: trimmed } }),
  ]);

  return null;
};

export const deleteStatus = async (name: string, reassignTo: string | null): Promise<void> => {
  if ((PROTECTED_STATUSES as readonly string[]).includes(name)) return;
  const statusCount = await prisma.status.count();
  if (statusCount <= 1) return;

  const affected = await prisma.task.findMany({ where: { status: name }, include: taskInclude });

  if (affected.length > 0) {
    if (!reassignTo || reassignTo === name) return;
    for (const task of affected) {
      const history = advanceDepartmentHistory(toTask(task), {
        department: task.department,
        status: reassignTo,
        endDate: task.endDate,
        startDate: task.startDate,
      });
      await prisma.$transaction(async (tx) => {
        await tx.departmentHistoryEntry.deleteMany({ where: { taskId: task.id } });
        await tx.task.update({
          where: { id: task.id },
          data: {
            status: reassignTo,
            departmentHistory: {
              create: history.map((h) => ({
                department: h.department,
                enteredAt: h.enteredAt,
                leftAt: h.leftAt,
              })),
            },
          },
        });
      });
    }
  }

  await prisma.status.delete({ where: { name } });
};
