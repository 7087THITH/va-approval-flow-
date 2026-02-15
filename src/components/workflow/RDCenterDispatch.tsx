import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { User, VAProposal } from '@/types/workflow';
import { organizationStructure, flattenOrgNodes } from '@/data/organizationStructure';
import { Send, Building2, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RDCenterDispatchProps {
  proposal: VAProposal;
  users: User[];
  currentUser: User;
  language: string;
  onDispatch: (assignedTeams: string[], assignedMembers: string[], notes: string) => void;
}

export function RDCenterDispatch({ proposal, users, currentUser, language, onDispatch }: RDCenterDispatchProps) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Get R&D groups from org structure
  const rrdFunction = organizationStructure.find(n => n.id === 'rrd');
  const rddDivision = rrdFunction?.children?.find(n => n.id === 'rdd');
  const rdGroups = rddDivision?.children || [];

  // Get users in each R&D group
  const allOrgNodes = flattenOrgNodes(organizationStructure);
  const getUsersForGroup = (groupId: string) => {
    const node = allOrgNodes.find(n => n.id === groupId);
    if (!node) return [];
    return users.filter(u => 
      u.department === node.name || u.department === node.id || u.plant === node.id
    );
  };

  // Check if current user is a Center member
  const centerGroup = rdGroups.find(g => g.id === 'dcg');
  const isCenterMember = centerGroup && users.some(u => 
    u.id === currentUser.id && (u.department === centerGroup.name || u.department === centerGroup.id)
  );

  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) ? prev.filter(t => t !== teamId) : [...prev, teamId]
    );
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(m => m !== userId) : [...prev, userId]
    );
  };

  const handleDispatch = () => {
    if (selectedTeams.length === 0 && selectedMembers.length === 0) {
      toast.error(language === 'th' ? 'กรุณาเลือกทีมหรือสมาชิกอย่างน้อย 1 รายการ' : 'Please select at least 1 team or member');
      return;
    }
    onDispatch(selectedTeams, selectedMembers, dispatchNotes);
    toast.success(language === 'th' ? 'มอบหมายงานสำเร็จ — แจ้งเตือนถูกส่งแล้ว' : 'Assignment dispatched — notifications sent');
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
            {language === 'th' ? 'R&D Center — มอบหมายทีมรับผิดชอบ' : 'R&D Center — Assign Responsible Team'}
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          {language === 'th'
            ? 'ในฐานะ Development Center คุณสามารถเลือกทีมและสมาชิกของ R&D ที่จะรับผิดชอบเอกสารนี้ ผู้ขอและผู้ที่เกี่ยวข้องจะได้รับแจ้งเตือนอัตโนมัติ'
            : 'As Development Center, select R&D teams and members responsible for this proposal. Requester and route participants will be notified automatically.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info box */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-100/50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-blue-800 dark:text-blue-200">
            {language === 'th'
              ? `เอกสาร: ${proposal.proposalNo || 'Draft'} — "${proposal.partName}" จาก ${proposal.requesterName}`
              : `Proposal: ${proposal.proposalNo || 'Draft'} — "${proposal.partName}" from ${proposal.requesterName}`}
          </p>
        </div>

        {/* Team selection */}
        <div className="space-y-2">
          <p className="text-xs font-medium">
            {language === 'th' ? 'เลือกทีม R&D ที่รับผิดชอบ' : 'Select Responsible R&D Teams'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {rdGroups.filter(g => g.id !== 'dcg').map(group => {
              const groupUsers = getUsersForGroup(group.id);
              return (
                <label
                  key={group.id}
                  className={cn(
                    'flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors text-xs',
                    selectedTeams.includes(group.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40' : 'hover:bg-muted'
                  )}
                >
                  <Checkbox
                    checked={selectedTeams.includes(group.id)}
                    onCheckedChange={() => toggleTeam(group.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-[11px]">{group.name}</p>
                    <p className="text-[9px] text-muted-foreground">{groupUsers.length} members</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Member selection for selected teams */}
        {selectedTeams.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium">
              {language === 'th' ? 'เลือกสมาชิกเฉพาะ (ไม่บังคับ)' : 'Select Specific Members (optional)'}
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border p-2">
              {selectedTeams.flatMap(teamId => {
                const groupUsers = getUsersForGroup(teamId);
                const teamNode = rdGroups.find(g => g.id === teamId);
                return groupUsers.length > 0 ? groupUsers.map(user => (
                  <label
                    key={user.id}
                    className={cn(
                      'flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors',
                      selectedMembers.includes(user.id) ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-muted'
                    )}
                  >
                    <Checkbox
                      checked={selectedMembers.includes(user.id)}
                      onCheckedChange={() => toggleMember(user.id)}
                    />
                    <span className="text-xs">{user.name}</span>
                    <Badge variant="outline" className="text-[8px] ml-auto">{teamNode?.name}</Badge>
                  </label>
                )) : [(
                  <p key={teamId} className="text-[10px] text-muted-foreground px-2 py-1">
                    {teamNode?.name}: {language === 'th' ? 'ยังไม่มีสมาชิก' : 'No members yet'}
                  </p>
                )];
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium">
            {language === 'th' ? 'หมายเหตุการมอบหมาย' : 'Dispatch Notes'}
          </p>
          <Textarea
            className="text-xs min-h-[60px]"
            value={dispatchNotes}
            onChange={e => setDispatchNotes(e.target.value)}
            placeholder={language === 'th' ? 'เพิ่มหมายเหตุ...' : 'Add notes...'}
          />
        </div>

        {/* Summary */}
        {(selectedTeams.length > 0 || selectedMembers.length > 0) && (
          <div className="p-2.5 rounded-lg bg-muted space-y-1">
            <p className="text-[10px] font-medium">
              {language === 'th' ? 'สรุปการมอบหมาย:' : 'Assignment Summary:'}
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedTeams.map(t => {
                const node = rdGroups.find(g => g.id === t);
                return <Badge key={t} variant="secondary" className="text-[9px]"><Users className="h-2.5 w-2.5 mr-1" />{node?.name}</Badge>;
              })}
              {selectedMembers.map(m => {
                const user = users.find(u => u.id === m);
                return <Badge key={m} className="text-[9px]">{user?.name}</Badge>;
              })}
            </div>
          </div>
        )}

        {/* Dispatch button */}
        <Button
          onClick={handleDispatch}
          disabled={selectedTeams.length === 0 && selectedMembers.length === 0}
          className="w-full text-xs"
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          {language === 'th' ? 'มอบหมายและแจ้งเตือน' : 'Dispatch & Notify'}
        </Button>
      </CardContent>
    </Card>
  );
}
