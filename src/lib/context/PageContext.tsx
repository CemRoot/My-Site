import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface PageContextInfo {
  path: string;
  title: string;
  summary: string;
  highlights?: string[];
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
