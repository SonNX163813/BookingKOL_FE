// src/services/admin/AdminContractPaymentAPI.js
import dayjs from "dayjs";
import { post } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

const CREATE_PAYMENT_PATH = API_PATHS.CONTRACT_PAYMENT.create;

/** yyyy-MM-dd */
const toYmd = (v) => {
  if (!v) return undefined;
  if (dayjs.isDayjs(v)) {
    return v.format("YYYY-MM-DD");
  }
  const d = dayjs(v);
  return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
};

/** Parse amount từ: number | "1,000,000" | "1000000" -> number | undefined */
const toAmount = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "number") {
    return Number.isFinite(v) ? v : undefined;
  }
  const raw = String(v).replace(/,/g, "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Tạo lịch thanh toán hợp đồng
 * POST /v1/admin/contracts/payments/create
 *
 * Expect:
 * {
 *   contractId: string,
 *   bookingRequestId: string, // = Campaign ID theo yêu cầu bạn
 *   totalInstallments: number,
 *   installments: [{ amount, dueDate }]
 * }
 */
export const adminCreateContractPayments = async (
  body = {},
  { signal } = {}
) => {
  const contractId = body.contractId?.trim?.() || body.contractId;
  const bookingRequestId =
    body.bookingRequestId?.trim?.() || body.bookingRequestId;

  if (!contractId) throw new Error("contractId is required");
  if (!bookingRequestId) throw new Error("bookingRequestId is required");

  const rawInstallments = Array.isArray(body.installments)
    ? body.installments
    : [];

  const installments = rawInstallments
    .map((item) => {
      const amount = toAmount(item?.amount);
      const dueDate = toYmd(item?.dueDate);

      if (!amount || !dueDate) return null;
      return { amount, dueDate };
    })
    .filter(Boolean);

  if (!installments.length) {
    throw new Error("At least one valid installment is required");
  }

  let totalInstallments = Number(
    String(body.totalInstallments ?? "").replace(/\D/g, "")
  );
  if (!Number.isFinite(totalInstallments) || totalInstallments <= 0) {
    totalInstallments = installments.length;
  }

  const payload = {
    contractId,
    bookingRequestId,
    totalInstallments,
    installments,
  };

  const res = await post({
    url: CREATE_PAYMENT_PATH,
    data: payload,
    config: signal ? { signal } : undefined,
  });

  return res?.data ?? res ?? null;
};
