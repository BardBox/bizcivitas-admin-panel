import React, { createContext, useState, useContext } from "react";

interface VisibilityContextType {
  isSidebarAndHeaderVisible: boolean;
  setSidebarAndHeaderVisibility: (visible: boolean) => void;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export const VisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarAndHeaderVisible, setIsSidebarAndHeaderVisible] = useState(true);

  const setSidebarAndHeaderVisibility = (visible: boolean) => {
    setIsSidebarAndHeaderVisible(visible);
  };

  return (
    <VisibilityContext.Provider value={{ isSidebarAndHeaderVisible, setSidebarAndHeaderVisibility }}>
      {children}
    </VisibilityContext.Provider>
  );
};

export const useVisibility = () => {
  const context = useContext(VisibilityContext);
  if (!context) {
    throw new Error("useVisibility must be used within a VisibilityProvider");
  }
  return context;
};