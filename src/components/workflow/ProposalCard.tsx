import { VAProposal } from '@/types/workflow';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, ConfidentialityBadge } from './StatusBadge';
import { FileText, Calendar, User, Building, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProposalCardProps {
  proposal: VAProposal;
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ProposalCard({ proposal, showActions = true, onEdit, onDelete }: ProposalCardProps) {
  const { language } = useApp();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/proposal/${proposal.id}`);
  };

  const formatCurrency = (value: number, currency: string) => {
    const formatted = Math.abs(value).toLocaleString();
    const sign = value < 0 ? '-' : '+';
    return `${sign}${formatted} ${currency}`;
  };

  const isDraft = proposal.status === 'draft';
  const isReturned = proposal.status === 'returned';

  return (
    <Card 
      className="card-interactive group"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={proposal.status} />
              <ConfidentialityBadge level={proposal.confidentiality} />
            </div>
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {proposal.partName || 'Untitled Proposal'}
            </h3>
            {proposal.proposalNo && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <FileText size={14} />
                {proposal.proposalNo}
              </p>
            )}
          </div>
          <ChevronRight 
            className="text-muted-foreground group-hover:text-primary transition-colors" 
            size={20} 
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User size={14} />
            <span className="truncate">{proposal.requesterName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building size={14} />
            <span className="truncate">
              {language === 'th' && proposal.departmentTh ? proposal.departmentTh : proposal.department}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={14} />
            <span>{format(proposal.createdAt, 'MMM d, yyyy')}</span>
          </div>
          {proposal.cost.annualContribution !== 0 && (
            <div className={cn(
              "font-medium",
              proposal.cost.annualContribution < 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(proposal.cost.annualContribution, `K ${proposal.cost.currency}/yr`)}
            </div>
          )}
        </div>

        {/* Approval progress */}
        {proposal.status === 'pending' && proposal.approvalRoute.steps.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Approval Progress:</span>
              <div className="flex gap-1">
                {proposal.approvalRoute.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      step.status === 'approved' && "bg-success",
                      step.status === 'rejected' && "bg-destructive",
                      step.status === 'pending' && idx === proposal.currentStepIndex && "bg-warning animate-pulse-subtle",
                      step.status === 'pending' && idx !== proposal.currentStepIndex && "bg-muted"
                    )}
                    title={step.approverName}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Step {proposal.currentStepIndex + 1}/{proposal.approvalRoute.steps.length}
              </span>
            </div>
          </div>
        )}

        {/* Draft / Returned actions */}
        {(isDraft || isReturned) && (onEdit || onDelete) && (
          <div className="pt-3 border-t flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(proposal.id);
                }}
              >
                <Pencil className="h-3 w-3 mr-1.5" />
                {language === 'th' ? 'แก้ไข' : 'Edit'}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(proposal.id);
                }}
              >
                <Trash2 className="h-3 w-3 mr-1.5" />
                {language === 'th' ? 'ลบ' : 'Delete'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
