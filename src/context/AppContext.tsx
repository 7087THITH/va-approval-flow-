import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Language, labels, LabelKey, VAProposal } from '@/types/workflow';

// Production mode — all users and proposals come from the backend API

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

  // Display preferences
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: string;
  setFontFamily: (family: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  };
  const [proposals, setProposals] = useState<VAProposal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fontSize, setFontSizeState] = useState<number>(() => {
    try { return Number(localStorage.getItem('app-font-size')) || 16; } catch { return 16; }
  });
  const [fontFamily, setFontFamilyState] = useState<string>(() => {
    try { return localStorage.getItem('app-font-family') || 'Inter'; } catch { return 'Inter'; }
  });
  const [docCounter, setDocCounter] = useState(1);

  // Apply font size & family to html element
  React.useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem('app-font-size', String(fontSize));
  }, [fontSize]);

  React.useEffect(() => {
    document.documentElement.style.fontFamily = fontFamily === 'Inter'
      ? "'Inter', 'Noto Sans Thai', system-ui, sans-serif"
      : fontFamily === 'Sarabun'
      ? "'Sarabun', 'Inter', system-ui, sans-serif"
      : fontFamily === 'Kanit'
      ? "'Kanit', 'Inter', system-ui, sans-serif"
      : `'${fontFamily}', system-ui, sans-serif`;
    localStorage.setItem('app-font-family', fontFamily);
  }, [fontFamily]);

  const setFontSize = (size: number) => setFontSizeState(Math.max(12, Math.min(22, size)));
  const setFontFamily = (family: string) => setFontFamilyState(family);

  const t = (key: LabelKey): string => {
    return labels[language][key] || key;
  };

  const generateProposalNo = (): string => {
    const year = new Date().getFullYear();
    const nextNum = docCounter;
    setDocCounter((c) => c + 1);
    return `VA-${year}-${String(nextNum).padStart(3, '0')}`;
  };

  const login = (email: string, password: string): boolean => {
    // Production: authentication is handled by the backend API
    // This local login is kept as fallback for users already in the local user list
    const user = users.find(u => u.email === email);
    if (user) {
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
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
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
