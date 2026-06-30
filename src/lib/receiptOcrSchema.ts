export type ReceiptOcrApiItem = {
  name: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number;
  categoryValue: string;
  selected: boolean;
  confidence: number;
};

export type ReceiptOcrApiResponse = {
  merchant: string;
  date: string;
  total: number;
  currency: "IDR";
  paymentMethod: string;
  items: ReceiptOcrApiItem[];
  tax: number | null;
  discount: number | null;
  serviceCharge: number | null;
  rawText: string;
  warnings: string[];
  confidence: number;
};

export type GeminiReceiptOcrPayload = {
  merchant?: unknown;
  date?: unknown;
  total?: unknown;
  currency?: unknown;
  paymentMethod?: unknown;
  items?: unknown;
  tax?: unknown;
  discount?: unknown;
  serviceCharge?: unknown;
  rawText?: unknown;
  warnings?: unknown;
  confidence?: unknown;
};
