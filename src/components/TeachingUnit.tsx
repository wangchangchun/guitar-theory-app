import type { ReactNode } from "react";
import type { LessonLevel } from "./PageIntro";

/**
 * 教學單元外框：把一頁的內容切成「單元 1、單元 2…」，由淺入深依序往下讀。
 * 每個單元先講清楚「這個單元要回答什麼問題」，再放說明與互動工具，
 * 讓沒有基礎的人可以照順序學，而不是打開就看到一堆查表用的圖。
 */

const LEVEL_STYLES: Record<LessonLevel, string> = {
  入門: "bg-olive-700/15 text-olive-700",
  進階: "bg-navy-700/15 text-navy-700",
  挑戰: "bg-blood-700/15 text-blood-700",
};

interface Props {
  /** 單元編號，從 1 開始 */
  n: number;
  level: LessonLevel;
  title: string;
  /** 這個單元要回答的問題（一句話） */
  question: string;
  children: ReactNode;
}

export function TeachingUnit({ n, level, title, question, children }: Props) {
  return (
    <section className="rounded-2xl border border-line-200 bg-paper-100">
      <header className="border-b border-line-200 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-navy-700 px-1.5 font-mono text-xs font-bold text-white">
            {n}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${LEVEL_STYLES[level]}`}
          >
            {level}
          </span>
          <h2 className="text-base font-bold text-ink-900">{title}</h2>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
          <span className="mr-1 font-semibold text-gold-700">這單元回答</span>
          {question}
        </p>
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

/**
 * 單元內的重點小方塊：用來放「一句話結論」或「記住這個就好」。
 */
export function KeyPoint({
  label = "重點",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <p className="rounded-xl border border-gold-700/30 bg-gold-700/[0.08] px-3.5 py-2.5 text-xs leading-relaxed text-ink-700">
      <span className="mr-1.5 font-bold text-gold-700">💡 {label}</span>
      {children}
    </p>
  );
}
