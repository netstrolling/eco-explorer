'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng } from '../lib/geo';
import { SEOUL_STATION, GALDA, PLANETS, planetLocation, computeSunLocation } from '../lib/solar';

const emojiIcon = (emoji: string, size = 30) =>
  L.divIcon({
    className: 'sl-emoji-icon',
    html: `<div class="sl-marker-emoji" style="font-size:${size}px">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

// 마운트 시 1회 전체 벡터(명왕성~태양)가 보이도록 맞춤. 이후엔 사용자가 자유롭게 이동.
function FitOnce({ bounds }: { bounds: LatLng[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current) {
      map.fitBounds(bounds as any, { padding: [50, 50] });
      done.current = true;
    }
  }, [map, bounds]);
  return null;
}

function ClickCatcher({ onMove }: { onMove: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMove([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

interface Props {
  pos: LatLng | null;
  shipEmoji: string;
  canSim: boolean;
  onSimMove: (p: LatLng) => void;
}

export default function SpaceMapInner({ pos, shipEmoji, canSim, onSimMove }: Props) {
  const sun = computeSunLocation();
  const center: LatLng = pos ?? SEOUL_STATION;

  return (
    <div className="sl-map">
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitOnce bounds={[SEOUL_STATION, sun]} />
        {canSim && <ClickCatcher onMove={onSimMove} />}

        {/* 출발지(명왕성)→갈다(지구)→태양 벡터 */}
        <Polyline positions={[SEOUL_STATION, GALDA, sun]} pathOptions={{ color: '#6c8cff', weight: 2, dashArray: '6 8', opacity: 0.7 }} />

        {/* 갈다 도착 판정 반경 */}
        <Circle center={GALDA} radius={40} pathOptions={{ color: '#2e8b57', fillColor: '#2e8b57', fillOpacity: 0.12, weight: 1 }} />

        {/* 행성 마커 — 실제 벡터 위 좌표에 배치 */}
        {PLANETS.map((p) => {
          const size = p.key === 'earth' ? 34 : p.key === 'sun' ? 30 : 26;
          return (
            <Marker key={p.key} position={planetLocation(p.au)} icon={emojiIcon(p.emoji, size)}>
              <Popup>
                <div style={{ minWidth: 150 }}>
                  <strong>{p.emoji} {p.name}</strong> · {p.au} AU
                  <div style={{ fontSize: 12, color: '#9aa3c8', marginTop: 4 }}>📍 {p.landmark}</div>
                  {p.mission && <div style={{ fontSize: 12, marginTop: 6 }}>🛰️ {p.mission.title}</div>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 우주선(현재 위치) */}
        {pos && (
          <Marker position={pos} icon={emojiIcon(shipEmoji, 28)}>
            <Popup>현재 위치 ({canSim ? '시뮬레이터' : '실시간 GPS'})</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
