import { normalizeGeminiReceiptOcrPayload } from "./receiptOcrValidation";
import type { GeminiReceiptOcrPayload, ReceiptOcrApiResponse } from "./receiptOcrSchema";

const geminiApiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
const defaultGeminiReceiptOcrModel = "gemini-3.1-flash-lite";
const fallbackGeminiReceiptOcrModels = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
];
const geminiRequestTimeoutMs = 30000;

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export class GeminiReceiptOcrError extends Error {
  status: number;

  constructor({ message, status }: { message: string; status: number }) {
    super(message);
    this.name = "GeminiReceiptOcrError";
    this.status = status;
  }
}

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY?.trim() ?? "";
}

function getGeminiModel() {
  return process.env.GEMINI_RECEIPT_OCR_MODEL?.trim() || defaultGeminiReceiptOcrModel;
}

function getGeminiModelCandidates() {
  const configuredModels =
    process.env.GEMINI_RECEIPT_OCR_FALLBACK_MODELS
      ?.split(",")
      .map((model) => model.trim())
      .filter(Boolean) ?? [];

  return Array.from(
    new Set([getGeminiModel(), ...configuredModels, ...fallbackGeminiReceiptOcrModels])
  );
}

function stripJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function parseGeminiJson(text: string) {
  const cleanedText = stripJsonFence(text);
  const jsonStart = cleanedText.indexOf("{");
  const jsonEnd = cleanedText.lastIndexOf("}");

  if (jsonStart < 0 || jsonEnd < jsonStart) {
    throw new GeminiReceiptOcrError({
      status: 502,
      message: "AI belum bisa membaca struk ini. Coba foto ulang dengan cahaya lebih terang.",
    });
  }

  try {
    return JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1)) as GeminiReceiptOcrPayload;
  } catch {
    throw new GeminiReceiptOcrError({
      status: 502,
      message: "AI belum bisa membaca struk ini. Coba foto ulang dengan cahaya lebih terang.",
    });
  }
}

async function parseGeminiError(response: Response) {
  try {
    const payload = await response.json();
    const message =
      typeof payload?.error?.message === "string" ? payload.error.message : response.statusText;

    return message;
  } catch {
    return response.statusText;
  }
}

function isRetryableGeminiStatus(status: number) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function getRetryDelayMs(attempt: number) {
  return 700 * (attempt + 1);
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestGeminiReceiptOcr({
  imageBase64,
  mimeType,
  model,
}: {
  imageBase64: string;
  mimeType: string;
  model: string;
}) {
  const apiKey = getGeminiApiKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), geminiRequestTimeoutMs);
  const url = `${geminiApiBaseUrl}/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are an OCR and structured data extraction engine for Indonesian receipts. " +
                "Return only valid JSON. Do not include markdown. Use IDR integer amounts without separators. " +
                "If a field is not visible, use null or an empty string. Never invent missing items.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  "Extract this receipt into JSON with fields: merchant, date, total, currency, " +
                  "paymentMethod, items, tax, discount, serviceCharge, rawText, warnings, confidence. " +
                  "Use date format YYYY-MM-DD when visible. items must contain name, quantity, unitPrice, amount, confidence. " +
                  "Amounts must be integer rupiah. Exclude subtotal, total, cash, change, payment method, cashier, address, phone, and receipt number from items. " +
                  "Set confidence from 0 to 100.",
              },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const apiMessage = await parseGeminiError(response);

      if (response.status === 429) {
        throw new GeminiReceiptOcrError({
          status: 429,
          message: "Batas scan AI gratis sedang tercapai. Coba lagi nanti.",
        });
      }

      if (response.status === 503) {
        throw new GeminiReceiptOcrError({
          status: 503,
          message: "Model AI OCR sedang ramai. Purrney akan mencoba model lain jika tersedia.",
        });
      }

      throw new GeminiReceiptOcrError({
        status: response.status,
        message: `Gemini OCR failed: ${apiMessage}`,
      });
    }

    const payload = (await response.json()) as GeminiGenerateContentResponse;
    const responseText =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim() ?? "";

    if (!responseText) {
      throw new GeminiReceiptOcrError({
        status: 502,
        message: "AI belum mengembalikan hasil scan. Coba foto ulang struk.",
      });
    }

    return normalizeGeminiReceiptOcrPayload(parseGeminiJson(responseText));
  } catch (error) {
    if (error instanceof GeminiReceiptOcrError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new GeminiReceiptOcrError({
        status: 504,
        message: "Proses scan terlalu lama. Coba foto ulang atau gunakan gambar yang lebih kecil.",
      });
    }

    throw new GeminiReceiptOcrError({
      status: 500,
      message: "Gagal menghubungi AI OCR. Coba lagi sebentar.",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractReceiptWithGemini({
  imageBase64,
  mimeType,
}: {
  imageBase64: string;
  mimeType: string;
}): Promise<ReceiptOcrApiResponse> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new GeminiReceiptOcrError({
      status: 500,
      message: "Fitur AI OCR belum dikonfigurasi.",
    });
  }

  let lastError: GeminiReceiptOcrError | null = null;

  for (const model of getGeminiModelCandidates()) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await requestGeminiReceiptOcr({ imageBase64, mimeType, model });
      } catch (error) {
        if (!(error instanceof GeminiReceiptOcrError)) {
          throw error;
        }

        lastError = error;

        if (!isRetryableGeminiStatus(error.status)) {
          throw error;
        }

        if (attempt === 0) {
          await wait(getRetryDelayMs(attempt));
        }
      }
    }
  }

  if (lastError?.status === 503) {
    throw new GeminiReceiptOcrError({
      status: 503,
      message: "AI OCR sedang ramai. Coba lagi beberapa saat lagi atau input manual dulu.",
    });
  }

  throw (
    lastError ??
    new GeminiReceiptOcrError({
      status: 500,
      message: "Gagal memindai struk. Coba lagi sebentar.",
    })
  );
}
