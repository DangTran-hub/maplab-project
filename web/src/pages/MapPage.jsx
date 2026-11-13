import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import Icon from "../components/Icon";
import MapView from "../components/map/MapView";
import { categoryLabels, nextStatuses, statusLabels } from "../data/reportOptions";
import { listReports, updateReportStatus } from "../services/reports";

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
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

  const visibleReports = useMemo(() => reports.filter((report) => (!filter || report.status === filter) && `${report.title} ${report.description} ${categoryLabels[report.category]}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi"))), [reports, filter, query]);
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
          <div>
          <h2>Sự cố trong khuôn viên</h2>
          <p>Tìm đúng vị trí. Theo dõi từng sự cố.</p>
          </div>
          <button className="refresh-button" type="button" onClick={refresh} disabled={loading || saving}>
            <Icon name="refresh" size={17} />{loading ? "Đang tải…" : "Làm mới"}
          </button>
        </section>

        <div className="report-toolbar">
          <div className="report-filter" role="group" aria-label="Lọc theo trạng thái">
            {[["", "Tất cả"], ...Object.entries(statusLabels)].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={filter === value} disabled={saving} onClick={() => setFilter(value)}>
                {value && <span className={`status-dot status-pin-${value.toLowerCase()}`} />}{label}<span className="filter-count">{reports.filter((report) => !value || report.status === value).length}</span>
              </button>
            ))}
          </div>
          <span className="toolbar-hint">Chọn ghim để xem chi tiết</span>
        </div>

        {error && <p className="message message-error" role="alert">{error}{loaded && " Dữ liệu đang hiển thị là lần tải gần nhất."}</p>}
        {notice && <p className="message message-success" role="status">{notice}</p>}
        {loading && <p role="status">Đang tải báo cáo…</p>}
        {loaded && !loading && !error && !query && visibleReports.length === 0 && (
          <p className="message" role="status">{reports.length ? "Không có báo cáo thuộc trạng thái này. Hãy chọn trạng thái khác." : "Chưa có báo cáo. Báo cáo mới sẽ xuất hiện sau khi làm mới."}</p>
        )}

        <div className="report-workspace" aria-busy={loading}>
          <section className="map-panel" aria-label="Bản đồ báo cáo">
            <div className="map-heading"><span><Icon name="layers" size={17} /> Bản đồ khuôn viên</span><span>Đường phố & địa điểm</span></div>
            <MapView reports={visibleReports} selectedId={selected?.id} onSelect={setSelectedId} />
            <div className="map-legend" aria-label="Chú giải trạng thái">{Object.entries(statusLabels).map(([value, label]) => <span key={value}><i className={`status-dot status-pin-${value.toLowerCase()}`} />{label}</span>)}</div>
          </section>
          <aside className="report-sidebar" aria-label="Danh sách và chi tiết báo cáo">
            <section className="report-list-panel">
              <div className="list-heading"><h3>Báo cáo</h3><span aria-live="polite">{loaded ? `${visibleReports.length} kết quả` : "Đang kết nối"}</span></div>
              <label className="search-box"><Icon name="search" size={18} /><span className="sr-only">Tìm báo cáo</span><input type="search" placeholder="Tìm tên, nội dung sự cố…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
              {loaded && visibleReports.length === 0 && <p className="list-empty">{query ? "Không tìm thấy báo cáo. Thử từ khóa khác hoặc đổi bộ lọc." : "Chưa có báo cáo trong mục này."}</p>}
              <ul className="report-list">
                {visibleReports.map((report) => (
                  <li key={report.id}>
                    <button type="button" className={selected?.id === report.id ? "report-item is-selected" : "report-item"}
                      aria-pressed={selected?.id === report.id} onClick={() => setSelectedId(report.id)}>
                      <span className="report-category">{categoryLabels[report.category]}<Icon name="arrow" size={16} /></span>
                      <strong>{report.title}</strong>
                      <span className={`status-badge status-${report.status.toLowerCase()}`}>{statusLabels[report.status]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section className="report-detail" aria-label="Chi tiết báo cáo">
              <div className="list-heading"><h3>Chi tiết báo cáo</h3>{selected && <button className="close-detail" type="button" aria-label="Đóng chi tiết" onClick={() => setSelectedId(null)}><Icon name="close" size={17} /></button>}</div>
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
              ) : <div className="detail-empty"><Icon name="pin" size={30} /><p>Chọn một vị trí để bắt đầu</p><span>Nhấn vào ghim trên bản đồ hoặc một báo cáo trong danh sách.</span></div>}
            </section>
          </aside>
        </div>
        <footer className="map-footer"><span>Chọn Làm mới để xem các báo cáo và trạng thái mới nhất.</span></footer>
      </main>
    </div>
  );
}
