import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { sampleReports } from "../../data/sampleReports";
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

      {sampleReports.map((report) => (
        <Marker
          key={report.id}
          position={[
            report.latitude,
            report.longitude,
          ]}
        >
          <Popup>
            <strong>{report.title}</strong>
            <p>{report.description}</p>
            <small>
              {report.latitude}, {report.longitude}
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