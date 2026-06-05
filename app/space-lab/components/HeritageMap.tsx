'use client';
import dynamic from 'next/dynamic';
import { LatLng } from '../lib/geo';
import { Site } from '../lib/heritage';

const Inner = dynamic(() => import('./HeritageMapInner'), {
  ssr: false,
  loading: () => <div className="sl-map" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#97a0c8' }}>고지도 펼치는 중…</div>,
});

interface Props {
  sites: Site[];
  pos: LatLng | null;
  canSim: boolean;
  onSimMove: (p: LatLng) => void;
  onSiteClick: (s: Site) => void;
}

export default function HeritageMap(props: Props) {
  return <Inner {...props} />;
}
