import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { sampleLocations } from "../../data/sampleLocations";
import { sampleTrack } from "../../data/sampleTrack";

export default function MapView() {
  const center = [21.0055, 105.8438];

  return (
    <MapContainer
      center={center}
      zoom={16}
      scrollWheelZoom={true}
      className="map-view"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {sampleLocations.map((location) => (
        <Marker
          key={location.id}
          position={[
            location.latitude,
            location.longitude,
          ]}
        >
          <Popup>
            <strong>{location.name}</strong>
            <p>{location.description}</p>
            <small>
              {location.latitude}, {location.longitude}
            </small>
          </Popup>
        </Marker>
      ))}

      <Polyline
        positions={sampleTrack}
        pathOptions={{
          color: "#2563eb",
          weight: 5,
        }}
      />
    </MapContainer>
  );
}