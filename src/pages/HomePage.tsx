import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { MainLayout } from '@/components/layout/MainLayout';
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
  Users,
  Network,
} from 'lucide-react';

/* ── Department data ─────────────────────────────────── */

interface DeptNode {
  name: string;
  id: string;
  highlight?: boolean;
  feature?: string;
  children?: DeptNode[];
}

const orgTree: DeptNode[] = [
  { id: 'nmsg', name: 'New Model Sub-Group' },
  { id: 'pp1g', name: 'Parts Procurement 1 Group' },
  { id: 'pp2g', name: 'Parts Procurement 2 Group' },
  { id: 'pp3g', name: 'Parts Procurement 3 Group' },
  {
    id: 'psg',
    name: 'Procurement Strategy Group',
    highlight: true,
    feature: 'VA Proposal Workflow',
  },
  {
    id: 'spcg',
    name: 'Sustainable Procurement Control Group',
    children: [
      { id: 'pcsg', name: 'Procurement Collaboration Sub-Group' },
      { id: 'spc1', name: 'Sustainable Procurement Control 1 Sub-Group' },
      { id: 'spc2', name: 'Sustainable Procurement Control 2 Group' },
    ],
  },
];

const quickActions = [
  {
    icon: FileCheck,
    label: 'VA Proposal',
    labelTh: 'สร้าง VA Proposal',
    desc: 'Create & manage proposals',
    path: '/proposal/new',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BarChart3,
    label: 'VA Calculate',
    labelTh: 'รายงาน VA Calculate',
    desc: 'Reports & cost-down tracking',
    path: '/va-calculate',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Layers,
    label: 'Projects',
    labelTh: 'จัดการโปรเจค',
    desc: 'Project management',
    path: '/projects',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Shield,
    label: 'Admin',
    labelTh: 'จัดการระบบ',
    desc: 'Settings & users',
    path: '/admin',
    gradient: 'from-orange-500 to-amber-500',
  },
];

/* ── Motion variants ─────────────────────────────────── */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

/* ── Org-branch recursive component ──────────────────── */

function OrgBranch({ node, index = 0, onNavigate }: { node: DeptNode; index?: number; onNavigate: (id: string, name: string) => void }) {
  return (
    <motion.div
      variants={item}
      className="group"
    >
      <button
        type="button"
        onClick={() => onNavigate(node.id, node.name)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
          node.highlight
            ? 'bg-gradient-to-r from-primary-light to-info-light border border-info-border shadow-sm hover:shadow-md'
            : 'hover:bg-muted/60'
        }`}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card ${
            node.highlight
              ? 'bg-info ring-info/40'
              : 'bg-border ring-border/40 group-hover:bg-muted-foreground group-hover:ring-muted-foreground/30'
          }`}
        />
        <span
          className={`text-sm text-left ${
            node.highlight ? 'font-semibold text-foreground' : 'text-foreground/80'
          }`}
        >
          {node.name}
        </span>
        {node.feature && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-info bg-info-light px-2.5 py-1 rounded-full border border-info-border">
            <Sparkles className="w-3 h-3" />
            {node.feature}
          </span>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>

      {node.children && node.children.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="ml-7 mt-1 border-l-2 border-border/50 pl-4 space-y-1"
        >
          {node.children.map((child, i) => (
            <OrgBranch key={child.id} node={child} index={i} onNavigate={onNavigate} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────────────── */

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const handleDeptNavigate = (deptId: string, deptName: string) => {
    navigate(`/dashboard?dept=${deptId}&deptName=${encodeURIComponent(deptName)}`);
  };

  return (
    <MainLayout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto space-y-8"
      >
        {/* ── Hero Section ── */}
        <motion.section
          variants={scaleIn}
          className="relative overflow-hidden rounded-2xl bg-gradient-hero p-8 md:p-10 text-white"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
          </div>
          <div className="relative z-10">
            <motion.p variants={item} className="text-white/60 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Parts Procurement Division
            </motion.p>
            <motion.h1 variants={item} className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-white">
              VA Proposal Workflow
            </motion.h1>
            <motion.p variants={item} className="text-white/75 text-sm md:text-base max-w-lg leading-relaxed">
              ระบบบริหารจัดการ VA Proposal สำหรับ Procurement Strategy Group
              <br />
              <span className="text-white/50 text-xs">
                Value Analysis &amp; Cost Down Management System
              </span>
            </motion.p>
            <motion.button
              variants={item}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/dashboard')}
              className="mt-6 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-medium px-5 py-2.5 rounded-xl transition-colors border border-white/20"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.section>

        {/* ── Quick Actions Toolbar ── */}
        <motion.section variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.path}
              variants={item}
              whileHover={{ y: -4, boxShadow: '0 8px 24px -8px hsl(0 0% 0% / 0.12)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(action.path)}
              className="glass rounded-xl p-4 text-left border border-border/50 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3`}
              >
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-semibold text-sm text-foreground">{action.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-thai">
                {action.labelTh}
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">{action.desc}</p>
            </motion.button>
          ))}
        </motion.section>

        {/* ── Organization Structure ── */}
        <motion.section
          variants={scaleIn}
          className="glass rounded-2xl border border-border/50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-foreground">
                Parts Procurement Division
              </h2>
              <p className="text-xs text-muted-foreground">
                Organization Structure • โครงสร้างแผนก
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
              <Network className="w-3.5 h-3.5" />
              <span>{orgTree.length} Groups</span>
            </div>
          </div>

          {/* Tree */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="p-4 space-y-1"
          >
            {orgTree.map((node, i) => (
              <OrgBranch key={node.id} node={node} index={i} onNavigate={handleDeptNavigate} />
            ))}
          </motion.div>
        </motion.section>

        {/* ── Footer ── */}
        <motion.div
          variants={item}
          className="text-center text-xs text-muted-foreground pb-4"
        >
          Supply Chain Management Function • Parts Procurement Division
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
