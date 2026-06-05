'use client';
import dynamic from 'next/dynamic';
import { LatLng } from '../lib/geo';
import { Journey } from '../lib/solar';

const Inner = dynamic(() => import('./SpaceMapInner'), {
  ssr: false,
  loading: () => (
    <div className="sl-map" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#97a0c8' }}>
      성도(星圖) 불러오는 중…
    </div>
  ),
});

interface Props {
  journey: Journey;
  landmarks: Record<string, string> | null;
  currentOrbitKey: string;
  pos: LatLng | null;
  shipEmoji: string;
  canSim: boolean;
  onSimMove: (p: LatLng) => void;
}

export default function SpaceMap(props: Props) {
  return <Inner {...props} />;
}
