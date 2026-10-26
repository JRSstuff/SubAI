/**
 * High-performance client-side image compression for mobile PWA camera captures.
 * Keeps uploads fast, prevents payload timeouts, and fits within serverless limits.
 */
export async function compressImage(
  file: File,
  maxWidth = 960,
  maxHeight = 960,
  quality = 0.72
): Promise<{ base64: string; originalSizeKb: number; compressedSizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context creation failed."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        const originalSizeKb = Math.round(file.size / 1024);
        const compressedSizeKb = Math.round((compressedBase64.length * 3) / 4 / 1024);

        resolve({
          base64: compressedBase64,
          originalSizeKb,
          compressedSizeKb,
        });
      };
      img.onerror = () => reject(new Error("Failed to load image into memory."));
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
  });
}
