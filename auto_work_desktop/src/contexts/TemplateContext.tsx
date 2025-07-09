import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TemplateContextType {
  // 默认模板 IDs
  defaultFileTemplateId: number | null;
  defaultDataTemplateId: number | null;
  defaultParamTemplateId: number | null;
  
  // 设置默认模板
  setDefaultFileTemplateId: (id: number) => void;
  setDefaultDataTemplateId: (id: number) => void;
  setDefaultParamTemplateId: (id: number) => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const useTemplateContext = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplateContext must be used within a TemplateProvider');
  }
  return context;
};

interface TemplateProviderProps {
  children: ReactNode;
}

export const TemplateProvider: React.FC<TemplateProviderProps> = ({ children }) => {
  const [defaultFileTemplateId, setDefaultFileTemplateId] = useState<number | null>(null);
  const [defaultDataTemplateId, setDefaultDataTemplateId] = useState<number | null>(null);
  const [defaultParamTemplateId, setDefaultParamTemplateId] = useState<number | null>(null);

  const value: TemplateContextType = {
    defaultFileTemplateId,
    defaultDataTemplateId,
    defaultParamTemplateId,
    setDefaultFileTemplateId,
    setDefaultDataTemplateId,
    setDefaultParamTemplateId,
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
};