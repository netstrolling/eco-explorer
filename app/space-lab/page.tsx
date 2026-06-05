'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import './space-lab.css';
import SolarJourney from './components/SolarJourney';
import HeritageMode from './components/HeritageMode';

type Tab = 'solar' | 'heritage';

export default function SpaceLabPage() {
  const [tab, setTab] = useState<Tab>('solar');
  const [bg, setBg] = useState<string>('');

  const handleBg = useCallback((next: string) => setBg(next), []);

  return (
    <div className="sl-root" style={bg ? ({ ['--sl-dyn' as any]: bg }) : undefined}>
      <Link href="/" className="sl-btn sl-close">← 메인으로</Link>
      <div className="sl-inner">
        <h1 className="sl-h1">🔭 Space Lab</h1>
        <p className="sl-sub">갈다 비밀 테스트베드 · 기존 서비스와 격리된 실험 공간</p>

        <div className="sl-tabs">
          <button className={`sl-tab ${tab === 'solar' ? 'active' : ''}`} onClick={() => setTab('solar')}>
            🚀 Solar Journey
          </button>
          <button className={`sl-tab ${tab === 'heritage' ? 'active' : ''}`} onClick={() => setTab('heritage')}>
            🏛️ K-Science Heritage
          </button>
        </div>

        {tab === 'solar' ? (
          <SolarJourney onBgChange={handleBg} />
        ) : (
          <HeritageMode onBgChange={handleBg} />
        )}
      </div>
    </div>
  );
}
