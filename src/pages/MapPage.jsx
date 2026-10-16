import AppHeader from "../components/layout/AppHeader";
import MapView from "../components/map/MapView";

export default function MapPage() {
  return (
    <div className="app-shell">
      <AppHeader />

      <main className="map-page">
        <section className="map-intro">
          <h2>Bản đồ dữ liệu địa lý</h2>
          <p>
            Khám phá các điểm địa lý và tuyến đường
            được ghi nhận trong bộ dữ liệu mẫu.
          </p>
        </section>

        <section className="map-panel">
          <MapView />
        </section>

        <footer className="map-footer">
          <span>3 địa điểm</span>
          <span>1 tuyến đường mẫu</span>
        </footer>
      </main>
    </div>
  );
}