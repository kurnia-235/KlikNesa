import { createContext, useContext, useState, ReactNode } from 'react';

export type UserMode = 'buyer' | 'seller';

interface UserModeContextType {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined);

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UserMode>(() => {
    try {
      return (localStorage.getItem('klk-user-mode') as UserMode) ?? 'buyer';
    } catch {
      return 'buyer';
    }
  });

  const setMode = (newMode: UserMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('klk-user-mode', newMode);
    } catch { /* ignore */ }
  };

  return (
    <UserModeContext.Provider value={{ mode, setMode }}>
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode() {
  const ctx = useContext(UserModeContext);
  if (!ctx) throw new Error('useUserMode must be used within UserModeProvider');
  return ctx;
}
