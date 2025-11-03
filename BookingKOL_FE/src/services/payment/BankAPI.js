import { get } from "../../config/axios-config";

const BANK_LIST_ENDPOINT = "https://api.vietqr.io/v2/banks";

const normalizeBank = (bank) => {
  if (!bank || typeof bank !== "object") {
    return null;
  }

  const name =
    typeof bank.name === "string" && bank.name.trim().length > 0
      ? bank.name.trim()
      : typeof bank.bankName === "string"
      ? bank.bankName.trim()
      : "";

  const shortName =
    typeof bank.shortName === "string" && bank.shortName.trim().length > 0
      ? bank.shortName.trim()
      : typeof bank.short_name === "string"
      ? bank.short_name.trim()
      : "";

  const code =
    typeof bank.code === "string" && bank.code.trim().length > 0
      ? bank.code.trim()
      : typeof bank.bankCode === "string"
      ? bank.bankCode.trim()
      : "";

  if (!name) {
    return null;
  }

  return {
    id:
      typeof bank.id === "number" || typeof bank.id === "string"
        ? bank.id
        : code || name,
    name,
    shortName,
    code,
    logo:
      typeof bank.logo === "string" && bank.logo.trim().length > 0
        ? bank.logo.trim()
        : "",
    bin:
      typeof bank.bin === "string" && bank.bin.trim().length > 0
        ? bank.bin.trim()
        : "",
  };
};

export const getBankList = async () => {
  const payload = await get({
    url: BANK_LIST_ENDPOINT,
  });

  const rawBanks = Array.isArray(payload?.data) ? payload.data : [];

  return rawBanks
    .map((item) => normalizeBank(item))
    .filter((item) => item !== null);
};

