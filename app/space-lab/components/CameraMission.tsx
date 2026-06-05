'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Planet, PLANET_EN } from '../lib/solar';
import { useI18n } from '../lib/i18n';

// 실제 자전축은 0~180°지만, 폰을 90°까지 눕히면 모바일 브라우저가 landscape로
// 자동 회전해 UX가 깨진다(iOS는 회전잠금 API 미지원). 따라서 정렬에 필요한
// 물리적 기울기를 ±MAX_LEAN 이내로 압축한다. 순서(기울수록 더 눕힘)는 유지.
const MAX_LEAN = 45;
function targetLean(axialTilt: number): number {
  const fold = axialTilt > 90 ? 180 - axialTilt : axialTilt; // 0~90
  const lean = (fold / 90) * MAX_LEAN;
  return axialTilt > 90 ? -lean : lean; // 90° 넘는 행성은 반대로 기울이는 느낌
}

const ALIGN_TOL = 10; // 정렬 허용 오차(도)

type Phase = 'intro' | 'live' | 'captured';

interface Props {
  planet: Planet;
  onClose: () => void;
  onCapture: (dataUrl: string, tilt: number) => void;
}

export default function CameraMission({ planet, onClose, onCapture }: Props) {
  const { t } = useI18n();
  const pName = t({ ko: planet.name, en: PLANET_EN[planet.key]?.name ?? planet.name });
  const mTitle = t({ ko: planet.mission?.title ?? '', en: PLANET_EN[planet.key]?.mission?.title ?? planet.mission?.title ?? '' });
  const mDesc = t({ ko: planet.mission?.desc ?? '', en: PLANET_EN[planet.key]?.mission?.desc ?? planet.mission?.desc ?? '' });
  const tilt = planet.axialTilt ?? 0;
  const target = targetLean(tilt);

  const [phase, setPhase] = useState<Phase>('intro');
  const [error, setError] = useState<string | null>(null);
  const [hasSensor, setHasSensor] = useState(false);
  const [manualTilt, setManualTilt] = useState(0);
  const [current, setCurrent] = useState(0); // 현재 롤 각
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const sensorTiltRef = useRef(0);
  const manualRef = useRef(0);
  const hasSensorRef = useRef(false);

  const aligned = Math.abs(current - target) <= ALIGN_TOL;

  const stopAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    window.removeEventListener('deviceorientation', onOrient as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onOrient(e: DeviceOrientationEvent) {
    if (e.gamma === null || e.gamma === undefined) return;
    hasSensorRef.current = true;
    setHasSensor(true);
    sensorTiltRef.current = e.gamma; // -90~90 좌우 롤
  }

  // 카메라 그리기 루프
  const drawLoop = useCallback(() => {
    const cv = canvasRef.current;
    const vid = videoRef.current;
    if (!cv || !vid) { rafRef.current = requestAnimationFrame(drawLoop); return; }
    const w = (cv.width = cv.clientWidth);
    const h = (cv.height = cv.clientHeight);
    const ctx = cv.getContext('2d')!;

    // 영상 cover 그리기
    if (vid.videoWidth) {
      const vr = vid.videoWidth / vid.videoHeight, cr = w / h;
      let dw = w, dh = h, dx = 0, dy = 0;
      if (vr > cr) { dh = h; dw = h * vr; dx = (w - dw) / 2; } else { dw = w; dh = w / vr; dy = (h - dh) / 2; }
      ctx.drawImage(vid, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, w, h);
    }

    const cx = w / 2, cy = h / 2;
    const cur = hasSensorRef.current ? sensorTiltRef.current : manualRef.current;
    setCurrent(cur);
    const isAligned = Math.abs(cur - target) <= ALIGN_TOL;

    // 반투명 행성 오버레이 (자전축만큼 회전)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((target * Math.PI) / 180);
    ctx.globalAlpha = 0.4;
    ctx.font = `${Math.min(w, h) * 0.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(planet.emoji, 0, 0);
    ctx.restore();

    const L = Math.min(w, h) * 0.42;
    const line = (angleDeg: number, color: string, width: number, dash: number[]) => {
      const a = (angleDeg * Math.PI) / 180;
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(cx - L * Math.cos(a), cy - L * Math.sin(a));
      ctx.lineTo(cx + L * Math.cos(a), cy + L * Math.sin(a));
      ctx.stroke();
      ctx.restore();
    };
    line(target, planet.color, 3, [10, 8]); // 목표 자전축
    line(cur, isAligned ? '#2ee06a' : '#ffffff', 2, []); // 현재 기울기

    rafRef.current = requestAnimationFrame(drawLoop);
  }, [planet.emoji, planet.color, target, tilt]);

  const start = useCallback(async () => {
    setError(null);
    try {
      // iOS 기울기 권한
      const DOE: any = (window as any).DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === 'function') {
        try { await DOE.requestPermission(); } catch { /* 사용자가 거부해도 슬라이더로 진행 */ }
      }
      window.addEventListener('deviceorientation', onOrient as any);

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setPhase('live');
      // video 준비 후 루프 시작
      setTimeout(() => {
        const vid = videoRef.current;
        if (vid) { vid.srcObject = stream; vid.play().catch(() => {}); }
        rafRef.current = requestAnimationFrame(drawLoop);
      }, 50);
    } catch (e: any) {
      // 카메라 실패해도(데스크톱/권한거부) 그리기 루프는 돌려 가이드/슬라이더 테스트 가능
      setError(t({ ko: `카메라를 열 수 없습니다 (${e?.name || e}). 기울기 가이드는 계속 사용할 수 있어요.`, en: `Can't open the camera (${e?.name || e}). The tilt guide still works.` }));
      setPhase('live');
      setTimeout(() => { rafRef.current = requestAnimationFrame(drawLoop); }, 50);
    }
  }, [drawLoop]);

  const capture = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const maxW = 480;
    const scale = Math.min(1, maxW / cv.width);
    const off = document.createElement('canvas');
    off.width = Math.round(cv.width * scale);
    off.height = Math.round(cv.height * scale);
    off.getContext('2d')!.drawImage(cv, 0, 0, off.width, off.height);
    const url = off.toDataURL('image/jpeg', 0.6);
    setSavedUrl(url);
    setPhase('captured');
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCapture(url, tilt); // 기록엔 실제 자전축 값 저장
  }, [onCapture, tilt]);

  useEffect(() => () => stopAll(), [stopAll]);

  return (
    <div className="sl-cam">
      <div className="sl-cam-top">
        <div>
          <strong>{planet.emoji} {pName}</strong>
          <span style={{ color: '#9aa3c8', marginLeft: 8, fontSize: 13 }}>{t({ ko: '자전축 {x}° 에 맞춰 촬영', en: 'Shoot at axial tilt {x}°' }, { x: tilt })}</span>
        </div>
        <button className="sl-btn" onClick={() => { stopAll(); onClose(); }}>✕ {t({ ko: '닫기', en: 'Close' })}</button>
      </div>

      {phase === 'intro' && (
        <div className="sl-cam-intro">
          <div style={{ fontSize: 64 }}>{planet.emoji}</div>
          <h2 className="sl-h1">{mTitle || t({ ko: '행성 촬영', en: 'Planet Photo' })}</h2>
          <p style={{ color: '#9aa3c8', maxWidth: 320 }}>{mDesc}</p>
          <p style={{ color: '#9aa3c8', fontSize: 13 }}>{t({ ko: '흰 선(현재 기울기)을 {n} 자전축 가이드선(점선)에 맞추면 정렬됩니다.', en: 'Align the white line (your tilt) to {n}’s dashed axis guide.' }, { n: pName })}<br />{t({ ko: '실제 자전축은 {x}°지만, 화면이 돌지 않도록 ±{m}° 안에서 편하게 기울이도록 안내해요.', en: 'The true tilt is {x}°, but to avoid screen rotation we guide you within ±{m}°.' }, { x: tilt, m: MAX_LEAN })}</p>
          <button className="sl-btn primary" onClick={start} style={{ marginTop: 8 }}>📷 {t({ ko: '카메라 시작', en: 'Start camera' })}</button>
        </div>
      )}

      {phase === 'live' && (
        <>
          <video ref={videoRef} playsInline muted style={{ display: 'none' }} />
          <canvas ref={canvasRef} className="sl-cam-canvas" />
          <div className={`sl-cam-badge ${aligned ? 'ok' : ''}`}>
            {aligned ? `✅ ${t({ ko: '정렬됨!', en: 'Aligned!' })}` : `${t({ ko: '기울기', en: 'tilt' })} ${Math.round(current)}° → ${t({ ko: '목표', en: 'target' })} ${Math.round(target)}°`}
          </div>
          {error && <div className="sl-cam-err">{error}</div>}
          {!hasSensor && (
            <div className="sl-cam-slider">
              <span>🖥️ {t({ ko: '기울기(센서 없음)', en: 'tilt (no sensor)' })}</span>
              <input type="range" min={-90} max={90} value={manualTilt}
                onChange={(e) => { const v = +e.target.value; setManualTilt(v); manualRef.current = v; }} />
              <span>{manualTilt}°</span>
            </div>
          )}
          <button className={`sl-btn ${aligned ? 'sun' : 'primary'} sl-cam-shutter`} onClick={capture}>
            {aligned ? `📸 ${t({ ko: '정렬 촬영!', en: 'Aligned shot!' })}` : `📸 ${t({ ko: '촬영', en: 'Shoot' })}`}
          </button>
        </>
      )}

      {phase === 'captured' && savedUrl && (
        <div className="sl-cam-intro">
          <h2 className="sl-h1">🎉 {t({ ko: '도감에 수집!', en: 'Added to your log!' })}</h2>
          <img src={savedUrl} alt="captured" style={{ maxWidth: '90%', borderRadius: 12, border: '1px solid var(--sl-border)' }} />
          <p style={{ color: '#9aa3c8' }}>{t({ ko: '{n} 자전축 {x}° 기록 완료.', en: '{n} axial tilt {x}° recorded.' }, { n: pName, x: tilt })}</p>
          <button className="sl-btn primary" onClick={() => { stopAll(); onClose(); }}>{t({ ko: '확인', en: 'OK' })}</button>
        </div>
      )}
    </div>
  );
}
