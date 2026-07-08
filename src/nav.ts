import { createContext, useContext } from "react";

/** 全站頁面代號 */
export type PageId =
  | "roadmap"
  | "chords"
  | "scales"
  | "fingering"
  | "fretmap"
  | "diatonic"
  | "circle"
  | "songs"
  | "practice";

export interface NavState {
  /** 跳到指定頁面；跳到 practice 時可帶單元 id 直接開始該單元 */
  navigate: (page: PageId, unitId?: string) => void;
  /** 深連結目標：練習頁讀到後自動開始該單元，再呼叫 consume 清掉 */
  pendingUnitId: string | null;
  consumePendingUnit: () => void;
}

export const NavContext = createContext<NavState | null>(null);

export function useNav(): NavState {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav 必須在 NavContext 內使用");
  return ctx;
}
