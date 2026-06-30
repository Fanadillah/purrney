import { NextResponse } from "next/server";
import { GeminiReceiptOcrError, extractReceiptWithGemini } from "@/lib/geminiReceiptOcr";

export const runtime = "nodejs";

const maxReceiptImageBytes = 4 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function isAllowedImageType(type: string) {
  return allowedImageTypes.has(type);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { message: "Upload gambar struk tidak ditemukan." },
        { status: 400 }
      );
    }

    if (!isAllowedImageType(image.type)) {
      return NextResponse.json(
        { message: "Format gambar belum didukung. Gunakan JPG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    if (image.size > maxReceiptImageBytes) {
      return NextResponse.json(
        { message: "Gambar struk terlalu besar. Coba foto ulang atau kompres gambar." },
        { status: 413 }
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const receipt = await extractReceiptWithGemini({
      imageBase64: imageBuffer.toString("base64"),
      mimeType: image.type,
    });

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Gemini receipt OCR failed:", error);

    if (error instanceof GeminiReceiptOcrError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "Gagal memindai struk. Coba lagi sebentar." },
      { status: 500 }
    );
  }
}
