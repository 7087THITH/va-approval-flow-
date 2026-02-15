import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { motion } from 'framer-motion';
import {
  Building2,
  ChevronRight,
  FileCheck,
  BarChart3,
  Layers,
  Shield,
  Sparkles,
  ArrowRight,
  Network,
  UserCircle,
  LogOut,
  LogIn,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

/* ── Department data (flat list for grid) ──────────── */

interface DeptItem {
  name: string;
  nameTh: string;
  id: string;
  abbr: string;
  highlight?: boolean;
  feature?: string;
}

const departments: DeptItem[] = [
  { id: 'nmsg', name: 'New Model Sub-Group', nameTh: 'กลุ่มโมเดลใหม่', abbr: 'NM' },
  { id: 'pp1g', name: 'Parts Procurement 1', nameTh: 'จัดซื้อชิ้นส่วน 1', abbr: 'P1' },
  { id: 'pp2g', name: 'Parts Procurement 2', nameTh: 'จัดซื้อชิ้นส่วน 2', abbr: 'P2' },
  { id: 'pp3g', name: 'Parts Procurement 3', nameTh: 'จัดซื้อชิ้นส่วน 3', abbr: 'P3' },
  { id: 'psg', name: 'Procurement Strategy', nameTh: 'กลยุทธ์จัดซื้อ', abbr: 'PS', highlight: true, feature: 'VA Workflow' },
  { id: 'spcg', name: 'Sustainable Procurement Control', nameTh: 'ควบคุมจัดซื้อยั่งยืน', abbr: 'SP' },
  { id: 'pcsg', name: 'Procurement Collaboration', nameTh: 'ความร่วมมือจัดซื้อ', abbr: 'PC' },
  { id: 'spc1', name: 'Sustainable Procurement 1', nameTh: 'จัดซื้อยั่งยืน 1', abbr: 'S1' },
  { id: 'spc2', name: 'Sustainable Procurement 2', nameTh: 'จัดซื้อยั่งยืน 2', abbr: 'S2' },
];

const quickActions = [
  { icon: FileCheck, label: 'VA Proposal', labelTh: 'สร้าง VA Proposal', desc: 'Create & manage proposals', path: '/proposal/new', gradient: 'from-blue-500 to-cyan-400' },
  { icon: BarChart3, label: 'VA Calculate', labelTh: 'รายงาน VA Calculate', desc: 'Reports & cost-down', path: '/va-calculate', gradient: 'from-emerald-500 to-teal-400' },
  { icon: Layers, label: 'Projects', labelTh: 'จัดการโปรเจค', desc: 'Project management', path: '/projects', gradient: 'from-violet-500 to-purple-400' },
  { icon: Shield, label: 'Admin', labelTh: 'จัดการระบบ', desc: 'Settings & users', path: '/admin', gradient: 'from-orange-500 to-amber-400' },
];

/* ── Motion variants ─────────────────────────────────── */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 28 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 22 } },
};

/* ── Department Card ─────────────────────────────────── */


const DeptCard = React.forwardRef<HTMLButtonElement, { dept: DeptItem; onNavigate: (id: string, name: string) => void }>(
  ({ dept, onNavigate }, ref) => {
    return (
      <motion.button
        ref={ref}
        variants={item}
        whileHover={{ y: -1, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate(dept.id, dept.name)}
        className={cn(
          'group relative w-full text-left rounded-lg border-0 transition-all duration-150 px-3 py-2.5 flex items-center gap-2.5',
          dept.highlight
            ? 'bg-sky-500/10 dark:bg-sky-500/8 hover:bg-sky-500/15'
            : 'bg-muted/40 dark:bg-muted/30 hover:bg-muted/60 dark:hover:bg-muted/50'
        )}
      >
        <div
          className={cn(
            'w-8 h-8 rounded flex items-center justify-center shrink-0 text-[11px] font-bold tracking-wider',
            dept.highlight
              ? 'bg-gradient-to-br from-info to-primary text-white shadow-sm'
              : 'bg-muted/70 text-muted-foreground group-hover:bg-foreground/8 group-hover:text-foreground'
          )}
        >
          {dept.abbr}
        </div>
        <div className="flex-1 min-w-0">
          <span className={cn(
            'text-[13px] block truncate leading-snug',
            dept.highlight ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
          )}>
            {dept.name}
          </span>
          <span className="text-[10px] text-muted-foreground/70 block truncate font-thai">
            {dept.nameTh}
          </span>
          {dept.feature && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-info mt-0.5 bg-info/8 px-1.5 py-0.5 rounded">
              <Sparkles className="w-2.5 h-2.5" />
              {dept.feature}
            </span>
          )}
        </div>
        <ChevronRight className={cn(
          'w-3.5 h-3.5 shrink-0 transition-all duration-150 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0',
          dept.highlight && 'text-info'
        )} />
      </motion.button>
    );
  }
);
DeptCard.displayName = 'DeptCard';

/* ── Main page ───────────────────────────────────────── */

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser, language, setLanguage, logout, isAuthenticated } = useApp();

  const handleDeptNavigate = (deptId: string, deptName: string) => {
    navigate(`/dashboard?dept=${deptId}&deptName=${encodeURIComponent(deptName)}`);
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-5 md:p-6">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-end gap-1.5 mb-5">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('en')}><span className="mr-2">🇺🇸</span> English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('th')}><span className="mr-2">🇹🇭</span> ภาษาไทย</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 h-8">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-bold">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-medium hidden sm:inline">{currentUser?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <UserCircle className="mr-2 h-4 w-4" />
                {language === 'th' ? 'โปรไฟล์' : 'My Profile'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {language === 'th' ? 'ออกจากระบบ' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" onClick={() => navigate('/login')} className="gap-1.5 h-8 text-[13px]">
            <LogIn className="h-3.5 w-3.5" />
            {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
          </Button>
        )}
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {/* ── Hero Section ── */}
        <motion.section
          variants={scaleIn}
          className="relative overflow-hidden globe-hero rounded-lg px-6 py-6 md:px-8 md:py-7"
        >
          {/* Stars background */}
          <div className="stars" />
          {/* Globe */}
          <div className="globe">
            <div className="globe-grid" />
            <div className="globe-meridian" />
            <div className="globe-meridian-2" />
          </div>
          {/* Airplanes orbiting the globe */}
          <div className="airplane-container">
            <div className="plane p1" />
            <div className="plane p2" />
            <div className="plane p3" />
            <div className="plane p4" />
            <div className="plane p5" />
            <div className="plane p6" />
          </div>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent dark:from-black/30 pointer-events-none" />

          <div className="relative z-10">
            <motion.div variants={item} className="inline-flex items-center gap-1.5 text-sky-300/70 text-[10px] font-semibold uppercase tracking-[0.25em] mb-3 bg-sky-400/[0.08] backdrop-blur-sm px-2.5 py-1 rounded">
              <Building2 className="w-3 h-3" />
              Supply Chain Management Function
            </motion.div>
            <motion.h1 variants={item} className="text-xl md:text-2xl font-bold mb-0.5 tracking-tight text-white">
              Supply Chain Management
            </motion.h1>
            <motion.h2 variants={item} className="text-sm md:text-base font-medium text-sky-200/70 mb-3">
              Parts Procurement Division
            </motion.h2>
            <motion.p variants={item} className="text-slate-300/60 text-[13px] max-w-md leading-relaxed font-thai">
              ระบบบริหารจัดการ สำหรับ Parts Procurement Division
            </motion.p>
            <motion.button
              variants={item}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard')}
              className="mt-4 inline-flex items-center gap-2 bg-sky-500/15 hover:bg-sky-500/25 backdrop-blur-xl text-sky-200 hover:text-white font-medium px-4 py-2 rounded-md transition-all duration-150 border border-sky-400/15 hover:border-sky-400/30 text-[13px]"
            >
              Go to Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </motion.section>

        {/* ── Quick Actions ── */}
        <motion.section variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {quickActions.map((action) => (
            <motion.button
              key={action.path}
              variants={item}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className="rounded-lg bg-card/60 backdrop-blur-md border-0 hover:bg-card/80 p-3.5 text-left transition-all duration-200 shadow-sm dark:hover:shadow-[0_0_20px_-4px_hsl(var(--info)/0.25)] hover:shadow-md"
            >
              <div className={`w-8 h-8 rounded flex items-center justify-center mb-2 bg-gradient-to-br ${action.gradient}`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <p className="font-semibold text-[13px] text-foreground leading-tight">{action.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-thai leading-tight">{action.labelTh}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">{action.desc}</p>
            </motion.button>
          ))}
        </motion.section>

        {/* ── Organization Structure — 3-col grid ── */}
        <motion.section
          variants={scaleIn}
          className="rounded-lg bg-card/40 dark:bg-card/60 backdrop-blur-md overflow-hidden border-0"
        >
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/10">
            <div className="w-7 h-7 bg-gradient-hero rounded flex items-center justify-center">
              <Network className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-[13px] font-bold text-foreground leading-tight">Organization Structure</h2>
              <p className="text-[10px] text-muted-foreground/70 font-thai">โครงสร้างแผนก • Parts Procurement Division</p>
            </div>
            <span className="text-[10px] text-muted-foreground/50 bg-muted/30 px-2 py-0.5 rounded font-medium">
              {departments.length} groups
            </span>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="p-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5"
          >
            {departments.map((dept) => (
              <DeptCard key={dept.id} dept={dept} onNavigate={handleDeptNavigate} />
            ))}
          </motion.div>
        </motion.section>

        {/* ── Footer ── */}
        <motion.div variants={item} className="text-center text-[10px] text-muted-foreground/40 pb-3 tracking-wide">
          © 2026 Supply Chain Management Function • Parts Procurement Division
        </motion.div>
      </motion.div>
    </div>
  );
}
