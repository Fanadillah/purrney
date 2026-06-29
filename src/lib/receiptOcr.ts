export type ReceiptOcrItem = {
  id: string;
  name: string;
  amount: number;
  categoryValue: string;
  selected: boolean;
};

export type ParsedReceipt = {
  merchant: string;
  date: string;
  total: number;
  items: ReceiptOcrItem[];
  rawText: string;
};

const defaultMerchant = "Scanned receipt";
const defaultCategoryValue = "shopping";
const totalKeywords = [
  "grand total",
  "total bayar",
  "total belanja",
  "jumlah",
  "subtotal",
  "total",
  "bayar",
];
const nonItemKeywords = [
  "total",
  "subtotal",
  "grand total",
  "jumlah",
  "bayar",
  "tunai",
  "cash",
  "debit",
  "credit",
  "kartu",
  "qris",
  "ovo",
  "gopay",
  "dana",
  "shopeepay",
  "kembalian",
  "change",
  "pajak",
  "tax",
  "ppn",
  "diskon",
  "discount",
  "promo",
  "service",
  "biaya",
  "admin",
  "member",
  "struk",
  "receipt",
  "kasir",
  "cashier",
  "no.",
  "npwp",
  "telp",
  "phone",
  "alamat",
  "address",
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function formatRupiahInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "";
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseMoney(value: string) {
  const cleaned = value.replace(/[^\d,.]/g, "");
  if (!cleaned) return 0;

  const normalized = cleaned
    .replace(/,/g, ".")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(/[^\d]/g, "");

  return Number(normalized);
}

function extractMoneyValues(line: string) {
  const matches = line.match(/(?:rp\s*)?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{4,}/gi) ?? [];
  return matches
    .map(parseMoney)
    .filter((amount) => Number.isFinite(amount) && amount > 0);
}

function hasLetters(value: string) {
  return /[a-zA-Z]{2,}/.test(value);
}

function looksLikeItemName(line: string) {
  const normalizedLine = line.toLowerCase();
  const cleaned = cleanItemName(line);

  if (!hasLetters(cleaned)) return false;
  if (looksLikeNonItem(normalizedLine)) return false;
  if (parseDateValue(line)) return false;

  return cleaned.length >= 2;
}

function parseDateValue(value: string) {
  const dateMatch = value.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);

  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = dateMatch[2].padStart(2, "0");
    const rawYear = dateMatch[3];
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;

    return `${year}-${month}-${day}`;
  }

  const isoMatch = value.match(/\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/);

  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, "0");
    const day = isoMatch[3].padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return "";
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function looksLikeNonItem(line: string) {
  const normalizedLine = line.toLowerCase();
  return nonItemKeywords.some((keyword) => normalizedLine.includes(keyword));
}

function cleanItemName(line: string) {
  return normalizeWhitespace(
    line
      .replace(/(?:rp\s*)?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?/gi, "")
      .replace(/\d{4,}/g, "")
      .replace(/\b\d+\s*[xX]\s*/g, "")
      .replace(/[@x]\s*\d+/gi, "")
      .replace(/\bpcs?\b|\bqty\b|\bjml\b/gi, "")
      .replace(/[|_*~=]+/g, " ")
  );
}

function extractMerchant(lines: string[]) {
  const merchantLine = lines.find((line) => {
    const normalizedLine = line.toLowerCase();
    const hasEnoughLetters = /[a-zA-Z]{3,}/.test(line);
    const hasMoney = extractMoneyValues(line).length > 0;
    const isDate = Boolean(parseDateValue(line));
    const isNoise = totalKeywords.some((keyword) => normalizedLine.includes(keyword));

    return hasEnoughLetters && !hasMoney && !isDate && !isNoise;
  });

  return merchantLine ? normalizeWhitespace(merchantLine).slice(0, 80) : defaultMerchant;
}

function extractDate(lines: string[]) {
  for (const line of lines) {
    const parsedDate = parseDateValue(line);
    if (parsedDate) return parsedDate;
  }

  return getTodayDate();
}

function extractTotal(lines: string[]) {
  let fallbackTotal = 0;

  for (const line of lines) {
    const amounts = extractMoneyValues(line);
    if (amounts.length > 0) {
      fallbackTotal = Math.max(fallbackTotal, ...amounts);
    }
  }

  for (const line of [...lines].reverse()) {
    const normalizedLine = line.toLowerCase();
    const isTotalLine = totalKeywords.some((keyword) => normalizedLine.includes(keyword));
    const amounts = extractMoneyValues(line);

    if (isTotalLine && amounts.length > 0) {
      return Math.max(...amounts);
    }
  }

  return fallbackTotal;
}

function extractItems(lines: string[]) {
  const items: ReceiptOcrItem[] = [];
  const consumedLineIndexes = new Set<number>();

  lines.forEach((line, index) => {
    const amounts = extractMoneyValues(line);
    const name = cleanItemName(line);

    if (amounts.length === 0 || !name || looksLikeNonItem(line)) {
      return;
    }

    items.push({
      id: `item_${index}_${Math.random().toString(36).slice(2, 8)}`,
      name: name.slice(0, 80),
      amount: amounts[amounts.length - 1],
      categoryValue: defaultCategoryValue,
      selected: true,
    });
    consumedLineIndexes.add(index);
  });

  lines.forEach((line, index) => {
    if (consumedLineIndexes.has(index) || !looksLikeItemName(line)) {
      return;
    }

    const nextLine = lines[index + 1] ?? "";
    const nextNextLine = lines[index + 2] ?? "";
    const nextAmounts = extractMoneyValues(nextLine);
    const nextNextAmounts = extractMoneyValues(nextNextLine);
    const amountLineIndex = nextAmounts.length > 0 ? index + 1 : index + 2;
    const amountCandidates = nextAmounts.length > 0 ? nextAmounts : nextNextAmounts;

    if (
      amountCandidates.length === 0 ||
      consumedLineIndexes.has(amountLineIndex) ||
      looksLikeNonItem(nextLine)
    ) {
      return;
    }

    const name = cleanItemName(line);
    const amount = amountCandidates[amountCandidates.length - 1];

    items.push({
      id: `item_pair_${index}_${Math.random().toString(36).slice(2, 8)}`,
      name: name.slice(0, 80),
      amount,
      categoryValue: defaultCategoryValue,
      selected: true,
    });
    consumedLineIndexes.add(index);
    consumedLineIndexes.add(amountLineIndex);
  });

  return items;
}

export function getParsedReceiptScore(receipt: ParsedReceipt) {
  const hasMerchant = receipt.merchant !== defaultMerchant ? 15 : 0;
  const hasTotal = receipt.total > 0 ? 30 : 0;
  const hasDate = receipt.date ? 10 : 0;
  const itemScore = Math.min(receipt.items.length * 12, 72);
  const selectedItemsTotal = receipt.items.reduce((sum, item) => sum + item.amount, 0);
  const totalMatchBonus =
    receipt.total > 0 && selectedItemsTotal > 0
      ? Math.max(0, 20 - Math.abs(selectedItemsTotal - receipt.total) / receipt.total * 20)
      : 0;

  return hasMerchant + hasTotal + hasDate + itemScore + totalMatchBonus;
}

export function parseReceiptOcrText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map(normalizeWhitespace)
    .filter(Boolean);

  return {
    merchant: extractMerchant(lines),
    date: extractDate(lines),
    total: extractTotal(lines),
    items: extractItems(lines),
    rawText,
  };
}
