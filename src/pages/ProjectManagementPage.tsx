import { useState, useMemo } from 'react';
import { Project, ProjectTask, SubTask, ProjectStatus, projectStatusLabels, projectStatusColors } from '@/types/project';
import { MainLayout } from '@/components/layout/MainLayout';
import { useApp } from '@/context/AppContext';
import { ProjectCard } from '@/components/project/ProjectCard';
import { ProjectForm } from '@/components/project/ProjectForm';
import { TaskList } from '@/components/project/TaskList';
import { GanttChart } from '@/components/project/GanttChart';
import { Project as ProjectType } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, LayoutGrid, GanttChartSquare, ArrowLeft, Calendar, Users, ListTodo, Pencil, Trash2, FolderKanban, Target, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
export default function ProjectManagementPage() {
  const {
    language
  } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    overallProgress: projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) : 0
  }), [projects]);

  // Project CRUD
  const handleSaveProject = (data: Partial<Project>) => {
    if (data.id) {
      setProjects(prev => prev.map(p => p.id === data.id ? {
        ...p,
        ...data,
        updatedAt: new Date()
      } : p));
      if (selectedProject?.id === data.id) {
        setSelectedProject(prev => prev ? {
          ...prev,
          ...data,
          updatedAt: new Date()
        } : null);
      }
      toast.success(language === 'th' ? 'บันทึกโปรเจคแล้ว' : 'Project saved');
    } else {
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: data.name || '',
        description: data.description || '',
        status: data.status || 'planning',
        startDate: data.startDate || new Date(),
        endDate: data.endDate || new Date(),
        progress: 0,
        ownerId: data.ownerId || '',
        ownerName: data.ownerName || '',
        members: [{
          id: data.ownerId || '',
          name: data.ownerName || ''
        }],
        color: data.color || 'hsl(217 91% 60%)',
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setProjects(prev => [...prev, newProject]);
      toast.success(language === 'th' ? 'สร้างโปรเจคใหม่แล้ว' : 'Project created');
    }
  };
  const handleDeleteProject = () => {
    if (!deleteProjectId) return;
    setProjects(prev => prev.filter(p => p.id !== deleteProjectId));
    if (selectedProject?.id === deleteProjectId) setSelectedProject(null);
    setDeleteProjectId(null);
    toast.success(language === 'th' ? 'ลบโปรเจคแล้ว' : 'Project deleted');
  };

  // Task operations
  const updateProject = (projectId: string, updater: (p: Project) => Project) => {
    setProjects(prev => prev.map(p => p.id === projectId ? updater(p) : p));
    if (selectedProject?.id === projectId) {
      setSelectedProject(prev => prev ? updater(prev) : null);
    }
  };
  const recalcProgress = (tasks: ProjectTask[]): number => {
    if (tasks.length === 0) return 0;
    return Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length);
  };
  const handleUpdateTask = (taskId: string, updates: Partial<ProjectTask>) => {
    if (!selectedProject) return;
    updateProject(selectedProject.id, p => {
      const newTasks = p.tasks.map(t => t.id === taskId ? {
        ...t,
        ...updates
      } : t);
      return {
        ...p,
        tasks: newTasks,
        progress: recalcProgress(newTasks),
        updatedAt: new Date()
      };
    });
  };
  const handleAddTask = (data: Partial<ProjectTask>) => {
    if (!selectedProject) return;
    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      projectId: selectedProject.id,
      title: data.title || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      startDate: data.startDate,
      endDate: data.endDate,
      progress: 0,
      subtasks: [],
      order: selectedProject.tasks.length + 1
    };
    updateProject(selectedProject.id, p => {
      const newTasks = [...p.tasks, newTask];
      return {
        ...p,
        tasks: newTasks,
        progress: recalcProgress(newTasks),
        updatedAt: new Date()
      };
    });
    toast.success(language === 'th' ? 'เพิ่มงานแล้ว' : 'Task added');
  };
  const handleDeleteTask = (taskId: string) => {
    if (!selectedProject) return;
    updateProject(selectedProject.id, p => {
      const newTasks = p.tasks.filter(t => t.id !== taskId);
      return {
        ...p,
        tasks: newTasks,
        progress: recalcProgress(newTasks),
        updatedAt: new Date()
      };
    });
  };
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    if (!selectedProject) return;
    updateProject(selectedProject.id, p => {
      const newTasks = p.tasks.map(t => {
        if (t.id !== taskId) return t;
        const newSubs = t.subtasks.map(s => s.id === subtaskId ? {
          ...s,
          completed: !s.completed
        } : s);
        const completed = newSubs.filter(s => s.completed).length;
        const total = newSubs.length;
        const progress = total > 0 ? Math.round(completed / total * 100) : t.progress;
        return {
          ...t,
          subtasks: newSubs,
          progress
        };
      });
      return {
        ...p,
        tasks: newTasks,
        progress: recalcProgress(newTasks),
        updatedAt: new Date()
      };
    });
  };
  const handleAddSubtask = (taskId: string, title: string) => {
    if (!selectedProject) return;
    updateProject(selectedProject.id, p => {
      const newTasks = p.tasks.map(t => {
        if (t.id !== taskId) return t;
        const newSubs = [...t.subtasks, {
          id: `st-${Date.now()}`,
          title,
          completed: false
        }];
        const completed = newSubs.filter(s => s.completed).length;
        const progress = Math.round(completed / newSubs.length * 100);
        return {
          ...t,
          subtasks: newSubs,
          progress
        };
      });
      return {
        ...p,
        tasks: newTasks,
        progress: recalcProgress(newTasks),
        updatedAt: new Date()
      };
    });
  };
  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    if (!selectedProject) return;
    updateProject(selectedProject.id, p => {
      const newTasks = p.tasks.map(t => {
        if (t.id !== taskId) return t;
        const newSubs = t.subtasks.filter(s => s.id !== subtaskId);
        const completed = newSubs.filter(s => s.completed).length;
        const progress = newSubs.length > 0 ? Math.round(completed / newSubs.length * 100) : 0;
        return {
          ...t,
          subtasks: newSubs,
          progress
        };
      });
      return {
        ...p,
        tasks: newTasks,
        progress: recalcProgress(newTasks),
        updatedAt: new Date()
      };
    });
  };

  // Status color map
  const statCards = [{
    label: language === 'th' ? 'ทั้งหมด' : 'Total',
    value: stats.total,
    icon: FolderKanban,
    color: 'primary'
  }, {
    label: language === 'th' ? 'กำลังดำเนินการ' : 'In Progress',
    value: stats.inProgress,
    icon: TrendingUp,
    color: 'info'
  }, {
    label: language === 'th' ? 'เสร็จสิ้น' : 'Completed',
    value: stats.completed,
    icon: Target,
    color: 'success'
  }, {
    label: language === 'th' ? 'ความคืบหน้ารวม' : 'Overall Progress',
    value: `${stats.overallProgress}%`,
    icon: Clock,
    color: 'warning'
  }];
  const statColorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    info: 'bg-info/10 text-info',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning'
  };
  return <MainLayout><div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            
            {language === 'th' ? 'จัดการโปรเจค' : 'Project Management'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {language === 'th' ? 'จัดการโปรเจค Schedule และงานทั้งหมด' : 'Manage projects, schedules and tasks'}
          </p>
        </div>
        <Button onClick={() => {
        setEditingProject(null);
        setShowProjectForm(true);
      }} className="gap-2 px-5">
          <Plus className="h-4 w-4" />
          {language === 'th' ? 'สร้างโปรเจค' : 'New Project'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(stat => {
        const Icon = stat.icon;
        return <div key={stat.label} className="card-elevated p-5 flex items-center gap-4">
              <div className={cn('p-3 rounded-xl', statColorMap[stat.color])}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </div>;
      })}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="glass">
            <TabsTrigger value="projects" className="gap-2 text-xs px-4">
              <LayoutGrid className="h-3.5 w-3.5" />
              {language === 'th' ? 'โปรเจค' : 'Projects'}
            </TabsTrigger>
            <TabsTrigger value="master-schedule" className="gap-2 text-xs px-4">
              <GanttChartSquare className="h-3.5 w-3.5" />
              {language === 'th' ? 'Master Schedule' : 'Master Schedule'}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'projects' && <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder={language === 'th' ? 'ค้นหาโปรเจค...' : 'Search projects...'} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 w-60 text-xs" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-40 text-xs">
                  <SelectValue placeholder={language === 'th' ? 'สถานะ' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'th' ? 'ทั้งหมด' : 'All'}</SelectItem>
                  {(Object.keys(projectStatusLabels) as ProjectStatus[]).map(s => <SelectItem key={s} value={s}>{projectStatusLabels[s][language]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>}
        </div>

        {/* Projects Grid */}
        <TabsContent value="projects" className="mt-6">
          {selectedProject ? <ProjectDetailView project={selectedProject} language={language} onBack={() => setSelectedProject(null)} onEdit={() => {
          setEditingProject(selectedProject);
          setShowProjectForm(true);
        }} onDelete={() => setDeleteProjectId(selectedProject.id)} onUpdateTask={handleUpdateTask} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} onDeleteSubtask={handleDeleteSubtask} /> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProjects.map(project => <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} />)}
              {filteredProjects.length === 0 && <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FolderKanban className="h-12 w-12 mb-3 opacity-30" />
                  <p>{language === 'th' ? 'ไม่พบโปรเจค' : 'No projects found'}</p>
                </div>}
            </div>}
        </TabsContent>

        {/* Master Schedule */}
        <TabsContent value="master-schedule" className="mt-6">
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              {projects.map(p => <div key={p.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded" style={{
                background: p.color
              }} />
                  <span>{p.name}</span>
                  <span className="text-[10px]">({p.progress}%)</span>
                </div>)}
            </div>
            <GanttChart projects={projects.filter(p => p.tasks.some(t => t.startDate && t.endDate))} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ProjectForm open={showProjectForm} onClose={() => {
      setShowProjectForm(false);
      setEditingProject(null);
    }} onSave={handleSaveProject} project={editingProject} />

      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'th' ? 'ยืนยันลบโปรเจค' : 'Delete Project'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'th' ? 'คุณแน่ใจหรือไม่ที่จะลบโปรเจคนี้? การกระทำนี้ไม่สามารถย้อนกลับได้' : 'Are you sure you want to delete this project? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'th' ? 'ยกเลิก' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'th' ? 'ลบ' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div></MainLayout>;
}

// ─────────────────────────────────────
// Project Detail View (inline)
// ─────────────────────────────────────

interface ProjectDetailViewProps {
  project: Project;
  language: 'en' | 'th';
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateTask: (taskId: string, updates: Partial<ProjectTask>) => void;
  onAddTask: (task: Partial<ProjectTask>) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}
function ProjectDetailView({
  project,
  language,
  onBack,
  onEdit,
  onDelete,
  onUpdateTask,
  onAddTask,
  onDeleteTask,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask
}: ProjectDetailViewProps) {
  const [detailTab, setDetailTab] = useState('tasks');
  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter(t => t.status === 'done').length;
  const totalSubtasks = project.tasks.reduce((acc, t) => acc + t.subtasks.length, 0);
  const doneSubtasks = project.tasks.reduce((acc, t) => acc + t.subtasks.filter(s => s.completed).length, 0);
  return <div className="space-y-6 animate-slide-up">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="mt-0.5 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 rounded-full" style={{
              background: project.color
            }} />
              <h2 className="text-xl font-bold text-foreground">{project.name}</h2>
              <Badge variant="outline" className="text-[10px]">
                {projectStatusLabels[project.status][language]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-6">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5 text-xs">
            <Pencil className="h-3.5 w-3.5" />
            {language === 'th' ? 'แก้ไข' : 'Edit'}
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="gap-1.5 text-xs text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
            {language === 'th' ? 'ลบ' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card-elevated p-4 text-center">
          <p className="text-xl font-bold" style={{
          color: project.color
        }}>{project.progress}%</p>
          <p className="text-xs text-muted-foreground mt-1">{language === 'th' ? 'ความคืบหน้า' : 'Progress'}</p>
        </div>
        <div className="card-elevated p-4 text-center">
          <p className="text-xl font-bold text-foreground">{doneTasks}/{totalTasks}</p>
          <p className="text-xs text-muted-foreground mt-1">{language === 'th' ? 'งาน' : 'Tasks'}</p>
        </div>
        <div className="card-elevated p-4 text-center">
          <p className="text-xl font-bold text-foreground">{doneSubtasks}/{totalSubtasks}</p>
          <p className="text-xs text-muted-foreground mt-1">Subtasks</p>
        </div>
        <div className="card-elevated p-4 text-center">
          <p className="text-xl font-bold text-foreground">{project.members.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{language === 'th' ? 'สมาชิก' : 'Members'}</p>
        </div>
        <div className="card-elevated p-4 text-center">
          <p className="text-sm font-medium text-foreground">{format(project.endDate, 'dd MMM yy')}</p>
          <p className="text-xs text-muted-foreground mt-1">{language === 'th' ? 'กำหนดเสร็จ' : 'Due Date'}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card-elevated p-5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground">{language === 'th' ? 'ความคืบหน้าโดยรวม' : 'Overall Progress'}</span>
          <span className="font-bold" style={{
          color: project.color
        }}>{project.progress}%</span>
        </div>
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700" style={{
          width: `${project.progress}%`,
          background: `linear-gradient(90deg, ${project.color}, ${project.color}aa)`
        }} />
        </div>
      </div>

      {/* Tabs: Tasks / Schedule */}
      <Tabs value={detailTab} onValueChange={setDetailTab}>
        <TabsList className="glass">
          <TabsTrigger value="tasks" className="gap-1.5 text-xs">
            <ListTodo className="h-3.5 w-3.5" />
            {language === 'th' ? 'รายการงาน' : 'Tasks'}
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5 text-xs">
            <GanttChartSquare className="h-3.5 w-3.5" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-5">
          <TaskList tasks={project.tasks} onUpdateTask={onUpdateTask} onAddTask={onAddTask} onDeleteTask={onDeleteTask} onToggleSubtask={onToggleSubtask} onAddSubtask={onAddSubtask} onDeleteSubtask={onDeleteSubtask} projectColor={project.color} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-5">
          <GanttChart projects={[project]} singleProject />
        </TabsContent>
      </Tabs>
    </div>;
}