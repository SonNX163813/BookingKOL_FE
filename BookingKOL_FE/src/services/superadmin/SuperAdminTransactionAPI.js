import { get } from "../../config/axios-config";
import { API_PATHS_SUPERADMIN } from "../../constants/apiPathSuperAdmin";

const ensureNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureString = (value, fallback = "") => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeStats = (stats) => {
  const safeStats = stats && typeof stats === "object" ? stats : {};
  return {
    totalTransactions: ensureNumber(safeStats.totalTransactions),
    completedCount: ensureNumber(safeStats.completedCount),
    failedCount: ensureNumber(safeStats.failedCount),
    orphanedCount: ensureNumber(safeStats.orphanedCount),
    totalAmountIn: ensureNumber(safeStats.totalAmountIn),
    startDate: safeStats.startDate ?? null,
    endDate: safeStats.endDate ?? null,
  };
};

const normalizeTransaction = (transaction = {}) => ({
  id: transaction.id ?? null,
  gateway: ensureString(transaction.gateway),
  transactionDate: transaction.transactionDate ?? null,
  accountNumber: ensureString(transaction.accountNumber),
  subAccount: ensureString(transaction.subAccount),
  amountIn: ensureNumber(transaction.amountIn),
  amountOut: ensureNumber(transaction.amountOut),
  accumulated: ensureNumber(transaction.accumulated),
  code: transaction.code ?? null,
  transactionContent: ensureString(transaction.transactionContent),
  referenceNumber: ensureString(transaction.referenceNumber),
  body: ensureString(transaction.body),
  createdAt: transaction.createdAt ?? null,
  status: ensureString(transaction.status),
  paymentId: transaction.paymentId ?? null,
});

const normalizeTransactionsPage = (payload) => {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const content = ensureArray(safePayload.content).map(normalizeTransaction);
  const totalElements = ensureNumber(safePayload.totalElements);
  const totalPages = ensureNumber(safePayload.totalPages);
  const pageNumber = ensureNumber(
    safePayload.number ?? safePayload.pageNumber ?? 0
  );
  const pageSize = ensureNumber(
    (safePayload.size ?? safePayload.pageSize ?? content.length) || 10
  );

  const numberOfElements = ensureNumber(
    safePayload.numberOfElements ?? content.length
  );

  return {
    content,
    totalElements,
    totalPages,
    pageNumber,
    pageSize,
    numberOfElements,
    first:
      typeof safePayload.first === "boolean"
        ? safePayload.first
        : pageNumber <= 0,
    last:
      typeof safePayload.last === "boolean"
        ? safePayload.last
        : totalPages > 0
        ? pageNumber >= totalPages - 1
        : false,
  };
};

export const getSuperAdminTransactions = async ({
  page = 0,
  size = 10,
  status,
  search,
  startDate,
  endDate,
  signal,
} = {}) => {
  const params = { page, size };

  if (status && status !== "ALL") {
    params.status = status;
  }

  if (typeof search === "string" && search.trim()) {
    params.search = search.trim();
  }

  if (startDate) {
    params.startDate = startDate;
  }

  if (endDate) {
    params.endDate = endDate;
  }

  const payload = await get({
    url: API_PATHS_SUPERADMIN.TRANSACTION.getAll,
    params,
    config: signal ? { signal } : undefined,
  });

  const container = payload?.data ?? payload ?? {};
  const dataNode = container?.data ?? container;

  return {
    stats: normalizeStats(dataNode?.stats),
    transactionsPage: normalizeTransactionsPage(dataNode?.transactions),
  };
};

export const getSuperAdminTransactionDetail = async ({
  transactionId,
  signal,
} = {}) => {
  if (transactionId === null || transactionId === undefined) {
    throw new Error("transactionId is required");
  }

  const payload = await get({
    url: `${API_PATHS_SUPERADMIN.TRANSACTION.getDetail}/${encodeURIComponent(
      transactionId
    )}`,
    config: signal ? { signal } : undefined,
  });

  const container = payload?.data ?? payload ?? {};
  const dataNode = container?.data ?? container;

  return normalizeTransaction(dataNode);
};

export default getSuperAdminTransactions;
