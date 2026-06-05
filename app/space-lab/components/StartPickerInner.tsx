'use client';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng } from '../lib/geo';
import { GALDA } from '../lib/solar';

const pinIcon = L.divIcon({
  className: 'sl-emoji-icon',
  html: '<div class="sl-marker-emoji" style="font-size:26px">🚀</div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function Clicker({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

export default function StartPickerInner({ value, onPick }: { value: LatLng | null; onPick: (p: LatLng) => void }) {
  const center: LatLng = value ?? [37.5717, 126.9769];
  return (
    <div className="sl-map" style={{ height: 280 }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Clicker onPick={onPick} />
        {value && <Marker position={value} icon={pinIcon} />}
        <Marker position={GALDA} icon={L.divIcon({ className: 'sl-emoji-icon', html: '<div class="sl-marker-emoji" style="font-size:24px">🌍</div>', iconSize: [24, 24], iconAnchor: [12, 12] })} />
      </MapContainer>
    </div>
  );
}
