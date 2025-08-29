import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  hideNavbar: boolean;
  setHideNavbar: (hide: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [hideNavbar, setHideNavbar] = useState(false);

  return (
    <UIContext.Provider value={{ hideNavbar, setHideNavbar }}>
      {children}
    </UIContext.Provider>
  );
};
