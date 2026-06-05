'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// 다국어 — 우선 KO/EN. 나중에 'ja'|'zh' 추가 시 각 t({...}) 호출에 키만 더하면 됨.
export type Lang = 'ko' | 'en';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'EN' },
];

export type TMap = Partial<Record<Lang, string>> & { ko: string };

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** t({ ko: '한국어', en: 'English' }) — 현재 언어 문자열 반환, 없으면 ko 폴백. */
  t: (m: TMap, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18n>({ lang: 'ko', setLang: () => {}, t: (m) => m.ko });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ko');
  useEffect(() => {
    try { const s = localStorage.getItem('sl_lang'); if (s === 'en' || s === 'ko') setLangState(s); } catch {}
  }, []);
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem('sl_lang', l); } catch {} };
  const t = (m: TMap, vars?: Record<string, string | number>) => {
    let s = m[lang] ?? m.ko;
    if (vars) for (const k in vars) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
    return s;
  };
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
