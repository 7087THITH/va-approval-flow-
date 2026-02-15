import { Project, projectStatusLabels, projectStatusColors } from '@/types/project';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const statusBgMap: Record<string, string> = {
  info: 'bg-info/10 text-info border-info/20',
  primary: 'bg-primary/10 text-primary border-primary/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  success: 'bg-success/10 text-success border-success/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { language } = useApp();
  const statusColor = projectStatusColors[project.status];
  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter(t => t.status === 'done').length;
  const totalSubtasks = project.tasks.reduce((acc, t) => acc + t.subtasks.length, 0);
  const doneSubtasks = project.tasks.reduce((acc, t) => acc + t.subtasks.filter(s => s.completed).length, 0);

  return (
    <div
      onClick={onClick}
      className="group card-interactive p-6 space-y-4 animate-fade-in relative overflow-hidden"
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl transition-all duration-300 group-hover:h-1.5"
        style={{ background: project.color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 pt-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {project.description}
          </p>
        </div>
        <Badge variant="outline" className={cn('text-[10px] shrink-0 border', statusBgMap[statusColor])}>
          {projectStatusLabels[project.status][language]}
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {language === 'th' ? 'ความคืบหน้า' : 'Progress'}
          </span>
          <span className="font-semibold" style={{ color: project.color }}>
            {project.progress}%
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${project.progress}%`,
              background: `linear-gradient(90deg, ${project.color}, ${project.color}cc)`,
            }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ListTodo className="h-3.5 w-3.5" />
          <span>{doneTasks}/{totalTasks} {language === 'th' ? 'งาน' : 'tasks'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>{format(project.endDate, 'dd MMM yy')}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex -space-x-2">
          {project.members.slice(0, 4).map(member => (
            <Avatar key={member.id} className="h-6 w-6 border-2 border-card">
              <AvatarFallback className="text-[9px] bg-accent text-accent-foreground">
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          ))}
          {project.members.length > 4 && (
            <div className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] text-muted-foreground font-medium">
              +{project.members.length - 4}
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {doneSubtasks}/{totalSubtasks} subtasks
        </span>
      </div>
    </div>
  );
}
