import { MASTERY_RATIO } from "./practice";

/**
 * 練習進度：存在瀏覽器 localStorage，練習頁與學習路線頁共用。
 * 只記每個單元的最佳成績與挑戰次數，不上傳任何伺服器。
 */

export const STORAGE_KEY = "guitar-theory-practice-progress-v1";

export interface UnitProgress {
  best: number;
  total: number;
  attempts: number;
}

export type ProgressMap = Record<string, UnitProgress>;

export function loadProgress(): ProgressMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as ProgressMap;
  } catch {
    return {};
  }
}

export function saveProgress(map: ProgressMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function isMastered(p?: UnitProgress): boolean {
  return !!p && p.total > 0 && p.best / p.total >= MASTERY_RATIO;
}

/** 單元狀態：未挑戰 / 練習中 / 已精通 */
export type UnitStatus = "untouched" | "practicing" | "mastered";

export function unitStatus(p?: UnitProgress): UnitStatus {
  if (isMastered(p)) return "mastered";
  if (p) return "practicing";
  return "untouched";
}
