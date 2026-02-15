import { ProposalStatus, ConfidentialityLevel } from '@/types/workflow';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext';

interface StatusBadgeProps {
  status: ProposalStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t, language } = useApp();

  const variantMap: Record<ProposalStatus, 'draft' | 'pending' | 'approved' | 'rejected' | 'revision'> = {
    draft: 'draft',
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    revision: 'revision',
    returned: 'revision',
    evaluation: 'pending',
  };

  const label = status === 'returned' 
    ? (language === 'th' ? 'ส่งคืน' : 'Returned')
    : t(status as any);

  return (
    <Badge variant={variantMap[status]}>
      {label}
    </Badge>
  );
}

interface ConfidentialityBadgeProps {
  level: ConfidentialityLevel;
}

export function ConfidentialityBadge({ level }: ConfidentialityBadgeProps) {
  const { t } = useApp();

  return (
    <Badge variant={level}>
      {t(level as any)}
    </Badge>
  );
}
