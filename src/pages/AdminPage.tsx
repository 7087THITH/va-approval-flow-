import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { User, UserRole, ApprovalRouteType } from '@/types/workflow';
import { UserBulkUpload } from '@/components/admin/UserBulkUpload';
import { VACalculateSettings } from '@/components/admin/VACalculateSettings';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Save, Calculator, KeyRound, Eye, EyeOff, Search, X } from 'lucide-react';
import { PermissionManager } from '@/components/admin/PermissionManager';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RouteTemplate {
  id: string;
  name: string;
  type: ApprovalRouteType;
  steps: { approverId: string; approverName: string; order: number }[];
}

// Pages list and default access moved to PermissionContext

export default function AdminPage() {
  const { users, setUsers, language } = useApp();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);
  const [passwordTargetUser, setPasswordTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [routeTemplates, setRouteTemplates] = useState<RouteTemplate[]>([]);
  const [editingRoute, setEditingRoute] = useState<RouteTemplate | null>(null);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  // accessControl now managed by PermissionContext
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  // User form state
  const [userForm, setUserForm] = useState({
    name: '',
    nameTh: '',
    email: '',
    role: 'requester' as UserRole,
    department: '',
    departmentTh: '',
    plant: '',
    password: '',
  });

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      nameTh: user.nameTh || '',
      email: user.email,
      role: user.role,
      department: user.department,
      departmentTh: user.departmentTh || '',
      plant: user.plant || '',
      password: '',
    });
    setShowUserDialog(true);
  };

  const openNewUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', nameTh: '', email: '', role: 'requester', department: '', departmentTh: '', plant: '', password: '' });
    setShowUserDialog(true);
  };

  const saveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast.error(language === 'th' ? 'กรุณากรอกชื่อและอีเมล' : 'Name and email are required');
      return;
    }

    if (!editingUser && !userForm.password) {
      toast.error(language === 'th' ? 'กรุณากรอกรหัสผ่าน' : 'Password is required for new users');
      return;
    }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, ...userForm } : u
        )
      );
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: userForm.name,
        nameTh: userForm.nameTh,
        email: userForm.email,
        role: userForm.role,
        department: userForm.department,
        departmentTh: userForm.departmentTh,
        plant: userForm.plant,
      };
      setUsers((prev) => [...prev, newUser]);
    }
    setShowUserDialog(false);
    toast.success(editingUser
      ? (language === 'th' ? 'อัพเดทผู้ใช้สำเร็จ' : 'User updated successfully')
      : (language === 'th' ? 'เพิ่มผู้ใช้สำเร็จ' : 'User added successfully')
    );
  };

  const openDeleteUser = (user: User) => {
    setDeleteTargetUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = () => {
    if (deleteTargetUser) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTargetUser.id));
      toast.success(language === 'th' ? `ลบผู้ใช้ ${deleteTargetUser.name} สำเร็จ` : `User ${deleteTargetUser.name} deleted successfully`);
    }
    setShowDeleteDialog(false);
    setDeleteTargetUser(null);
  };

  const openPasswordDialog = (user: User) => {
    setPasswordTargetUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowPasswordDialog(true);
  };

  const savePassword = () => {
    if (newPassword.length < 6) {
      toast.error(language === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(language === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match');
      return;
    }
    // TODO: Call API: PUT /api/users/:id/password
    toast.success(language === 'th' 
      ? `เปลี่ยนรหัสผ่านของ ${passwordTargetUser?.name} สำเร็จ` 
      : `Password for ${passwordTargetUser?.name} changed successfully`
    );
    setShowPasswordDialog(false);
    setPasswordTargetUser(null);
  };

  // Route template functions
  const openNewRoute = () => {
    setEditingRoute({ id: `rt-${Date.now()}`, name: '', type: 'sequential', steps: [] });
    setShowRouteDialog(true);
  };

  const openEditRoute = (rt: RouteTemplate) => {
    setEditingRoute({ ...rt, steps: [...rt.steps] });
    setShowRouteDialog(true);
  };

  const saveRoute = () => {
    if (!editingRoute) return;
    setRouteTemplates((prev) => {
      const exists = prev.find((r) => r.id === editingRoute.id);
      if (exists) return prev.map((r) => (r.id === editingRoute.id ? editingRoute : r));
      return [...prev, editingRoute];
    });
    setShowRouteDialog(false);
    toast.success(language === 'th' ? 'บันทึกเส้นทางสำเร็จ' : 'Route saved successfully');
  };

  const addRouteStep = () => {
    if (!editingRoute) return;
    setEditingRoute({
      ...editingRoute,
      steps: [
        ...editingRoute.steps,
        { approverId: '', approverName: '', order: editingRoute.steps.length + 1 },
      ],
    });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (!editingRoute) return;
    const steps = [...editingRoute.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    [steps[index], steps[targetIndex]] = [steps[targetIndex], steps[index]];
    steps.forEach((s, i) => (s.order = i + 1));
    setEditingRoute({ ...editingRoute, steps });
  };

  // toggleAccess removed — now handled by PermissionManager component

  return (
    <MainLayout>
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {language === 'th' ? 'จัดการระบบ' : 'Administration'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {language === 'th' ? 'จัดการผู้ใช้ เส้นทางอนุมัติ และสิทธิ์การเข้าถึง' : 'Manage users, approval routes, and access control'}
          </p>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" className="text-xs">
              {language === 'th' ? 'ผู้ใช้งาน' : 'Users'}
            </TabsTrigger>
            <TabsTrigger value="bulk" className="text-xs">
              {language === 'th' ? 'อัพโหลดผู้ใช้' : 'Bulk Upload'}
            </TabsTrigger>
            <TabsTrigger value="routes" className="text-xs">
              {language === 'th' ? 'เส้นทางอนุมัติ' : 'Approval Routes'}
            </TabsTrigger>
            <TabsTrigger value="access" className="text-xs">
              {language === 'th' ? 'สิทธิ์การเข้าถึง' : 'Access Control'}
            </TabsTrigger>
            <TabsTrigger value="va-settings" className="text-xs gap-1">
              <Calculator className="h-3 w-3" />
              {language === 'th' ? 'ตั้งค่า VA' : 'VA Settings'}
            </TabsTrigger>
          </TabsList>

          {/* Bulk Upload Tab */}
          <TabsContent value="bulk" className="mt-4">
            <UserBulkUpload
              onUsersImport={(newUsers) => {
                setUsers((prev) => [...prev, ...newUsers]);
              }}
              language={language}
            />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{language === 'th' ? 'รายชื่อผู้ใช้' : 'User List'}</CardTitle>
                  <Button size="sm" onClick={openNewUser} className="text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {language === 'th' ? 'เพิ่มผู้ใช้' : 'Add User'}
                  </Button>
                </div>
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder={language === 'th' ? 'ค้นหาชื่อ, อีเมล...' : 'Search name, email...'}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                    {userSearch && (
                      <button
                        onClick={() => setUserSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">{language === 'th' ? 'ทุก Role' : 'All Roles'}</SelectItem>
                      <SelectItem value="requester" className="text-xs">Requester</SelectItem>
                      <SelectItem value="approver" className="text-xs">Approver</SelectItem>
                      <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                      <SelectItem value="procurement" className="text-xs">Procurement</SelectItem>
                      <SelectItem value="va_team" className="text-xs">VA Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const filteredUsers = users.filter((user) => {
                    const searchLower = userSearch.toLowerCase();
                    const matchesSearch = !userSearch || 
                      user.name.toLowerCase().includes(searchLower) ||
                      (user.nameTh || '').toLowerCase().includes(searchLower) ||
                      user.email.toLowerCase().includes(searchLower) ||
                      user.department.toLowerCase().includes(searchLower) ||
                      (user.departmentTh || '').toLowerCase().includes(searchLower);
                    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
                    return matchesSearch && matchesRole;
                  });

                  return (
                    <>
                      {(userSearch || roleFilter !== 'all') && (
                        <p className="text-[11px] text-muted-foreground mb-2">
                          {language === 'th' 
                            ? `แสดง ${filteredUsers.length} จาก ${users.length} รายการ` 
                            : `Showing ${filteredUsers.length} of ${users.length} users`}
                        </p>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[11px]">{language === 'th' ? 'ชื่อ' : 'Name'}</TableHead>
                            <TableHead className="text-[11px]">Email</TableHead>
                            <TableHead className="text-[11px]">{language === 'th' ? 'แผนก' : 'Department'}</TableHead>
                            <TableHead className="text-[11px]">{language === 'th' ? 'บทบาท' : 'Role'}</TableHead>
                            <TableHead className="text-[11px]">{language === 'th' ? 'โรงงาน' : 'Plant'}</TableHead>
                            <TableHead className="text-[11px] text-right">{language === 'th' ? 'จัดการ' : 'Actions'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                                {language === 'th' ? 'ไม่พบผู้ใช้ที่ตรงกัน' : 'No matching users found'}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="text-xs font-medium">
                                  <div>
                                    <span>{user.name}</span>
                                    {user.nameTh && (
                                      <span className="block text-[10px] text-muted-foreground">{user.nameTh}</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                                <TableCell className="text-xs">
                                  {language === 'th' && user.departmentTh ? user.departmentTh : user.department}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="text-[10px] capitalize">{user.role}</Badge>
                                </TableCell>
                                <TableCell className="text-xs">{user.plant}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => openPasswordDialog(user)}
                                      className="h-7 w-7"
                                      title={language === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
                                    >
                                      <KeyRound className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon-sm" onClick={() => openEditUser(user)} className="h-7 w-7">
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon-sm" onClick={() => openDeleteUser(user)} className="h-7 w-7 text-destructive">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes" className="mt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{language === 'th' ? 'เทมเพลตเส้นทางอนุมัติ' : 'Route Templates'}</CardTitle>
                <Button size="sm" onClick={openNewRoute} className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {language === 'th' ? 'สร้างเส้นทาง' : 'Create Route'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {routeTemplates.map((rt) => (
                  <div key={rt.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{rt.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{rt.type}</Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {rt.steps.length} {language === 'th' ? 'ขั้นตอน' : 'steps'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        {rt.steps.map((s, i) => (
                          <span key={i} className="flex items-center text-[10px] text-muted-foreground">
                            {i > 0 && <span className="mx-1">→</span>}
                            {s.approverName}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditRoute(rt)} className="h-7 w-7">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {routeTemplates.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    {language === 'th' ? 'ยังไม่มีเทมเพลตเส้นทาง' : 'No route templates yet'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="mt-4">
            <PermissionManager users={users} language={language} />
          </TabsContent>

          {/* VA Calculate Settings Tab */}
          <TabsContent value="va-settings" className="mt-4">
            <VACalculateSettings language={language} />
          </TabsContent>
        </Tabs>

        {/* User Edit/Create Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">
                {editingUser
                  ? (language === 'th' ? 'แก้ไขผู้ใช้' : 'Edit User')
                  : (language === 'th' ? 'เพิ่มผู้ใช้ใหม่' : 'Add New User')}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name (EN) *</Label>
                  <Input className="h-8 text-xs" value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ชื่อ (TH)</Label>
                  <Input className="h-8 text-xs" value={userForm.nameTh} onChange={(e) => setUserForm((f) => ({ ...f, nameTh: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email *</Label>
                <Input className="h-8 text-xs" type="email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              {!editingUser && (
                <div className="space-y-1.5">
                  <Label className="text-xs">{language === 'th' ? 'รหัสผ่าน *' : 'Password *'}</Label>
                  <div className="relative">
                    <Input
                      className="h-8 text-xs pr-8"
                      type={showPassword ? 'text' : 'password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder={language === 'th' ? 'อย่างน้อย 6 ตัวอักษร' : 'At least 6 characters'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <Select value={userForm.role} onValueChange={(v) => setUserForm((f) => ({ ...f, role: v as UserRole }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requester">Requester</SelectItem>
                      <SelectItem value="approver">Approver</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="procurement">Procurement</SelectItem>
                      <SelectItem value="va_team">VA Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Plant</Label>
                  <Input className="h-8 text-xs" value={userForm.plant} onChange={(e) => setUserForm((f) => ({ ...f, plant: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Department (EN)</Label>
                  <Input className="h-8 text-xs" value={userForm.department} onChange={(e) => setUserForm((f) => ({ ...f, department: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">แผนก (TH)</Label>
                  <Input className="h-8 text-xs" value={userForm.departmentTh} onChange={(e) => setUserForm((f) => ({ ...f, departmentTh: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowUserDialog(false)} className="text-xs">
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button size="sm" onClick={saveUser} className="text-xs">
                <Save className="h-3.5 w-3.5 mr-1" />
                {language === 'th' ? 'บันทึก' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                {language === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">
                  {language === 'th' ? 'ผู้ใช้:' : 'User:'} <span className="font-medium text-foreground">{passwordTargetUser?.name}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">{passwordTargetUser?.email}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{language === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}</Label>
                <div className="relative">
                  <Input
                    className="h-8 text-xs pr-8"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={language === 'th' ? 'อย่างน้อย 6 ตัวอักษร' : 'At least 6 characters'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{language === 'th' ? 'ยืนยันรหัสผ่าน' : 'Confirm Password'}</Label>
                <Input
                  className="h-8 text-xs"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={language === 'th' ? 'กรอกรหัสผ่านอีกครั้ง' : 'Re-enter password'}
                />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[10px] text-destructive">
                  {language === 'th' ? '❌ รหัสผ่านไม่ตรงกัน' : '❌ Passwords do not match'}
                </p>
              )}
              {newPassword && newPassword.length < 6 && (
                <p className="text-[10px] text-destructive">
                  {language === 'th' ? '❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : '❌ Password must be at least 6 characters'}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowPasswordDialog(false)} className="text-xs">
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                onClick={savePassword}
                disabled={!newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                className="text-xs"
              >
                <KeyRound className="h-3.5 w-3.5 mr-1" />
                {language === 'th' ? 'บันทึกรหัสผ่าน' : 'Save Password'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm">
                {language === 'th' ? 'ยืนยันการลบผู้ใช้' : 'Confirm Delete User'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                {language === 'th'
                  ? `คุณต้องการลบผู้ใช้ "${deleteTargetUser?.name}" (${deleteTargetUser?.email}) ใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้`
                  : `Are you sure you want to delete "${deleteTargetUser?.name}" (${deleteTargetUser?.email})? This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs">
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteUser} className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {language === 'th' ? 'ลบผู้ใช้' : 'Delete User'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Route Edit Dialog */}
        <Dialog open={showRouteDialog} onOpenChange={setShowRouteDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm">
                {language === 'th' ? 'ออกแบบเส้นทางอนุมัติ' : 'Design Approval Route'}
              </DialogTitle>
            </DialogHeader>
            {editingRoute && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{language === 'th' ? 'ชื่อเส้นทาง' : 'Route Name'}</Label>
                  <Input
                    className="h-8 text-xs"
                    value={editingRoute.name}
                    onChange={(e) => setEditingRoute({ ...editingRoute, name: e.target.value })}
                    placeholder="e.g., Standard Procurement Route"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{language === 'th' ? 'ประเภท' : 'Type'}</Label>
                  <Select
                    value={editingRoute.type}
                    onValueChange={(v) => setEditingRoute({ ...editingRoute, type: v as ApprovalRouteType })}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">{language === 'th' ? 'ตามลำดับ' : 'Sequential'}</SelectItem>
                      <SelectItem value="parallel">{language === 'th' ? 'พร้อมกัน' : 'Parallel'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{language === 'th' ? 'ขั้นตอน' : 'Steps'}</Label>
                    <Button variant="outline" size="sm" onClick={addRouteStep} className="text-xs h-7">
                      <Plus className="h-3 w-3 mr-1" />
                      {language === 'th' ? 'เพิ่มขั้นตอน' : 'Add Step'}
                    </Button>
                  </div>
                  {editingRoute.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border">
                      <span className="text-[10px] font-bold text-muted-foreground w-5">#{idx + 1}</span>
                      <Select
                        value={step.approverId}
                        onValueChange={(v) => {
                          const user = users.find((u) => u.id === v);
                          const steps = [...editingRoute.steps];
                          steps[idx] = { ...steps[idx], approverId: v, approverName: user?.name || '' };
                          setEditingRoute({ ...editingRoute, steps });
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select approver" /></SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((u) => u.role === 'approver' || u.role === 'procurement' || u.role === 'admin')
                            .map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name} ({u.role})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={() => moveStep(idx, 'up')} disabled={idx === 0}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={() => moveStep(idx, 'down')} disabled={idx === editingRoute.steps.length - 1}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6 text-destructive"
                        onClick={() => {
                          const steps = editingRoute.steps.filter((_, i) => i !== idx);
                          steps.forEach((s, i) => (s.order = i + 1));
                          setEditingRoute({ ...editingRoute, steps });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowRouteDialog(false)} className="text-xs">
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button size="sm" onClick={saveRoute} className="text-xs">
                <Save className="h-3.5 w-3.5 mr-1" />
                {language === 'th' ? 'บันทึก' : 'Save Route'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
