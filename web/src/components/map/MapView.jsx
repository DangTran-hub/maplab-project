import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { statusColors, statusLabels } from "../../data/reportOptions";

function MapFocus({ reports, selectedId }) {
  const map = useMap();
  useEffect(() => {
    const selected = reports.find((report) => report.id === selectedId);
    if (selected) {
      map.setView([selected.latitude, selected.longitude], 17);
    } else if (reports.length) {
      map.fitBounds(reports.map((report) => [report.latitude, report.longitude]), { padding: [32, 32], maxZoom: 16 });
    }
  }, [map, reports, selectedId]);
  return null;
}

export default function MapView({ reports, selectedId, onSelect }) {
  return (
    <MapContainer center={[21.0055, 105.8438]} zoom={16} scrollWheelZoom className="map-view">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFocus reports={reports} selectedId={selectedId} />
      {reports.map((report) => (
        <CircleMarker key={report.id} center={[report.latitude, report.longitude]}
          radius={selectedId === report.id ? 12 : 9}
          pathOptions={{ color: selectedId === report.id ? "#172033" : statusColors[report.status], fillColor: statusColors[report.status], fillOpacity: 0.85, weight: selectedId === report.id ? 4 : 2 }}
          eventHandlers={{ click: () => onSelect(report.id) }}>
          <Popup>
            <strong>{report.title}</strong>
            <p>{report.description}</p>
            <p>{statusLabels[report.status]}</p>
            <small>{report.latitude}, {report.longitude}</small>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
