'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Site } from '../lib/heritage';

type Phase = 'intro' | 'live' | 'captured';

interface Props {
  site: Site;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export default function TimeWarpCamera({ site, onClose, onCapture }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [error, setError] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // 세피아 영상 + 빈티지 캡션 그리기
  const drawLoop = useCallback(() => {
    const cv = canvasRef.current, vid = videoRef.current;
    if (!cv) { rafRef.current = requestAnimationFrame(drawLoop); return; }
    const w = (cv.width = cv.clientWidth), h = (cv.height = cv.clientHeight);
    const ctx = cv.getContext('2d')!;

    if (vid && vid.videoWidth) {
      const vr = vid.videoWidth / vid.videoHeight, cr = w / h;
      let dw = w, dh = h, dx = 0, dy = 0;
      if (vr > cr) { dh = h; dw = h * vr; dx = (w - dw) / 2; } else { dw = w; dh = w / vr; dy = (h - dh) / 2; }
      (ctx as any).filter = 'sepia(0.75) contrast(1.05) brightness(0.96) saturate(0.9)';
      ctx.drawImage(vid, dx, dy, dw, dh);
      (ctx as any).filter = 'none';
    } else {
      ctx.fillStyle = '#2a2418'; ctx.fillRect(0, 0, w, h);
    }

    // 비네팅(가장자리 어둡게) — 오래된 사진 느낌
    const grd = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(40,28,8,0.55)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);

    // 하단 캡션 바
    ctx.fillStyle = 'rgba(30,22,8,0.55)';
    ctx.fillRect(0, h - 64, w, 64);
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(Math.min(w, h) * 0.05)}px serif`;
    ctx.fillStyle = '#f3e7c8';
    ctx.textAlign = 'left';
    ctx.fillText(`${site.emoji} ${site.name}`, 16, h - 42);
    ctx.font = `${Math.round(Math.min(w, h) * 0.035)}px serif`;
    ctx.fillStyle = '#d8bd7e';
    ctx.fillText(`${site.era} · ${site.theme} — K-Science Heritage`, 16, h - 20);

    // 우상단 유물 스탬프
    ctx.font = `${Math.round(Math.min(w, h) * 0.09)}px serif`;
    ctx.textAlign = 'right';
    ctx.globalAlpha = 0.85;
    ctx.fillText(site.artifact.emoji, w - 16, 36);
    ctx.globalAlpha = 1;

    rafRef.current = requestAnimationFrame(drawLoop);
  }, [site]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setPhase('live');
      setTimeout(() => {
        const vid = videoRef.current;
        if (vid) { vid.srcObject = stream; vid.play().catch(() => {}); }
        rafRef.current = requestAnimationFrame(drawLoop);
      }, 50);
    } catch (e: any) {
      setError(`카메라를 열 수 없습니다 (${e?.name || e}).`);
      setPhase('live');
      setTimeout(() => { rafRef.current = requestAnimationFrame(drawLoop); }, 50);
    }
  }, [drawLoop]);

  const capture = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const maxW = 520, scale = Math.min(1, maxW / cv.width);
    const off = document.createElement('canvas');
    off.width = Math.round(cv.width * scale);
    off.height = Math.round(cv.height * scale);
    off.getContext('2d')!.drawImage(cv, 0, 0, off.width, off.height);
    const url = off.toDataURL('image/jpeg', 0.55);
    setSavedUrl(url);
    setPhase('captured');
    stopAll();
    onCapture(url);
  }, [onCapture, stopAll]);

  useEffect(() => () => stopAll(), [stopAll]);

  return (
    <div className="sl-cam">
      <div className="sl-cam-top">
        <div><strong>{site.emoji} {site.name}</strong><span style={{ color: '#9aa3c8', marginLeft: 8, fontSize: 13 }}>Time Warp 인증샷</span></div>
        <button className="sl-btn" onClick={() => { stopAll(); onClose(); }}>✕ 닫기</button>
      </div>

      {phase === 'intro' && (
        <div className="sl-cam-intro">
          <div style={{ fontSize: 56 }}>{site.emoji}</div>
          <h2 className="sl-h1">📸 Time Warp 인증샷</h2>
          <p style={{ color: '#9aa3c8', maxWidth: 320 }}>{site.name}의 표석·유물을 세피아 톤으로 담아 도감에 남기세요.</p>
          <button className="sl-btn primary" onClick={start}>📷 카메라 시작</button>
        </div>
      )}

      {phase === 'live' && (
        <>
          <video ref={videoRef} playsInline muted style={{ display: 'none' }} />
          <canvas ref={canvasRef} className="sl-cam-canvas" />
          {error && <div className="sl-cam-err">{error}</div>}
          <button className="sl-btn sun sl-cam-shutter" onClick={capture}>📸 찰칵</button>
        </>
      )}

      {phase === 'captured' && savedUrl && (
        <div className="sl-cam-intro">
          <h2 className="sl-h1">🎉 도감에 인증샷 수록!</h2>
          <img src={savedUrl} alt="time warp" style={{ maxWidth: '90%', borderRadius: 12, border: '1px solid var(--sl-border)' }} />
          <button className="sl-btn primary" onClick={() => { stopAll(); onClose(); }}>확인</button>
        </div>
      )}
    </div>
  );
}
