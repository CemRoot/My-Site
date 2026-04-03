/**
 * Persist tech news list scroll position and loaded page so returning from
 * an article can restore the list without jumping to the top.
 */

export const TECH_NEWS_SCROLL_STORAGE_KEY = 'tech-news-scroll-restore';
export const TECH_NEWS_RESTORE_NAV_FLAG = 'tech-news-restore-nav';

export type TechNewsListScrollPayload = {
  scrollY: number;
  category: string;
  page: number;
};

export function readTechNewsListScroll(): TechNewsListScrollPayload | null {
  try {
    const raw = sessionStorage.getItem(TECH_NEWS_SCROLL_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<TechNewsListScrollPayload>;
    if (
      typeof p.scrollY !== 'number' ||
      typeof p.category !== 'string' ||
      typeof p.page !== 'number'
    ) {
      return null;
    }
    return { scrollY: p.scrollY, category: p.category, page: p.page };
  } catch {
    return null;
  }
}

export function writeTechNewsListScroll(payload: TechNewsListScrollPayload): void {
  try {
    sessionStorage.setItem(TECH_NEWS_SCROLL_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function isTechNewsRestoreNavActive(): boolean {
  try {
    return sessionStorage.getItem(TECH_NEWS_RESTORE_NAV_FLAG) === '1';
  } catch {
    return false;
  }
}

export function setTechNewsRestoreNavFlag(): void {
  try {
    sessionStorage.setItem(TECH_NEWS_RESTORE_NAV_FLAG, '1');
  } catch {
    // ignore
  }
}

export function clearTechNewsRestoreNavFlag(): void {
  try {
    sessionStorage.removeItem(TECH_NEWS_RESTORE_NAV_FLAG);
  } catch {
    // ignore
  }
}
