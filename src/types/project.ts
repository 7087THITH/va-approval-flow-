// Project Management Types

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: Date;
  endDate: Date;
  progress: number;
  ownerId: string;
  ownerName: string;
  members: { id: string; name: string }[];
  color: string;
  tasks: ProjectTask[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  startDate?: Date;
  endDate?: Date;
  progress: number;
  subtasks: SubTask[];
  order: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
  assigneeName?: string;
}

export const projectStatusLabels: Record<ProjectStatus, { en: string; th: string }> = {
  planning: { en: 'Planning', th: 'วางแผน' },
  in_progress: { en: 'In Progress', th: 'กำลังดำเนินการ' },
  on_hold: { en: 'On Hold', th: 'ระงับชั่วคราว' },
  completed: { en: 'Completed', th: 'เสร็จสิ้น' },
  cancelled: { en: 'Cancelled', th: 'ยกเลิก' },
};

export const taskPriorityLabels: Record<TaskPriority, { en: string; th: string }> = {
  low: { en: 'Low', th: 'ต่ำ' },
  medium: { en: 'Medium', th: 'ปานกลาง' },
  high: { en: 'High', th: 'สูง' },
  critical: { en: 'Critical', th: 'วิกฤต' },
};

export const taskStatusLabels: Record<TaskStatus, { en: string; th: string }> = {
  todo: { en: 'To Do', th: 'รอดำเนินการ' },
  in_progress: { en: 'In Progress', th: 'กำลังทำ' },
  review: { en: 'Review', th: 'ตรวจสอบ' },
  done: { en: 'Done', th: 'เสร็จแล้ว' },
};

export const projectStatusColors: Record<ProjectStatus, string> = {
  planning: 'info',
  in_progress: 'primary',
  on_hold: 'warning',
  completed: 'success',
  cancelled: 'destructive',
};

export const taskPriorityColors: Record<TaskPriority, string> = {
  low: 'muted',
  medium: 'info',
  high: 'warning',
  critical: 'destructive',
};
