'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import './space-lab.css';
import { I18nProvider, useI18n, LANGS } from './lib/i18n';
import SolarJourney from './components/SolarJourney';
import HeritageMode from './components/HeritageMode';

type Tab = 'solar' | 'heritage';

function SpaceLabInner() {
  const { lang, setLang, t } = useI18n();
  const [tab, setTab] = useState<Tab>('solar');
  const [bg, setBg] = useState<string>('');
  const handleBg = useCallback((next: string) => setBg(next), []);

  return (
    <div className="sl-root" style={bg ? ({ ['--sl-dyn' as any]: bg }) : undefined}>
      <div className="sl-inner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Link href="/" className="sl-btn" style={{ padding: '8px 14px' }}>{t({ ko: '← 메인으로', en: '← Home' })}</Link>
          <div className="sl-seg" style={{ flexShrink: 0 }}>
            {LANGS.map((l) => (
              <button key={l.code} className={lang === l.code ? 'active' : ''} onClick={() => setLang(l.code)}>{l.label}</button>
            ))}
          </div>
        </div>
        <h1 className="sl-h1">🔭 Space Lab</h1>
        <p className="sl-sub">{t({ ko: '갈다 비밀 테스트베드 · 기존 서비스와 격리된 실험 공간', en: "Galda's secret testbed · an isolated experimental space" })}</p>

        <div className="sl-tabs">
          <button className={`sl-tab ${tab === 'solar' ? 'active' : ''}`} onClick={() => setTab('solar')}>
            🚀 Solar Journey
          </button>
          <button className={`sl-tab ${tab === 'heritage' ? 'active' : ''}`} onClick={() => setTab('heritage')}>
            🏛️ K-Science Heritage
          </button>
        </div>

        {tab === 'solar' ? <SolarJourney onBgChange={handleBg} /> : <HeritageMode onBgChange={handleBg} />}
      </div>
    </div>
  );
}

export default function SpaceLabPage() {
  return (
    <I18nProvider>
      <SpaceLabInner />
    </I18nProvider>
  );
}
