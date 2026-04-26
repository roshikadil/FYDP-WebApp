import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapComponentProps {
  incidents?: Array<{
    id: string;
    location: {
      coordinates: [number, number];
      address: string;
    };
    description: string;
    status: string;
  }>;
}

const MapComponent: React.FC<MapComponentProps> = ({ incidents = [] }) => {
  const defaultCenter: [number, number] = [24.8607, 67.0011]; // Karachi coordinates
  const defaultZoom = 12;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.location.coordinates[1], incident.location.coordinates[0]]}
        >
          <Popup>
            <div>
              <strong>{incident.id}</strong>
              <p>{incident.description}</p>
              <p>{incident.location.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;