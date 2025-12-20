// src/services/admin/AdminBookingFromCampaignAPI.js
import dayjs from "dayjs";
import { post, update } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

const CREATE_PATH = API_PATHS.BOOKING_CAMPAIGN.create;

const buildEditUrl = (bookingRequestId) => {
  const builder = API_PATHS?.BOOKING_CAMPAIGN?.edit;
  if (typeof builder === "function") return builder(bookingRequestId);
  return `/v1/admin/bookings/edit/${encodeURIComponent(bookingRequestId)}`;
};

/* ===================== Helpers ===================== */

const isFileLike = (v) =>
  (typeof File !== "undefined" && v instanceof File) ||
  (typeof Blob !== "undefined" && v instanceof Blob);

const toISO = (v) => {
  if (!v) return undefined;

  // dayjs / antd date obj
  if (v && typeof v.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime())
      ? d.toISOString()
      : undefined;
  }

  if (v instanceof Date && !Number.isNaN(v.getTime?.())) return v.toISOString();

  if (typeof v === "string") {
    const d0 = dayjs(v);
    if (d0.isValid()) return d0.toISOString();

    const cutAtZ = v.includes("Z") ? v.slice(0, v.indexOf("Z") + 1) : v;
    const cleaned = cutAtZ.replace(/[^0-9T:.Z-]/g, "");
    const d1 = dayjs(cleaned);
    if (d1.isValid()) return d1.toISOString();
  }

  return undefined;
};

const toYmd = (v) => {
  if (!v) return undefined;
  const d = dayjs(v);
  return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
};

const toAmountNumber = (v) => {
  if (v == null || v === "") return undefined;
  const n =
    typeof v === "number" ? v : Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
};

// số thập phân (giờ live / % giảm)
const toFloatNumber = (v) => {
  if (v == null || v === "") return undefined;
  const s = String(v).replace(/,/g, ".").trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const toIdArray = (v) => {
  if (!v) return undefined;
  const arr = Array.isArray(v) ? v : [v];

  const ids = arr
    .flatMap((item) => {
      if (item == null) return [];
      if (typeof item === "string" || typeof item === "number")
        return [String(item).trim()];
      if (typeof item === "object") {
        const candidate = item.value ?? item.id ?? item.key;
        return candidate ? [String(candidate).trim()] : [];
      }
      return [String(item).trim()];
    })
    .filter(Boolean);

  return ids.length ? Array.from(new Set(ids)) : undefined;
};

/** Lấy file thật từ antd Upload fileList */
const pickFilesFromUploadList = (v) => {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : [v];

  return arr.map((it) => it?.originFileObj ?? it).filter((x) => isFileLike(x));
};

/** Lấy tên file từ Upload fileList / array string */
const pickNamesFromUploadList = (v) => {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : [v];

  const names = arr
    .flatMap((it) => {
      if (it == null) return [];
      if (typeof it === "string") return [it.trim()].filter(Boolean);
      if (typeof it === "object") {
        const name =
          it?.name ||
          it?.filename ||
          it?.originalName ||
          it?.originFileObj?.name;
        return name ? [String(name).trim()] : [];
      }
      return [];
    })
    .filter(Boolean);

  return names.length ? Array.from(new Set(names)) : [];
};

const stripEmpty = (raw) =>
  Object.entries(raw).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    if (typeof value === "string" && value.trim() === "") return acc;
    if (Array.isArray(value) && value.length === 0) return acc;
    acc[key] = value;
    return acc;
  }, {});

/**
 * ✅ Append FormData:
 * - Với array: append cả 2 kiểu key và key[] để tương thích nhiều BE binder
 */
const appendFormValue = (fd, key, value) => {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    const cleaned = value.map((v) => String(v ?? "").trim()).filter(Boolean);

    // kiểu 1: kolIds=1 & kolIds=2 ...
    cleaned.forEach((v) => fd.append(key, v));
    // kiểu 2: kolIds[]=1 & kolIds[]=2 ...
    cleaned.forEach((v) => fd.append(`${key}[]`, v));
    return;
  }

  fd.append(key, String(value));
};

/** Gỡ Content-Type json (nếu axios instance set default), để browser tự set boundary */
const sanitizeMultipartConfig = (cfg = {}) => {
  const headers = { ...(cfg.headers || {}) };
  delete headers["Content-Type"];
  delete headers["content-type"];
  return { ...cfg, headers };
};

/**
 * Build request payload:
 * - forceMultipart=true -> luôn gửi multipart/form-data
 * - Nếu không force: có file -> multipart, không file -> JSON
 */
const buildDataAndConfig = (
  payload,
  { signal, forceMultipart = false } = {}
) => {
  const contractFile = payload?.contractFile;
  const attachmentFiles = pickFilesFromUploadList(payload?.attachments);

  const needsMultipart =
    forceMultipart || isFileLike(contractFile) || attachmentFiles.length > 0;

  // JSON
  if (!needsMultipart) {
    return {
      data: payload,
      config: signal ? { signal } : undefined,
    };
  }

  const fd = new FormData();

  // append all normal fields (string/number/arrays)
  Object.entries(payload).forEach(([k, v]) => {
    if (k === "contractFile" || k === "attachments") return;
    appendFormValue(fd, k, v);
  });

  // contract file (nếu là file)
  if (isFileLike(contractFile)) {
    fd.append("contractFile", contractFile);
  } else if (typeof contractFile === "string" && contractFile.trim()) {
    // nếu BE cho phép gửi URL contractFile dạng string trong multipart
    fd.append("contractFile", contractFile.trim());
  }

  /**
   * ✅ Swagger đang là: attachment (binary)
   * -> gửi tất cả file theo key "attachment"
   * (kèm backward compatible "attachments" nếu BE còn đọc)
   */
  attachmentFiles.forEach((f) => fd.append("attachment", f));
  attachmentFiles.forEach((f) => fd.append("attachments", f));

  const baseCfg = signal ? { signal } : undefined;
  return {
    data: fd,
    config: sanitizeMultipartConfig(baseCfg),
  };
};

/* ===================== APIs ===================== */

/** POST /v1/admin/bookings/create */
export const adminCreateBookingFromCampaign = async (
  body = {},
  { signal } = {}
) => {
  const attachmentNames =
    pickNamesFromUploadList(body?.attachmentNames) ||
    pickNamesFromUploadList(body?.attachments);

  const attachmentName =
    body?.attachmentName ||
    (attachmentNames?.length ? attachmentNames.join(" | ") : undefined);

  // ✅ NEW: livestreamAddress
  const livestreamAddress =
    body?.livestreamAddress ??
    body?.liveStreamAddress ??
    body?.livestream_address ??
    body?.live_address;

  const raw = {
    campaignId: body?.campaignId,
    description: body?.description,
    status: body?.status, // optional

    // ✅ NEW
    livestreamAddress,

    repeatType: body?.repeatType,
    dayOfWeek: body?.dayOfWeek,

    startAt: toISO(body?.startAt),
    endAt: toISO(body?.endAt),
    repeatUntil: toYmd(body?.repeatUntil),
    contractAmount: toAmountNumber(body?.contractAmount),

    kolIds: toIdArray(body?.kolIds),
    liveIds: toIdArray(body?.liveIds),

    // ✅ match Swagger: hours, discount
    hours: toFloatNumber(body?.liveHours ?? body?.hours),
    unitPrice: toAmountNumber(body?.unitPrice),
    discount: toFloatNumber(body?.discountPercent ?? body?.discount),
    totalAmount: toAmountNumber(body?.totalAmount),

    // attachments meta (optional)
    attachmentName,
    attachmentNames,

    // attachments (Upload fileList)
    attachments: body?.attachments,
  };

  if (!raw.campaignId) throw new Error("campaignId is required");

  const payload = stripEmpty(raw);

  // ✅ FIX: API này KHÔNG nhận JSON -> luôn multipart
  const { data, config } = buildDataAndConfig(payload, {
    signal,
    forceMultipart: true,
  });

  const res = await post({
    url: CREATE_PATH,
    data,
    config,
  });

  const out = res?.data ?? res ?? null;

  // ✅ GHI ĐÈ message BE trả về
  if (out && Array.isArray(out.message)) {
    out.message = ["Tạo booking request thành công"];
  } else if (out && out.message) {
    out.message = ["Tạo booking request thành công"];
  } else if (out) {
    out.message = ["Tạo booking request thành công"];
  }

  return out;
};

/** PUT /v1/admin/bookings/edit/{bookingRequestId} */
export const adminEditBookingRequest = async (
  bookingRequestId,
  body = {},
  { signal } = {}
) => {
  if (!bookingRequestId) throw new Error("bookingRequestId is required");

  const attachmentNames =
    pickNamesFromUploadList(body?.attachmentNames) ||
    pickNamesFromUploadList(body?.attachments);

  const attachmentName =
    body?.attachmentName ||
    (attachmentNames?.length ? attachmentNames.join(" | ") : undefined);

  // ✅ NEW: livestreamAddress
  const livestreamAddress =
    body?.livestreamAddress ??
    body?.liveStreamAddress ??
    body?.livestream_address ??
    body?.live_address;

  const raw = {
    description: body?.description,

    // ✅ NEW
    livestreamAddress,

    repeatType: body?.repeatType,
    dayOfWeek: body?.dayOfWeek,

    startAt: toISO(body?.startAt),
    endAt: toISO(body?.endAt),
    repeatUntil: toYmd(body?.repeatUntil),
    contractAmount: toAmountNumber(body?.contractAmount),

    contractFile: body?.contractFile,

    kolIds: toIdArray(body?.kolIds),
    liveIds: toIdArray(body?.liveIds),

    // ✅ match Swagger: hours, discount
    hours: toFloatNumber(body?.liveHours ?? body?.hours),
    unitPrice: toAmountNumber(body?.unitPrice),
    discount: toFloatNumber(body?.discountPercent ?? body?.discount),
    totalAmount: toAmountNumber(body?.totalAmount),

    // attachments meta
    attachmentName,
    attachmentNames,

    // attachments
    attachments: body?.attachments,
  };

  const payload = stripEmpty(raw);

  // Nếu BE edit cũng chỉ nhận multipart thì bật forceMultipart=true luôn cho chắc
  const { data, config } = buildDataAndConfig(payload, {
    signal,
    forceMultipart: true,
  });

  const res = await update({
    url: buildEditUrl(bookingRequestId),
    data,
    config,
  });

  return res?.data ?? res ?? null;
};
