import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import MapView from "../components/map/MapView";
import { categoryLabels, nextStatuses, statusLabels } from "../data/reportOptions";
import { listReports, updateReportStatus } from "../services/reports";

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const requestId = useRef(0);
  const saveInFlight = useRef(false);

  const load = useCallback(async (signal) => {
    const current = ++requestId.current;
    try {
      const data = await listReports(signal);
      if (current !== requestId.current) return;
      setReports(data);
      setLoaded(true);
    } catch (failure) {
      if (current === requestId.current && failure.name !== "AbortError") setError(failure.message);
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++requestId.current;
    listReports(controller.signal).then((data) => {
      if (current !== requestId.current) return;
      setReports(data);
      setLoaded(true);
    }).catch((failure) => {
      if (current === requestId.current && failure.name !== "AbortError") setError(failure.message);
    }).finally(() => {
      if (current === requestId.current) setLoading(false);
    });
    return () => { controller.abort(); requestId.current += 1; };
  }, []);

  const visibleReports = useMemo(() => reports.filter((report) => !filter || report.status === filter), [reports, filter]);
  const selected = visibleReports.find((report) => report.id === selectedId);
  const nextStatus = selected && nextStatuses[selected.status];

  function refresh() {
    setLoading(true);
    setError("");
    setNotice("");
    load();
  }

  async function advanceStatus() {
    if (!selected || !nextStatus || saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateReportStatus(selected.id, nextStatus);
      setReports((current) => current.map((report) => report.id === updated.id ? updated : report));
      setNotice(`Đã cập nhật “${updated.title}” thành ${statusLabels[updated.status].toLowerCase()}.`);
    } catch (failure) {
      setError(failure.message);
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="map-page">
        <section className="map-intro">
          <h2>Sự cố trong khuôn viên</h2>
          <p>Chọn báo cáo trên bản đồ hoặc danh sách để xem và cập nhật tiến độ xử lý.</p>
        </section>

        <div className="report-toolbar">
          <div className="report-filter">
            <label htmlFor="status-filter">Trạng thái</label>
            <select id="status-filter" value={filter} disabled={saving} onChange={(event) => setFilter(event.target.value)}>
              <option value="">Tất cả</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <button type="button" onClick={refresh} disabled={loading || saving}>
            {loading ? "Đang tải…" : "Làm mới"}
          </button>
          <span aria-live="polite">{loaded ? `${visibleReports.length} / ${reports.length} báo cáo` : "Chưa tải dữ liệu"}</span>
        </div>

        {error && <p className="message message-error" role="alert">{error}{loaded && " Dữ liệu đang hiển thị là lần tải gần nhất."}</p>}
        {notice && <p className="message message-success" role="status">{notice}</p>}
        {loading && <p role="status">Đang tải báo cáo…</p>}
        {loaded && !loading && !error && visibleReports.length === 0 && (
          <p className="message" role="status">{reports.length ? "Không có báo cáo thuộc trạng thái này. Hãy chọn trạng thái khác." : "Chưa có báo cáo. Báo cáo mới sẽ xuất hiện sau khi làm mới."}</p>
        )}

        <div className="report-workspace" aria-busy={loading}>
          <section className="map-panel" aria-label="Bản đồ báo cáo">
            <MapView reports={visibleReports} selectedId={selected?.id} onSelect={setSelectedId} />
          </section>
          <aside className="report-sidebar" aria-label="Danh sách và chi tiết báo cáo">
            <section className="report-list-panel">
              <h3>Danh sách báo cáo</h3>
              <ul className="report-list">
                {visibleReports.map((report) => (
                  <li key={report.id}>
                    <button type="button" className={selected?.id === report.id ? "report-item is-selected" : "report-item"}
                      aria-pressed={selected?.id === report.id} onClick={() => setSelectedId(report.id)}>
                      <strong>{report.title}</strong>
                      <span>{categoryLabels[report.category]}</span>
                      <span className={`status-badge status-${report.status.toLowerCase()}`}>{statusLabels[report.status]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section className="report-detail" aria-label="Chi tiết báo cáo">
              <h3>Chi tiết báo cáo</h3>
              {selected ? (
                <>
                  <h4>{selected.title}</h4>
                  <p className="report-description">{selected.description}</p>
                  <dl>
                    <dt>Danh mục</dt><dd>{categoryLabels[selected.category]}</dd>
                    <dt>Trạng thái</dt><dd>{statusLabels[selected.status]}</dd>
                    <dt>Tọa độ</dt><dd>{selected.latitude}, {selected.longitude}</dd>
                    <dt>Ngày tạo</dt><dd>{new Date(selected.createdAt).toLocaleString("vi-VN")}</dd>
                    <dt>Mã báo cáo</dt><dd>{selected.id}</dd>
                  </dl>
                  {nextStatus ? (
                    <button className="primary-button" type="button" disabled={saving || loading} onClick={advanceStatus}>
                      {saving ? "Đang lưu…" : `Chuyển sang ${statusLabels[nextStatus].toLowerCase()}`}
                    </button>
                  ) : <p className="resolved-note">Báo cáo đã được xử lý.</p>}
                </>
              ) : <p>Chọn một báo cáo để xem chi tiết.</p>}
            </section>
          </aside>
        </div>
        <footer className="map-footer"><span>Chọn Làm mới để xem các báo cáo và trạng thái mới nhất.</span></footer>
      </main>
    </div>
  );
}
