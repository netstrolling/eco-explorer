'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng } from '../lib/geo';
import { Journey, PLANETS, planetLocation, ringRadius } from '../lib/solar';

const emojiIcon = (emoji: string, size = 30) =>
  L.divIcon({
    className: 'sl-emoji-icon',
    html: `<div class="sl-marker-emoji" style="font-size:${size}px">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

function FitOnce({ bounds }: { bounds: LatLng[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current) {
      map.fitBounds(bounds as any, { padding: [40, 40] });
      done.current = true;
    }
  }, [map, bounds]);
  return null;
}

function ClickCatcher({ onMove }: { onMove: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onMove([e.latlng.lat, e.latlng.lng]) });
  return null;
}

interface Props {
  journey: Journey;
  landmarks: Record<string, string> | null;
  currentOrbitKey: string;
  pos: LatLng | null;
  shipEmoji: string;
  canSim: boolean;
  onSimMove: (p: LatLng) => void;
}

export default function SpaceMapInner({ journey, landmarks, currentOrbitKey, pos, shipEmoji, canSim, onSimMove }: Props) {
  const { start, galda, sun } = journey;
  const center: LatLng = pos ?? start;

  return (
    <div className="sl-map">
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitOnce bounds={[start, sun]} />
        {canSim && <ClickCatcher onMove={onSimMove} />}

        {/* 태양 중심 궤도 링 (동심원) */}
        {PLANETS.filter((p) => p.au > 0).map((p) => {
          const active = p.key === currentOrbitKey;
          return (
            <Circle
              key={`ring-${p.key}`}
              center={sun}
              radius={ringRadius(journey, p.au)}
              pathOptions={{
                color: active ? '#ff6b35' : p.color,
                weight: active ? 2.5 : 1,
                opacity: active ? 0.95 : 0.35,
                fill: false,
                dashArray: active ? undefined : '3 7',
              }}
            />
          );
        })}

        {/* 기준선 (출발지→갈다→태양) */}
        <Polyline positions={[start, galda, sun]} pathOptions={{ color: '#6c8cff', weight: 1.5, dashArray: '6 8', opacity: 0.5 }} />

        {/* 갈다 도착 반경 */}
        <Circle center={galda} radius={40} pathOptions={{ color: '#2e8b57', fillColor: '#2e8b57', fillOpacity: 0.15, weight: 1 }} />

        {/* 행성 마커 (기준선 위 대표 위치) */}
        {PLANETS.map((p) => {
          const size = p.key === 'earth' ? 34 : p.key === 'sun' ? 30 : 26;
          return (
            <Marker key={p.key} position={planetLocation(journey, p.au)} icon={emojiIcon(p.emoji, size)}>
              <Popup>
                <div style={{ minWidth: 150 }}>
                  <strong>{p.emoji} {p.name}</strong> · {p.au} AU
                  {landmarks?.[p.key] && <div style={{ fontSize: 12, color: '#9aa3c8', marginTop: 4 }}>📍 {landmarks[p.key]}</div>}
                  {p.mission && <div style={{ fontSize: 12, marginTop: 6 }}>🛰️ {p.mission.title}</div>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 우주선 */}
        {pos && (
          <Marker position={pos} icon={emojiIcon(shipEmoji, 28)}>
            <Popup>현재 위치 ({canSim ? '시뮬레이터' : '실시간 GPS'})</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
