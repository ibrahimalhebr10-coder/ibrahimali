import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  demoType: 'green' | 'golden' | null;
  enterDemoMode: (type: 'green' | 'golden') => void;
  exitDemoMode: () => void;
  showDemoWelcome: boolean;
  setShowDemoWelcome: (show: boolean) => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoType, setDemoType] = useState<'green' | 'golden' | null>(null);
  const [showDemoWelcome, setShowDemoWelcome] = useState(false);

  const enterDemoMode = (type: 'green' | 'golden') => {
    setIsDemoMode(true);
    setDemoType(type);
    setShowDemoWelcome(true);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setDemoType(null);
    setShowDemoWelcome(false);
  };

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        demoType,
        enterDemoMode,
        exitDemoMode,
        showDemoWelcome,
        setShowDemoWelcome,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
