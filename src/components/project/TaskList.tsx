import { useState } from 'react';
import { ProjectTask, SubTask, TaskStatus, TaskPriority, taskStatusLabels, taskPriorityLabels, taskPriorityColors } from '@/types/project';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Plus, ChevronDown, ChevronRight, GripVertical, Trash2, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: ProjectTask[];
  onUpdateTask: (taskId: string, updates: Partial<ProjectTask>) => void;
  onAddTask: (task: Partial<ProjectTask>) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  projectColor: string;
}

const priorityBgMap: Record<string, string> = {
  muted: 'bg-muted text-muted-foreground',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

const statusIcons: Record<TaskStatus, string> = {
  todo: '○',
  in_progress: '◐',
  review: '◑',
  done: '●',
};

export function TaskList({
  tasks,
  onUpdateTask,
  onAddTask,
  onDeleteTask,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  projectColor,
}: TaskListProps) {
  const { language } = useApp();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set(tasks.slice(0, 2).map(t => t.id)));
  const [showAddTask, setShowAddTask] = useState(false);
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask({
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      status: 'todo',
      startDate: newTaskStart ? new Date(newTaskStart) : undefined,
      endDate: newTaskEnd ? new Date(newTaskEnd) : undefined,
      progress: 0,
      subtasks: [],
    });
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setNewTaskStart('');
    setNewTaskEnd('');
    setShowAddTask(false);
  };

  const handleAddSubtask = (taskId: string) => {
    const title = newSubtaskInputs[taskId]?.trim();
    if (!title) return;
    onAddSubtask(taskId, title);
    setNewSubtaskInputs(prev => ({ ...prev, [taskId]: '' }));
  };

  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground">
          {language === 'th' ? 'รายการงาน' : 'Tasks'} ({tasks.length})
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowAddTask(true)} className="h-7 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {language === 'th' ? 'เพิ่มงาน' : 'Add Task'}
        </Button>
      </div>

      {/* Task items */}
      <div className="space-y-1.5">
        {sortedTasks.map((task, index) => {
          const isExpanded = expandedTasks.has(task.id);
          const completedSubs = task.subtasks.filter(s => s.completed).length;
          const totalSubs = task.subtasks.length;
          const priorityColor = taskPriorityColors[task.priority];

          return (
            <div key={task.id} className="rounded-lg border bg-card overflow-hidden animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              {/* Task header */}
              <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-accent/30 transition-colors">
                <button onClick={() => toggleExpand(task.id)} className="text-muted-foreground hover:text-foreground">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                <div className="w-1 h-8 rounded-full" style={{ background: projectColor }} />

                <span className="text-sm mr-1" title={taskStatusLabels[task.status][language]}>
                  {statusIcons[task.status]}
                </span>

                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', task.status === 'done' && 'line-through text-muted-foreground')}>
                    {task.title}
                  </p>
                </div>

                <Badge variant="outline" className={cn('text-[10px] shrink-0', priorityBgMap[priorityColor])}>
                  {taskPriorityLabels[task.priority][language]}
                </Badge>

                <Select
                  value={task.status}
                  onValueChange={v => onUpdateTask(task.id, { status: v as TaskStatus, progress: v === 'done' ? 100 : v === 'todo' ? 0 : task.progress })}
                >
                  <SelectTrigger className="h-6 w-24 text-[10px] border-none bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(taskStatusLabels) as TaskStatus[]).map(s => (
                      <SelectItem key={s} value={s} className="text-xs">{taskStatusLabels[s][language]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {task.assigneeName && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                    <User className="h-3 w-3" />
                    {task.assigneeName.split(' ')[0]}
                  </span>
                )}

                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDeleteTask(task.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-3 border-t bg-accent/10">
                  {/* Date info */}
                  {(task.startDate || task.endDate) && (
                    <div className="flex items-center gap-3 pt-2 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {task.startDate && format(task.startDate, 'dd MMM yyyy')}
                      {task.startDate && task.endDate && ' → '}
                      {task.endDate && format(task.endDate, 'dd MMM yyyy')}
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{totalSubs > 0 ? `${completedSubs}/${totalSubs} subtasks` : 'No subtasks'}</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%`, background: projectColor }}
                      />
                    </div>
                  </div>

                  {/* Subtasks */}
                  <div className="space-y-1">
                    {task.subtasks.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2 group/sub py-0.5">
                        <Checkbox
                          checked={sub.completed}
                          onCheckedChange={() => onToggleSubtask(task.id, sub.id)}
                          className="h-3.5 w-3.5"
                        />
                        <span className={cn('text-xs flex-1', sub.completed && 'line-through text-muted-foreground')}>
                          {sub.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover/sub:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteSubtask(task.id, sub.id)}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add subtask */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={language === 'th' ? 'เพิ่ม subtask...' : 'Add subtask...'}
                      value={newSubtaskInputs[task.id] || ''}
                      onChange={e => setNewSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddSubtask(task.id)}
                      className="h-7 text-xs"
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleAddSubtask(task.id)} className="h-7 text-xs shrink-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="sm:max-w-md glass">
          <DialogHeader>
            <DialogTitle>{language === 'th' ? 'เพิ่มงานใหม่' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="form-label">{language === 'th' ? 'ชื่องาน' : 'Task Title'} *</Label>
              <Input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder={language === 'th' ? 'ชื่องาน...' : 'Task title...'} />
            </div>
            <div className="space-y-1.5">
              <Label className="form-label">{language === 'th' ? 'ความสำคัญ' : 'Priority'}</Label>
              <Select value={newTaskPriority} onValueChange={v => setNewTaskPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(taskPriorityLabels) as TaskPriority[]).map(p => (
                    <SelectItem key={p} value={p}>{taskPriorityLabels[p][language]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="form-label">{language === 'th' ? 'วันเริ่ม' : 'Start'}</Label>
                <Input type="date" value={newTaskStart} onChange={e => setNewTaskStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="form-label">{language === 'th' ? 'วันสิ้นสุด' : 'End'}</Label>
                <Input type="date" value={newTaskEnd} onChange={e => setNewTaskEnd(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTask(false)}>{language === 'th' ? 'ยกเลิก' : 'Cancel'}</Button>
            <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>{language === 'th' ? 'เพิ่ม' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
