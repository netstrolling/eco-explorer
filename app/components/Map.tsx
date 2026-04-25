'use client';
import dynamic from 'next/dynamic';

const MapInner = dynamic(() => import('./MapInner'), { 
  ssr: false, 
  loading: () => <div style={{ height: '600px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', borderRadius: '12px', border: '1px solid var(--border)' }}>지도 불러오는 중...</div> 
});

export default function Map({ submissions }: { submissions: any[] }) {
  return <MapInner submissions={submissions} />;
}
