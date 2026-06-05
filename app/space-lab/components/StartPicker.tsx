'use client';
import dynamic from 'next/dynamic';
import { LatLng } from '../lib/geo';

const Inner = dynamic(() => import('./StartPickerInner'), {
  ssr: false,
  loading: () => <div className="sl-map" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#97a0c8' }}>지도 불러오는 중…</div>,
});

export default function StartPicker(props: { value: LatLng | null; onPick: (p: LatLng) => void }) {
  return <Inner {...props} />;
}
