'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';

// Fix for default marker icons in React-Leaflet
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapInnerProps {
  submissions: any[];
}

export default function MapInner({ submissions }: MapInnerProps) {
  const validSubmissions = submissions.filter(s => s.lat && s.lng);
  
  const center: [number, number] = validSubmissions.length > 0 
    ? [validSubmissions[0].lat, validSubmissions[0].lng] 
    : [34.6067, 127.3470]; // Default Goheung approx

  return (
    <div style={{ height: '600px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validSubmissions.map(item => {
          const urls = JSON.parse(item.mediaUrls || '[]');
          const mainImg = urls.length > 0 ? urls[0] : null;

          return (
            <Marker key={item.id} position={[item.lat, item.lng]}>
              <Popup>
                <div style={{ minWidth: '150px' }}>
                  {mainImg && <img src={mainImg} alt={item.name} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} />}
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{item.category} / {item.location}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{item.teamName}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
