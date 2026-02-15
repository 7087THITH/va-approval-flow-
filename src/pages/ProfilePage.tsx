import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Camera,
  Save,
  User,
  Mail,
  Building2,
  Shield,
  Eye,
  EyeOff,
  KeyRound,
  Bell,
  Palette,
  Globe,
  CheckCircle2,
  Type,
  ALargeSmall,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { currentUser, setCurrentUser, language, setLanguage, users, setUsers, fontSize, setFontSize, fontFamily, setFontFamily } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    nameTh: currentUser?.nameTh || '',
    email: currentUser?.email || '',
    department: currentUser?.department || '',
    departmentTh: currentUser?.departmentTh || '',
    plant: currentUser?.plant || '',
    position: currentUser?.position || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    approvalAlerts: true,
    statusUpdates: true,
    weeklyDigest: false,
  });

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === 'th' ? 'ขนาดไฟล์ต้องไม่เกิน 2MB' : 'File size must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const avatarUrl = reader.result as string;
      if (currentUser) {
        const updated = { ...currentUser, avatar: avatarUrl };
        setCurrentUser(updated);
        setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
        toast.success(language === 'th' ? 'เปลี่ยนรูปโปรไฟล์สำเร็จ' : 'Profile picture updated');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast.error(language === 'th' ? 'กรุณากรอกชื่อและอีเมล' : 'Name and email are required');
      return;
    }
    if (currentUser) {
      const updated = {
        ...currentUser,
        name: profileForm.name,
        nameTh: profileForm.nameTh,
        email: profileForm.email,
        department: profileForm.department,
        departmentTh: profileForm.departmentTh,
        plant: profileForm.plant,
        position: profileForm.position,
      };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
      toast.success(language === 'th' ? 'บันทึกข้อมูลสำเร็จ' : 'Profile saved successfully');
    }
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword.length < 6) {
      toast.error(language === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(language === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match');
      return;
    }
    toast.success(language === 'th' ? 'เปลี่ยนรหัสผ่านสำเร็จ' : 'Password changed successfully');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  if (!currentUser) return null;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {language === 'th' ? 'โปรไฟล์ของฉัน' : 'My Profile'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === 'th' ? 'จัดการข้อมูลส่วนตัวและการตั้งค่า' : 'Manage your personal information and preferences'}
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <Camera className="h-6 w-6 text-background" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {/* Basic Info */}
              <div className="flex-1 space-y-1">
                <h2 className="text-lg font-semibold text-foreground">{currentUser.name}</h2>
                {currentUser.nameTh && (
                  <p className="text-sm text-muted-foreground">{currentUser.nameTh}</p>
                )}
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="secondary" className="text-xs capitalize">
                    <Shield className="h-3 w-3 mr-1" />
                    {currentUser.role}
                  </Badge>
                  {currentUser.position && (
                    <Badge variant="outline" className="text-xs">{currentUser.position}</Badge>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5 mr-1" />
                {language === 'th' ? 'เปลี่ยนรูป' : 'Change Photo'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              {language === 'th' ? 'ข้อมูลส่วนตัว' : 'Personal Information'}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === 'th' ? 'แก้ไขข้อมูลส่วนตัวของคุณ' : 'Update your personal details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name (EN) *</Label>
                <Input
                  className="h-9 text-sm"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ชื่อ (TH)</Label>
                <Input
                  className="h-9 text-sm"
                  value={profileForm.nameTh}
                  onChange={(e) => setProfileForm((f) => ({ ...f, nameTh: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email *
                </Label>
                <Input
                  className="h-9 text-sm"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Position</Label>
                <Input
                  className="h-9 text-sm"
                  value={profileForm.position}
                  onChange={(e) => setProfileForm((f) => ({ ...f, position: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Department (EN)
                </Label>
                <Input
                  className="h-9 text-sm"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm((f) => ({ ...f, department: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">แผนก (TH)</Label>
                <Input
                  className="h-9 text-sm"
                  value={profileForm.departmentTh}
                  onChange={(e) => setProfileForm((f) => ({ ...f, departmentTh: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Plant</Label>
                <Input
                  className="h-9 text-sm"
                  value={profileForm.plant}
                  onChange={(e) => setProfileForm((f) => ({ ...f, plant: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Role
                </Label>
                <Input
                  className="h-9 text-sm bg-muted"
                  value={currentUser.role}
                  disabled
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveProfile} className="text-xs">
                <Save className="h-3.5 w-3.5 mr-1" />
                {language === 'th' ? 'บันทึกข้อมูล' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              {language === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{language === 'th' ? 'รหัสผ่านปัจจุบัน' : 'Current Password'}</Label>
                <div className="relative">
                  <Input
                    className="h-9 text-sm pr-9"
                    type={showPasswords ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{language === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}</Label>
                <Input
                  className="h-9 text-sm"
                  type={showPasswords ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{language === 'th' ? 'ยืนยันรหัสผ่าน' : 'Confirm Password'}</Label>
                <Input
                  className="h-9 text-sm"
                  type={showPasswords ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="text-xs text-destructive">
                {language === 'th' ? '❌ รหัสผ่านไม่ตรงกัน' : '❌ Passwords do not match'}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleChangePassword}
                disabled={!passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                className="text-xs"
              >
                <KeyRound className="h-3.5 w-3.5 mr-1" />
                {language === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {language === 'th' ? 'การตั้งค่า' : 'Preferences'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{language === 'th' ? 'ภาษา' : 'Language'}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'th' ? 'เลือกภาษาที่ต้องการ' : 'Choose your preferred language'}
                  </p>
                </div>
              </div>
              <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'th')}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="th">🇹🇭 ภาษาไทย</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Font Size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ALargeSmall className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{language === 'th' ? 'ขนาดตัวอักษร' : 'Font Size'}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'th' ? `ปัจจุบัน: ${fontSize}px` : `Current: ${fontSize}px`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-[200px]">
                <span className="text-xs text-muted-foreground">A</span>
                <Slider
                  value={[fontSize]}
                  onValueChange={([v]) => setFontSize(v)}
                  min={12}
                  max={22}
                  step={1}
                  className="flex-1"
                />
                <span className="text-base font-bold text-muted-foreground">A</span>
              </div>
            </div>

            <Separator />

            {/* Font Family */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{language === 'th' ? 'รูปแบบตัวอักษร' : 'Font Family'}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'th' ? 'เลือกฟอนต์ที่ต้องการ' : 'Choose your preferred font'}
                  </p>
                </div>
              </div>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Default)</SelectItem>
                  <SelectItem value="Sarabun">Sarabun</SelectItem>
                  <SelectItem value="Kanit">Kanit</SelectItem>
                  <SelectItem value="Noto Sans Thai">Noto Sans Thai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">{language === 'th' ? 'การแจ้งเตือน' : 'Notifications'}</p>
              </div>
              {[
                { key: 'emailNotifications' as const, label: 'Email Notifications', labelTh: 'แจ้งเตือนทางอีเมล' },
                { key: 'approvalAlerts' as const, label: 'Approval Alerts', labelTh: 'แจ้งเตือนการอนุมัติ' },
                { key: 'statusUpdates' as const, label: 'Status Updates', labelTh: 'อัพเดทสถานะ' },
                { key: 'weeklyDigest' as const, label: 'Weekly Digest', labelTh: 'สรุปรายสัปดาห์' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1">
                  <p className="text-sm text-muted-foreground">
                    {language === 'th' ? item.labelTh : item.label}
                  </p>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(v) => setNotifications((n) => ({ ...n, [item.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
