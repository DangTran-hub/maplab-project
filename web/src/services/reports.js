const apiUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${apiUrl}${path}`, options);
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Không kết nối được API. Kiểm tra backend và mạng rồi thử lại.", { cause: error });
  }
  let data;
  try { data = await response.json(); } catch {
    throw new Error("API trả về dữ liệu không hợp lệ. Kiểm tra cấu hình địa chỉ API.");
  }
  if (!response.ok) {
    if (response.status === 404) throw new Error("Báo cáo không còn tồn tại. Hãy làm mới danh sách.");
    if (response.status === 400) throw new Error("Trạng thái không còn phù hợp. Hãy làm mới báo cáo rồi thử lại.");
    throw new Error("API chưa xử lý được yêu cầu. Vui lòng thử lại.");
  }
  return data;
}

export async function listReports(signal) {
  const reports = await request("/reports", { signal });
  if (!Array.isArray(reports)) throw new Error("API không trả về danh sách báo cáo hợp lệ.");
  return reports;
}

export function updateReportStatus(id, status) {
  return request(`/reports/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
