import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Shield, UserCog, Search } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole, User } from '@/types/workflow';
import { usePermissions, ALL_PAGES } from '@/context/PermissionContext';

interface PermissionManagerProps {
  users: User[];
  language: string;
}

export function PermissionManager({ users, language }: PermissionManagerProps) {
  const { roleAccess, setRoleAccess, userOverrides, setUserOverrides } = usePermissions();
  const [userSearch, setUserSearch] = useState('');

  const toggleRoleAccess = (role: UserRole, pageKey: string) => {
    setRoleAccess(prev => {
      const current = prev[role] || [];
      const updated = current.includes(pageKey) 
        ? current.filter(p => p !== pageKey)
        : [...current, pageKey];
      return { ...prev, [role]: updated };
    });
  };

  const toggleUserOverride = (userId: string, pageKey: string) => {
    setUserOverrides(prev => {
      const current = prev[userId] || [];
      const updated = current.includes(pageKey)
        ? current.filter(p => p !== pageKey)
        : [...current, pageKey];
      return { ...prev, [userId]: updated };
    });
  };

  const initUserOverride = (user: User) => {
    if (!userOverrides[user.id]) {
      // Initialize from role defaults
      setUserOverrides(prev => ({
        ...prev,
        [user.id]: [...(roleAccess[user.role] || [])],
      }));
    }
  };

  const removeUserOverride = (userId: string) => {
    setUserOverrides(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const s = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  return (
    <Tabs defaultValue="role" className="space-y-4">
      <TabsList>
        <TabsTrigger value="role" className="text-xs gap-1.5">
          <Shield className="h-3 w-3" />
          {language === 'th' ? 'สิทธิ์ตาม Role' : 'Role-based'}
        </TabsTrigger>
        <TabsTrigger value="user" className="text-xs gap-1.5">
          <UserCog className="h-3 w-3" />
          {language === 'th' ? 'สิทธิ์รายบุคคล' : 'Per-user'}
        </TabsTrigger>
      </TabsList>

      {/* Role-based access */}
      <TabsContent value="role">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {language === 'th' ? 'สิทธิ์การเข้าถึงตามบทบาท' : 'Role-based Access Control'}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === 'th' 
                ? 'กำหนดว่า Role แต่ละประเภทเข้าถึงฟังก์ชันใดได้บ้าง'
                : 'Define which functions each role can access'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] w-28">
                    {language === 'th' ? 'บทบาท' : 'Role'}
                  </TableHead>
                  {ALL_PAGES.map(p => (
                    <TableHead key={p.pageKey} className="text-[10px] text-center px-1">
                      {language === 'th' ? p.labelTh : p.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(['requester', 'approver', 'admin', 'procurement'] as UserRole[]).map(role => (
                  <TableRow key={role}>
                    <TableCell className="text-xs font-medium capitalize">{role}</TableCell>
                    {ALL_PAGES.map(p => (
                      <TableCell key={p.pageKey} className="text-center">
                        <Checkbox
                          checked={roleAccess[role]?.includes(p.pageKey)}
                          onCheckedChange={() => toggleRoleAccess(role, p.pageKey)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4">
              <Button size="sm" className="text-xs" onClick={() => {
                toast.success(language === 'th' ? 'บันทึกสิทธิ์ตาม Role สำเร็จ' : 'Role permissions saved');
              }}>
                <Save className="h-3.5 w-3.5 mr-1" />
                {language === 'th' ? 'บันทึก' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Per-user override */}
      <TabsContent value="user">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {language === 'th' ? 'สิทธิ์รายบุคคล' : 'Per-user Access Override'}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === 'th'
                ? 'กำหนดสิทธิ์เฉพาะรายบุคคล (override จาก Role)'
                : 'Override role defaults for specific users'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-9 h-8 text-xs"
                placeholder={language === 'th' ? 'ค้นหาผู้ใช้...' : 'Search users...'}
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] w-40">
                      {language === 'th' ? 'ผู้ใช้' : 'User'}
                    </TableHead>
                    <TableHead className="text-[11px] w-20">Role</TableHead>
                    <TableHead className="text-[11px] w-20">Override</TableHead>
                    {ALL_PAGES.map(p => (
                      <TableHead key={p.pageKey} className="text-[9px] text-center px-0.5">
                        {language === 'th' ? p.labelTh : p.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => {
                    const hasOverride = !!userOverrides[user.id];
                    const effectiveAccess = hasOverride ? userOverrides[user.id] : roleAccess[user.role] || [];
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="text-xs">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[9px] capitalize">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {hasOverride ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[9px] h-5 px-1.5 text-destructive"
                              onClick={() => removeUserOverride(user.id)}
                            >
                              {language === 'th' ? 'ลบ' : 'Remove'}
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[9px] h-5 px-1.5"
                              onClick={() => initUserOverride(user)}
                            >
                              {language === 'th' ? 'ตั้งค่า' : 'Set'}
                            </Button>
                          )}
                        </TableCell>
                        {ALL_PAGES.map(p => (
                          <TableCell key={p.pageKey} className="text-center">
                            <Checkbox
                              checked={effectiveAccess.includes(p.pageKey)}
                              disabled={!hasOverride}
                              onCheckedChange={() => toggleUserOverride(user.id, p.pageKey)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end mt-4">
              <Button size="sm" className="text-xs" onClick={() => {
                toast.success(language === 'th' ? 'บันทึกสิทธิ์รายบุคคลสำเร็จ' : 'User permissions saved');
              }}>
                <Save className="h-3.5 w-3.5 mr-1" />
                {language === 'th' ? 'บันทึก' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
