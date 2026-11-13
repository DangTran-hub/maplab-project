import { useEffect, useState } from "react";
import { divIcon } from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, ScaleControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { statusLabels } from "../../data/reportOptions";
import Icon from "../Icon";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import streetMapStyle from "../../data/streetMapStyle.json";

function fitReports(map, reports) {
  if (reports.length) map.fitBounds(reports.map((report) => [report.latitude, report.longitude]), { padding: [50, 50], maxZoom: 17 });
  else map.setView([21.0055, 105.8438], 16);
}

function StreetLayer() {
  const map = useMap();
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    let layer;
    let disposed = false;
    Promise.all([
      import("@maplibre/maplibre-gl-leaflet"),
      import("maplibre-gl"),
    ]).then(([{ maplibreGL }, { setWorkerUrl }]) => {
      if (disposed) return;
      setWorkerUrl(workerUrl);
      // Clone because the renderer may mutate the style during initialization.
      // The bundled style assigns a solid color to every polygon, including paths.
      const style = structuredClone(streetMapStyle);
      layer = maplibreGL({ style, attribution: '<a href="https://openfreemap.org/">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' });
      try {
        layer.addTo(map);
        layer.getMaplibreMap().on("error", () => {
          if (!disposed) { map.removeLayer(layer); setFallback(true); }
        });
      } catch {
        if (map.hasLayer(layer)) map.removeLayer(layer);
        setFallback(true);
      }
    }).catch(() => { if (!disposed) setFallback(true); });
    return () => {
      disposed = true;
      if (layer && map.hasLayer(layer)) map.removeLayer(layer);
    };
  }, [map]);
  return fallback ? <>
    <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
    <div className="map-fallback" role="status">Bản đồ đơn giản chưa tải được. Đang dùng bản đồ tiêu chuẩn.</div>
  </> : null;
}

function MapTools({ reports, selectedId }) {
  const map = useMap();
  useEffect(() => {
    const selected = reports.find((report) => report.id === selectedId);
    if (selected) map.setView([selected.latitude, selected.longitude], 17);
    else fitReports(map, reports);
  }, [map, reports, selectedId]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return <button type="button" className="map-fit" onClick={() => fitReports(map, reports)}><Icon name="search" size={17} /> Xem toàn bộ</button>;
}

export default function MapView({ reports, selectedId, onSelect }) {
  return (
    <MapContainer center={[21.0055, 105.8438]} zoom={16} maxZoom={20} zoomControl={false} scrollWheelZoom className="map-view">
      <StreetLayer />
      <MapTools reports={reports} selectedId={selectedId} />
      <ZoomControl position="bottomright" />
      <ScaleControl position="bottomleft" imperial={false} />
      {reports.map((report) => (
        <Marker key={report.id} position={[report.latitude, report.longitude]}
          title={report.title} alt={`${report.title}: ${statusLabels[report.status]}`}
          zIndexOffset={selectedId === report.id ? 1000 : 0}
          icon={divIcon({ className: "report-marker", html: `<span class="map-pin status-pin-${report.status.toLowerCase()} ${selectedId === report.id ? "is-selected" : ""}"><span></span></span>`, iconSize: [32, 40], iconAnchor: [16, 38], popupAnchor: [0, -38] })}
          eventHandlers={{ click: () => onSelect(report.id) }}>
          <Popup>
            <span className={`status-badge status-${report.status.toLowerCase()}`}>{statusLabels[report.status]}</span>
            <strong>{report.title}</strong>
            <p>{report.description}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
