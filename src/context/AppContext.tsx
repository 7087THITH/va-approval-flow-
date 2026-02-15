import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Language, labels, LabelKey, VAProposal } from '@/types/workflow';

// No demo data — all users and proposals come from the backend API
// When USE_API = true in src/lib/api.ts, data is fetched from the server
// For local development, add users via the Admin > Bulk Upload page

interface AppContextType {
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: LabelKey) => string;
  
  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  
  // Proposals
  proposals: VAProposal[];
  setProposals: React.Dispatch<React.SetStateAction<VAProposal[]>>;
  generateProposalNo: () => string;

  // Users (admin management)
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [proposals, setProposals] = useState<VAProposal[]>([]);
  const [users, setUsers] = useState<User[]>([
    {
      id: 'user-admin-thitichot',
      email: 'thitichot@dit.daikin.co.jp',
      name: 'Thitichot',
      role: 'admin',
      department: 'PROCUREMENT STRATEGY SUB-GROUP',
      plant: '',
      position: 'EN',
    },
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [docCounter, setDocCounter] = useState(1);

  const t = (key: LabelKey): string => {
    return labels[language][key] || key;
  };

  const generateProposalNo = (): string => {
    const year = new Date().getFullYear();
    const nextNum = docCounter;
    setDocCounter((c) => c + 1);
    return `VA-${year}-${String(nextNum).padStart(3, '0')}`;
  };

  // Hardcoded credentials for testing (remove when backend is deployed)
  const testCredentials: Record<string, string> = {
    'thitichot@dit.daikin.co.jp': '075727',
  };

  const login = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email);
    if (user) {
      const expectedPass = testCredentials[email];
      if (expectedPass && password !== expectedPass) return false;
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentUser,
        setCurrentUser,
        isAuthenticated: currentUser !== null,
        login,
        logout,
        proposals,
        setProposals,
        generateProposalNo,
        users,
        setUsers,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
