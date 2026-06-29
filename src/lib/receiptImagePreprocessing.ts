export type PreprocessedReceiptImage = {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  label: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTargetWidth(width: number) {
  if (width < 900) return Math.round(width * 1.8);
  if (width < 1300) return Math.round(width * 1.35);
  return Math.min(width, 1800);
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Failed to prepare receipt image for OCR."));
      },
      "image/png",
      0.95
    );
  });
}

function imageDataToCanvas(imageData: ImageData) {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not supported on this device.");
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

function buildIntegralImage(values: Uint8ClampedArray, width: number, height: number) {
  const integral = new Uint32Array((width + 1) * (height + 1));

  for (let y = 1; y <= height; y += 1) {
    let rowSum = 0;
    for (let x = 1; x <= width; x += 1) {
      rowSum += values[(y - 1) * width + (x - 1)];
      integral[y * (width + 1) + x] =
        integral[(y - 1) * (width + 1) + x] + rowSum;
    }
  }

  return integral;
}

function getAreaSum({
  integral,
  width,
  x1,
  y1,
  x2,
  y2,
}: {
  integral: Uint32Array;
  width: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  const stride = width + 1;
  return (
    integral[(y2 + 1) * stride + (x2 + 1)] -
    integral[y1 * stride + (x2 + 1)] -
    integral[(y2 + 1) * stride + x1] +
    integral[y1 * stride + x1]
  );
}

function enhanceGrayscaleImageData(imageData: ImageData) {
  const { width, height, data } = imageData;
  const grayscale = new Uint8ClampedArray(width * height);
  const output = new ImageData(width, height);
  const contrast = 1.35;
  const brightness = 12;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const adjusted = clamp((gray - 128) * contrast + 128 + brightness, 0, 255);
    const outputIndex = index;

    grayscale[index / 4] = adjusted;
    output.data[outputIndex] = adjusted;
    output.data[outputIndex + 1] = adjusted;
    output.data[outputIndex + 2] = adjusted;
    output.data[outputIndex + 3] = 255;
  }

  return { imageData: output, grayscale };
}

function adaptiveThresholdImageData(imageData: ImageData) {
  const { width, height } = imageData;
  const { grayscale } = enhanceGrayscaleImageData(imageData);
  const sharpened = new Uint8ClampedArray(width * height);
  const output = new ImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;

      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        sharpened[index] = grayscale[index];
        continue;
      }

      const center = grayscale[index] * 5;
      const neighbors =
        grayscale[index - 1] +
        grayscale[index + 1] +
        grayscale[index - width] +
        grayscale[index + width];
      sharpened[index] = clamp(center - neighbors, 0, 255);
    }
  }

  const integral = buildIntegralImage(sharpened, width, height);
  const windowRadius = Math.max(12, Math.round(Math.min(width, height) / 55));
  const thresholdOffset = 11;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const x1 = Math.max(0, x - windowRadius);
      const y1 = Math.max(0, y - windowRadius);
      const x2 = Math.min(width - 1, x + windowRadius);
      const y2 = Math.min(height - 1, y + windowRadius);
      const area = (x2 - x1 + 1) * (y2 - y1 + 1);
      const mean = getAreaSum({ integral, width, x1, y1, x2, y2 }) / area;
      const value = sharpened[y * width + x] < mean - thresholdOffset ? 0 : 255;
      const outputIndex = (y * width + x) * 4;

      output.data[outputIndex] = value;
      output.data[outputIndex + 1] = value;
      output.data[outputIndex + 2] = value;
      output.data[outputIndex + 3] = 255;
    }
  }

  return output;
}

function otsuThresholdImageData(imageData: ImageData) {
  const { width, height } = imageData;
  const { grayscale } = enhanceGrayscaleImageData(imageData);
  const output = new ImageData(width, height);
  const histogram = new Uint32Array(256);
  const totalPixels = width * height;

  grayscale.forEach((value) => {
    histogram[value] += 1;
  });

  let sum = 0;
  for (let index = 0; index < histogram.length; index += 1) {
    sum += index * histogram[index];
  }

  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let index = 0; index < histogram.length; index += 1) {
    weightBackground += histogram[index];
    if (weightBackground === 0) continue;

    const weightForeground = totalPixels - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += index * histogram[index];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const variance =
      weightBackground *
      weightForeground *
      (meanBackground - meanForeground) *
      (meanBackground - meanForeground);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = index;
    }
  }

  for (let index = 0; index < grayscale.length; index += 1) {
    const value = grayscale[index] < threshold ? 0 : 255;
    const outputIndex = index * 4;
    output.data[outputIndex] = value;
    output.data[outputIndex + 1] = value;
    output.data[outputIndex + 2] = value;
    output.data[outputIndex + 3] = 255;
  }

  return output;
}

async function buildPreprocessedVariant({
  label,
  imageData,
}: {
  label: string;
  imageData: ImageData;
}): Promise<PreprocessedReceiptImage> {
  const canvas = imageDataToCanvas(imageData);
  const blob = await canvasToBlob(canvas);

  return {
    blob,
    dataUrl: canvas.toDataURL("image/png"),
    width: imageData.width,
    height: imageData.height,
    label,
  };
}

export async function preprocessReceiptImages(file: File): Promise<PreprocessedReceiptImage[]> {
  const bitmap = await createImageBitmap(file);
  const targetWidth = getTargetWidth(bitmap.width);
  const scale = targetWidth / bitmap.width;
  const targetHeight = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas is not supported on this device.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, targetWidth, targetHeight);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
  const grayscale = enhanceGrayscaleImageData(imageData).imageData;
  const adaptive = adaptiveThresholdImageData(imageData);
  const otsu = otsuThresholdImageData(imageData);
  const variants = await Promise.all([
    buildPreprocessedVariant({
      label: "Enhanced grayscale",
      imageData: grayscale,
    }),
    buildPreprocessedVariant({
      label: "Adaptive threshold",
      imageData: adaptive,
    }),
    buildPreprocessedVariant({
      label: "Otsu threshold",
      imageData: otsu,
    }),
  ]);

  bitmap.close();

  return variants;
}

export async function preprocessReceiptImage(file: File): Promise<PreprocessedReceiptImage> {
  const [firstVariant] = await preprocessReceiptImages(file);

  if (!firstVariant) {
    throw new Error("Failed to prepare receipt image for OCR.");
  }

  return firstVariant;
}
