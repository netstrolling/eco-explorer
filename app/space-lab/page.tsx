'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import './space-lab.css';
import SolarJourney from './components/SolarJourney';

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
            🏛️ 과학의 길
          </button>
        </div>

        {tab === 'solar' ? (
          <SolarJourney onBgChange={handleBg} />
        ) : (
          <div className="sl-panel">
            <h2 className="sl-h1" style={{ fontSize: 18 }}>🏛️ 과학의 길 (K-Science Heritage)</h2>
            <p className="sl-sub" style={{ marginBottom: 0 }}>
              조선·근대 과학사 유적 탐사 모드는 다음 단계(Phase 2)에서 구현됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
