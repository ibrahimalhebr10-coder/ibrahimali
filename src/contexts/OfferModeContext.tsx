import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OfferModeContextType {
  isOfferMode: boolean;
  enterOfferMode: () => void;
  exitOfferMode: () => void;
}

const OfferModeContext = createContext<OfferModeContextType | undefined>(undefined);

export function OfferModeProvider({ children }: { children: ReactNode }) {
  const [isOfferMode, setIsOfferMode] = useState(false);

  const enterOfferMode = () => {
    setIsOfferMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exitOfferMode = () => {
    setIsOfferMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <OfferModeContext.Provider value={{ isOfferMode, enterOfferMode, exitOfferMode }}>
      {children}
    </OfferModeContext.Provider>
  );
}

export function useOfferMode() {
  const context = useContext(OfferModeContext);
  if (context === undefined) {
    throw new Error('useOfferMode must be used within an OfferModeProvider');
  }
  return context;
}
