import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface PageContextInfo {
  path: string;
  title: string;
  summary: string;
  description?: string; // Additional description for more context
  highlights?: string[]; // Key highlights or bullet points
  features?: string[]; // Key features (for project/service pages)
  technologies?: string[]; // Technologies used (for project pages)
  content?: string; // Main content or detailed information
  lastUpdated?: string;
}

interface PageContextValue {
  pageInfo: PageContextInfo | null;
  setPageInfo: (info: PageContextInfo | null) => void;
}

const PageContext = createContext<PageContextValue | undefined>(undefined);

export function PageContextProvider({ children }: { children: ReactNode }) {
  const [pageInfo, setPageInfoState] = useState<PageContextInfo | null>(null);

  const setPageInfo = useCallback((info: PageContextInfo | null) => {
    setPageInfoState(info);
  }, []);

  const value = useMemo(
    () => ({
      pageInfo,
      setPageInfo,
    }),
    [pageInfo, setPageInfo],
  );

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
}

export function usePageContext() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePageContext must be used within a PageContextProvider');
  }
  return context;
}
