'use client';
import { Fragment, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng } from '../lib/geo';
import { Site, Beacon, inRange, localizeEra } from '../lib/heritage';
import { useI18n } from '../lib/i18n';

const emojiIcon = (emoji: string, size = 30, ring = false) =>
  L.divIcon({
    className: 'sl-emoji-icon',
    html: `<div class="sl-marker-emoji ${ring ? 'sl-marker-ring' : ''}" style="font-size:${size}px">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

function FitOnce({ bounds }: { bounds: LatLng[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current && bounds.length) { map.fitBounds(bounds as any, { padding: [50, 50] }); done.current = true; }
  }, [map, bounds]);
  return null;
}

function ClickCatcher({ onMove }: { onMove: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onMove([e.latlng.lat, e.latlng.lng]) });
  return null;
}

interface Props {
  sites: Site[];
  beacons: Beacon[];
  collectedItemIds: string[];
  pos: LatLng | null;
  canSim: boolean;
  onSimMove: (p: LatLng) => void;
  onSiteClick: (s: Site) => void;
}

export default function HeritageMapInner({ sites, beacons, collectedItemIds, pos, canSim, onSimMove, onSiteClick }: Props) {
  const { lang, t } = useI18n();
  const got = new Set(collectedItemIds);
  const bounds: LatLng[] = sites.map((s) => [s.lat, s.lng] as LatLng);
  if (pos) bounds.push(pos);
  const center: LatLng = pos ?? (sites[0] ? [sites[0].lat, sites[0].lng] : [37.5759, 126.9769]);

  return (
    <div className="sl-map sl-map-heritage">
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <FitOnce bounds={bounds} />
        {canSim && <ClickCatcher onMove={onSimMove} />}

        {sites.map((s) => {
          const active = inRange(s, pos);
          return (
            <Fragment key={s.id}>
              <Circle center={[s.lat, s.lng]} radius={s.radius}
                pathOptions={{ color: active ? '#c9962e' : '#8a6d3b', fillColor: '#c9962e', fillOpacity: active ? 0.25 : 0.08, weight: active ? 2 : 1 }} />
              <Marker position={[s.lat, s.lng]} icon={emojiIcon(s.emoji, active ? 34 : 28, active)}
                eventHandlers={{ click: () => onSiteClick(s) }}>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong>{s.emoji} {s.name}</strong>
                    <div style={{ fontSize: 12, color: '#7a6033', marginTop: 2 }}>{localizeEra(s.era, lang)} · {s.theme}</div>
                    <div style={{ fontSize: 12, marginTop: 6 }}>“{s.tagline}”</div>
                    <div style={{ fontSize: 12, marginTop: 6, color: active ? '#2e7d32' : '#999' }}>{active ? t({ ko: '🎯 반경 안 — 클릭해 미션 시작', en: '🎯 In range — tap to start the mission' }) : t({ ko: '아직 범위 밖', en: 'Out of range' })}</div>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          );
        })}

        {/* 근접 아이템 비콘 */}
        {beacons.map((b) => {
          const owned = got.has(b.id);
          return (
            <Fragment key={b.id}>
              <Circle center={[b.lat, b.lng]} radius={b.radius}
                pathOptions={{ color: owned ? '#2ee06a' : '#6c8cff', fillColor: owned ? '#2ee06a' : '#6c8cff', fillOpacity: 0.1, weight: 1, dashArray: '2 6' }} />
              <Marker position={[b.lat, b.lng]} icon={emojiIcon(owned ? '✨' : b.emoji, 22)}>
                <Popup>
                  <div style={{ minWidth: 150 }}>
                    <strong>{b.emoji} {b.name}</strong>
                    <div style={{ fontSize: 12, marginTop: 4 }}>{b.blurb}</div>
                    <div style={{ fontSize: 12, marginTop: 6, color: owned ? '#2e7d32' : '#7a6033' }}>
                      {owned ? t({ ko: `✅ ${b.item.emoji} ${b.item.name} 획득함`, en: `✅ ${b.item.emoji} ${b.item.name} collected` }) : t({ ko: `${b.item.emoji} ${b.item.name} — 30~40m 안에 들면 자동 획득`, en: `${b.item.emoji} ${b.item.name} — auto-collected within range` })}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          );
        })}

        {pos && (
          <Marker position={pos} icon={emojiIcon('🧭', 26)}>
            <Popup>{t({ ko: '현재 위치', en: 'Your location' })} ({canSim ? t({ ko: '시뮬레이터', en: 'Simulator' }) : t({ ko: '실시간 GPS', en: 'Live GPS' })})</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
