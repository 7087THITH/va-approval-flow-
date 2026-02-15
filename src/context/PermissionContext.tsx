import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '@/types/workflow';

export interface Permission {
  pageKey: string;
  label: string;
  labelTh: string;
}

export const ALL_PAGES: Permission[] = [
  { pageKey: 'dashboard', label: 'Dashboard', labelTh: 'แดชบอร์ด' },
  { pageKey: 'create_proposal', label: 'Create Proposal', labelTh: 'สร้างเอกสาร' },
  { pageKey: 'batch_create', label: 'Batch Create', labelTh: 'สร้างหลายฉบับ' },
  { pageKey: 'view_proposals', label: 'View All Proposals', labelTh: 'ดูเอกสารทั้งหมด' },
  { pageKey: 'approve', label: 'Approve/Reject', labelTh: 'อนุมัติ/ปฏิเสธ' },
  { pageKey: 'admin', label: 'Administration', labelTh: 'จัดการระบบ' },
  { pageKey: 'export', label: 'Export PDF/Excel', labelTh: 'ส่งออก PDF/Excel' },
  { pageKey: 'reports', label: 'Reports & VA Calculate', labelTh: 'รายงาน & VA Calculate' },
  { pageKey: 'projects', label: 'Project Management', labelTh: 'จัดการโปรเจค' },
  { pageKey: 'history', label: 'History', labelTh: 'ประวัติเอกสาร' },
];

export const DEFAULT_ROLE_ACCESS: Record<UserRole, string[]> = {
  requester: ['dashboard', 'create_proposal', 'batch_create', 'view_proposals', 'export', 'history'],
  approver: ['dashboard', 'view_proposals', 'approve', 'export', 'history'],
  admin: ['dashboard', 'create_proposal', 'batch_create', 'view_proposals', 'approve', 'admin', 'export', 'reports', 'projects', 'history'],
  procurement: ['dashboard', 'view_proposals', 'approve', 'export', 'reports', 'history'],
  va_team: ['dashboard', 'view_proposals', 'approve', 'export', 'history'],
};

interface PermissionContextType {
  roleAccess: Record<UserRole, string[]>;
  setRoleAccess: React.Dispatch<React.SetStateAction<Record<UserRole, string[]>>>;
  userOverrides: Record<string, string[]>; // userId -> pages
  setUserOverrides: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  hasAccess: (userId: string, userRole: UserRole, pageKey: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [roleAccess, setRoleAccess] = useState<Record<UserRole, string[]>>(DEFAULT_ROLE_ACCESS);
  const [userOverrides, setUserOverrides] = useState<Record<string, string[]>>({});

  const hasAccess = (userId: string, userRole: UserRole, pageKey: string): boolean => {
    // User-level override takes priority
    if (userOverrides[userId]) {
      return userOverrides[userId].includes(pageKey);
    }
    // Otherwise check role-level
    return roleAccess[userRole]?.includes(pageKey) ?? false;
  };

  return (
    <PermissionContext.Provider value={{ roleAccess, setRoleAccess, userOverrides, setUserOverrides, hasAccess }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) throw new Error('usePermissions must be used within PermissionProvider');
  return context;
}
