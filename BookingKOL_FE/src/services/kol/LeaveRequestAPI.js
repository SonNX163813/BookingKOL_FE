// src/services/kol/LeaveRequestAPI.js
import { get, post } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

// POST /leave-requests/{kolId}/{availabilityId}?reason=
export function createKolLeaveRequest({ kolId, availabilityId, reason }) {
  const url = CLIENT_API_PATHS.LEAVE_REQUESTS.create(
    kolId,
    availabilityId,
    reason
  );

  if (!url) {
    throw new Error(
      "LEAVE_REQUESTS.create trả về URL rỗng. Kiểm tra CLIENT_API_PATHS."
    );
  }

  if (import.meta?.env?.DEV) console.log("[POST] leave-request:", url);

  // ✅ Dùng đúng signature của post({ url, data, config })
  return post({
    url,
    data: {}, // body trống theo swagger
    config: { headers: { "Content-Type": "application/json" } },
  });
}

// GET /leave-requests/kol/my-leaves?page=&size=&keyword=
export function getMyLeaveRequests({ page = 0, size = 10, keyword = "" } = {}) {
  const params = { page, size };
  if (keyword) params.keyword = keyword;

  const url = CLIENT_API_PATHS.LEAVE_REQUESTS.myLeaves;

  if (import.meta?.env?.DEV) console.log("[GET] my-leaves:", url, params);

  // ✅ Dùng đúng signature của get({ url, params, config })
  return get({
    url,
    params,
  });
}
