import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationStructure, OrgNode, flattenOrgNodes } from '@/data/organizationStructure';
import { User } from '@/types/workflow';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Users, Building2, FolderTree, Upload, ExternalLink, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ApproverSelectorProps {
  users: User[];
  selectedApprovers: string[];
  onToggleApprover: (userId: string) => void;
  language: string;
}

/** Build a map: orgNodeId/orgNodeName → User[] */
function buildUserGroupMap(users: User[], orgNodes: OrgNode[]): Map<string, User[]> {
  const flat = flattenOrgNodes(orgNodes);
  const map = new Map<string, User[]>();

  for (const node of flat) {
    const matched = users.filter(
      (u) =>
        u.department === node.name ||
        u.department === node.id ||
        (u.plant && u.plant === node.id)
    );
    if (matched.length > 0) {
      map.set(node.id, matched);
    }
  }

  // Users not matching any org node
  const allMapped = new Set(Array.from(map.values()).flat().map((u) => u.id));
  const unmatched = users.filter((u) => !allMapped.has(u.id));
  if (unmatched.length > 0) {
    map.set('__unassigned__', unmatched);
  }

  return map;
}

function OrgTreeNode({
  node,
  depth,
  userMap,
  selectedApprovers,
  onToggleApprover,
  language,
  searchQuery,
}: {
  node: OrgNode;
  depth: number;
  userMap: Map<string, User[]>;
  selectedApprovers: string[];
  onToggleApprover: (userId: string) => void;
  language: string;
  searchQuery: string;
}) {
  const [expanded, setExpanded] = useState(depth < 1);

  const nodeUsers = userMap.get(node.id) || [];
  const hasChildren = node.children && node.children.length > 0;
  const hasContent = nodeUsers.length > 0 || hasChildren;

  // Filter users by search
  const filteredUsers = searchQuery
    ? nodeUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery) ||
          u.email.toLowerCase().includes(searchQuery) ||
          u.department.toLowerCase().includes(searchQuery)
      )
    : nodeUsers;

  // Check if any descendant has matching users
  const hasDescendantMatch = useMemo(() => {
    if (!searchQuery) return true;
    if (filteredUsers.length > 0) return true;
    if (!node.children) return false;
    const checkChildren = (children: OrgNode[]): boolean => {
      for (const child of children) {
        const childUsers = userMap.get(child.id) || [];
        const matched = childUsers.some(
          (u) =>
            u.name.toLowerCase().includes(searchQuery) ||
            u.email.toLowerCase().includes(searchQuery)
        );
        if (matched) return true;
        if (child.children && checkChildren(child.children)) return true;
      }
      return false;
    };
    return checkChildren(node.children);
  }, [searchQuery, filteredUsers, node, userMap]);

  if (searchQuery && !hasDescendantMatch && filteredUsers.length === 0) return null;

  const typeIcon =
    node.type === 'function' ? (
      <Building2 className="h-3.5 w-3.5 text-primary" />
    ) : node.type === 'division' ? (
      <FolderTree className="h-3.5 w-3.5 text-blue-500" />
    ) : (
      <Users className="h-3.5 w-3.5 text-muted-foreground" />
    );

  const typeBadge =
    node.type === 'function'
      ? 'Function'
      : node.type === 'division'
      ? 'Division'
      : node.type === 'group'
      ? 'Group'
      : 'Sub-group';

  const selectedInGroup = nodeUsers.filter((u) => selectedApprovers.includes(u.id)).length;

  return (
    <div>
      <button
        className={cn(
          'w-full flex items-center gap-2 py-2 px-2 rounded-md text-left hover:bg-muted transition-colors',
          depth === 0 && 'font-semibold',
          selectedInGroup > 0 && 'bg-primary/5'
        )}
        style={{ paddingLeft: `${depth * 18 + 8}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        {hasContent ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        {typeIcon}
        <span className="text-xs flex-1 truncate">{node.name}</span>
        {nodeUsers.length > 0 && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-1">
            <Users className="h-2.5 w-2.5" />
            {selectedInGroup > 0 ? `${selectedInGroup}/` : ''}{nodeUsers.length}
          </Badge>
        )}
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
          {typeBadge}
        </Badge>
      </button>

      {expanded && (
        <>
          {/* Users dropdown list for this group */}
          {filteredUsers.length > 0 && (
            <div style={{ paddingLeft: `${depth * 18 + 32}px` }} className="space-y-0.5 py-1">
              {filteredUsers.map((user) => (
                <label
                  key={user.id}
                  className={cn(
                    'flex items-center gap-3 py-1.5 px-3 rounded-md cursor-pointer transition-all',
                    selectedApprovers.includes(user.id)
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted'
                  )}
                >
                  <Checkbox
                    checked={selectedApprovers.includes(user.id)}
                    onCheckedChange={() => onToggleApprover(user.id)}
                  />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    {user.position && (
                      <Badge variant="outline" className="text-[9px] font-semibold">
                        {user.position}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[9px] capitalize">
                      {user.role}
                    </Badge>
                    {selectedApprovers.includes(user.id) && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                        {selectedApprovers.indexOf(user.id) + 1}
                      </span>
                    )}
                </label>
              ))}
            </div>
          )}

          {/* Children nodes */}
          {node.children?.map((child) => (
            <OrgTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              userMap={userMap}
              selectedApprovers={selectedApprovers}
              onToggleApprover={onToggleApprover}
              language={language}
              searchQuery={searchQuery}
            />
          ))}
        </>
      )}
    </div>
  );
}

export function ApproverSelector({
  users,
  selectedApprovers,
  onToggleApprover,
  language,
}: ApproverSelectorProps) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const approverUsers = users.filter(
    (u) => u.role === 'approver' || u.role === 'procurement' || u.role === 'admin'
  );

  const userMap = useMemo(
    () => buildUserGroupMap(approverUsers, organizationStructure),
    [approverUsers]
  );

  const unmatchedUsers = userMap.get('__unassigned__') || [];
  const lowerSearch = searchQuery.toLowerCase();

  const filteredAllUsers = searchQuery
    ? approverUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(lowerSearch) ||
          u.email.toLowerCase().includes(lowerSearch) ||
          u.department.toLowerCase().includes(lowerSearch)
      )
    : approverUsers;

  return (
    <div className="space-y-4">
      {/* Link to admin upload */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={showAll ? 'outline' : 'default'}
            size="sm"
            className="text-xs"
            onClick={() => setShowAll(false)}
          >
            <FolderTree className="h-3.5 w-3.5 mr-1.5" />
            {language === 'th' ? 'เลือกตามแผนก' : 'By Department'}
          </Button>
          <Button
            variant={showAll ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => setShowAll(true)}
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {language === 'th' ? 'ดูทั้งหมด' : 'All Users'}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-primary gap-1.5"
          onClick={() => navigate('/admin')}
        >
          <Upload className="h-3.5 w-3.5" />
          {language === 'th' ? 'อัพโหลดรายชื่อ' : 'Upload Users'}
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="pl-9 h-8 text-xs"
          placeholder={language === 'th' ? 'ค้นหาชื่อ, อีเมล, แผนก...' : 'Search name, email, department...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {showAll ? (
        /* All users flat list */
        <div className="space-y-1 max-h-[400px] overflow-y-auto rounded-lg border p-2">
          {filteredAllUsers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {language === 'th' ? 'ไม่พบผู้ใช้' : 'No users found'}
            </p>
          )}
          {filteredAllUsers.map((user) => (
            <label
              key={user.id}
              className={cn(
                'flex items-center gap-3 py-2 px-3 rounded-md cursor-pointer transition-colors',
                selectedApprovers.includes(user.id)
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted'
              )}
            >
              <Checkbox
                checked={selectedApprovers.includes(user.id)}
                onCheckedChange={() => onToggleApprover(user.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{user.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {user.department} • {user.email}
                </p>
              </div>
              {user.position && (
                <Badge variant="outline" className="text-[9px] font-semibold">
                  {user.position}
                </Badge>
              )}
              <Badge variant="secondary" className="text-[9px] capitalize">
                {user.role}
              </Badge>
              {selectedApprovers.includes(user.id) && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                  {selectedApprovers.indexOf(user.id) + 1}
                </span>
              )}
            </label>
          ))}
        </div>
      ) : (
        /* Org tree view with user dropdowns */
        <div className="max-h-[400px] overflow-y-auto rounded-lg border p-2 space-y-0.5">
          {organizationStructure.map((node) => (
            <OrgTreeNode
              key={node.id}
              node={node}
              depth={0}
              userMap={userMap}
              selectedApprovers={selectedApprovers}
              onToggleApprover={onToggleApprover}
              language={language}
              searchQuery={lowerSearch}
            />
          ))}

          {/* Unassigned users */}
          {unmatchedUsers.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-[10px] font-medium text-muted-foreground px-2 py-1">
                {language === 'th' ? 'ยังไม่ได้กำหนดแผนก' : 'Unassigned Department'}
              </p>
              {unmatchedUsers
                .filter(
                  (u) =>
                    !lowerSearch ||
                    u.name.toLowerCase().includes(lowerSearch) ||
                    u.email.toLowerCase().includes(lowerSearch)
                )
                .map((user) => (
                  <label
                    key={user.id}
                    className={cn(
                      'flex items-center gap-3 py-1.5 px-3 rounded-md cursor-pointer transition-colors',
                      selectedApprovers.includes(user.id)
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Checkbox
                      checked={selectedApprovers.includes(user.id)}
                      onCheckedChange={() => onToggleApprover(user.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {user.department} • {user.email}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[9px] capitalize">
                      {user.role}
                    </Badge>
                    {selectedApprovers.includes(user.id) && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                        {selectedApprovers.indexOf(user.id) + 1}
                      </span>
                    )}
                  </label>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Selected summary */}
      {selectedApprovers.length > 0 && (
        <div className="p-3 rounded-lg bg-muted space-y-2">
          <p className="text-xs font-medium">
            {language === 'th'
              ? `เลือกแล้ว ${selectedApprovers.length} คน`
              : `${selectedApprovers.length} selected`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedApprovers.map((id, idx) => {
              const user = users.find((u) => u.id === id);
              return (
                <Badge key={id} variant="secondary" className="text-[10px] gap-1">
                  <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold">
                    {idx + 1}
                  </span>
                  {user?.name}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
