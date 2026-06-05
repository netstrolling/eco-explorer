'use client';
import { useState } from 'react';
import { Site, checkTimeSync } from '../lib/heritage';

interface Props {
  site: Site;
  alreadyDone: boolean;
  onSuccess: (site: Site) => void;
  onClose: () => void;
}

export default function HeritageMission({ site, alreadyDone, onSuccess, onClose }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'none' | 'ok' | 'no'>('none');

  const succeed = () => { setResult('ok'); onSuccess(site); };

  const submitQuiz = () => {
    if (picked === null || site.mission.kind !== 'quiz') return;
    if (picked === site.mission.answer) succeed();
    else setResult('no');
  };
  const submitTime = () => {
    if (site.mission.kind !== 'timesync') return;
    if (checkTimeSync(input, site.mission.toleranceMin, new Date())) succeed();
    else setResult('no');
  };

  return (
    <div className="sl-modal-backdrop" onClick={onClose}>
      <div className="sl-modal sl-modal-heritage" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 40 }}>{site.emoji}</div>
        <h2 style={{ color: '#3a2c12' }}>{site.name}</h2>
        <div className="sl-her-badge">{site.era} · {site.theme}</div>
        <p style={{ color: '#5b4a2a', fontStyle: 'italic', margin: '8px 0' }}>“{site.tagline}”</p>
        <p style={{ color: '#6b5836', fontSize: 13, margin: '0 0 14px' }}>{site.blurb}</p>

        {result === 'ok' || alreadyDone ? (
          <div className="sl-her-success">
            <div style={{ fontSize: 34 }}>{site.artifact.emoji}</div>
            <strong>“{site.artifact.name}” 수집!</strong>
            <p style={{ fontSize: 13, color: '#6b5836' }}>도감에 기록되었습니다.</p>
            <button className="sl-btn primary" onClick={onClose}>확인</button>
          </div>
        ) : (
          <>
            <p style={{ fontWeight: 700, color: '#3a2c12' }}>{site.mission.prompt}</p>

            {site.mission.kind === 'quiz' && (
              <div className="sl-quiz-options">
                {site.mission.options.map((opt, i) => (
                  <button key={i} className={`sl-quiz-opt ${picked === i ? 'sel' : ''}`} onClick={() => { setPicked(i); setResult('none'); }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {site.mission.kind === 'timesync' && (
              <input className="sl-input sl-input-light" placeholder="예: 14:08" value={input}
                onChange={(e) => { setInput(e.target.value); setResult('none'); }} />
            )}

            {result === 'no' && <p style={{ color: '#b3261e', fontSize: 13, marginTop: 10 }}>아쉬워요! 다시 시도해 보세요.</p>}

            <div className="sl-btn-row" style={{ justifyContent: 'center', marginTop: 14 }}>
              <button className="sl-btn primary" onClick={site.mission.kind === 'quiz' ? submitQuiz : submitTime}>제출</button>
              <button className="sl-btn" onClick={onClose}>닫기</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
