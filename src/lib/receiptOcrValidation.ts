import type {
  GeminiReceiptOcrPayload,
  ReceiptOcrApiItem,
  ReceiptOcrApiResponse,
} from "./receiptOcrSchema";

const defaultMerchant = "Scanned receipt";
const defaultCategoryValue = "shopping";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toSafeString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function toOptionalPositiveNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function toPositiveNumber(value: unknown) {
  return toOptionalPositiveNumber(value) ?? 0;
}

function toConfidence(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.round(clamp(parsed, 0, 100)) : 0;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function normalizeDate(value: unknown) {
  const rawDate = toSafeString(value, 24);

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate;
  }

  const slashDate = rawDate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashDate) {
    const day = slashDate[1].padStart(2, "0");
    const month = slashDate[2].padStart(2, "0");
    const rawYear = slashDate[3];
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;

    return `${year}-${month}-${day}`;
  }

  return getTodayDate();
}

function normalizeWarnings(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((warning) => toSafeString(warning, 180))
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeItems(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): ReceiptOcrApiItem | null => {
      if (!item || typeof item !== "object") return null;

      const itemRecord = item as Record<string, unknown>;
      const name = toSafeString(itemRecord.name, 80);
      const amount = toPositiveNumber(itemRecord.amount);

      if (!name || amount <= 0) {
        return null;
      }

      return {
        name,
        quantity: toOptionalPositiveNumber(itemRecord.quantity),
        unitPrice: toOptionalPositiveNumber(itemRecord.unitPrice),
        amount,
        categoryValue: defaultCategoryValue,
        selected: true,
        confidence: toConfidence(itemRecord.confidence) || 50,
      };
    })
    .filter((item): item is ReceiptOcrApiItem => Boolean(item))
    .slice(0, 80);
}

export function normalizeGeminiReceiptOcrPayload(
  payload: GeminiReceiptOcrPayload
): ReceiptOcrApiResponse {
  const items = normalizeItems(payload.items);
  const itemTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const parsedTotal = toPositiveNumber(payload.total);
  const total = parsedTotal > 0 ? parsedTotal : itemTotal;
  const warnings = normalizeWarnings(payload.warnings);

  if (total > 0 && itemTotal > 0) {
    const difference = Math.abs(itemTotal - total);
    if (difference / total > 0.1) {
      warnings.push(
        "Total item berbeda cukup jauh dari total struk. Cek pajak, diskon, atau item yang salah terbaca."
      );
    }
  }

  if (items.length === 0) {
    warnings.push("Tidak ada item yang terbaca jelas. Kamu masih bisa menyimpan total struk.");
  }

  return {
    merchant: toSafeString(payload.merchant, 80) || defaultMerchant,
    date: normalizeDate(payload.date),
    total,
    currency: "IDR",
    paymentMethod: toSafeString(payload.paymentMethod, 50),
    items,
    tax: toOptionalPositiveNumber(payload.tax),
    discount: toOptionalPositiveNumber(payload.discount),
    serviceCharge: toOptionalPositiveNumber(payload.serviceCharge),
    rawText: toSafeString(payload.rawText, 1200),
    warnings: Array.from(new Set(warnings)).slice(0, 8),
    confidence: toConfidence(payload.confidence) || (items.length > 0 || total > 0 ? 60 : 30),
  };
}
