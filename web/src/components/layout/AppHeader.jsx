import Icon from "../Icon";

export default function AppHeader() {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-symbol"><Icon name="pin" size={25} /></span>
        <div>
        <h1>MapLab</h1>
        <p>Quản lý sự cố trong khuôn viên</p>
        </div>
      </div>
      <span className="data-badge"><span /> Không gian quản lý</span>
    </header>
  );
}
