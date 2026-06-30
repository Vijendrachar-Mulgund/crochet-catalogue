// Image helpers — read a file as a data URL and downscale large images so
// storage stays small and PDFs/uploads stay fast.

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

// Downscale a chosen image to keep storage small and uploads fast.
// Returns a JPEG data URL no larger than maxDim on its longest side.
export function resizeImage(
  file: File,
  maxDim: number,
  quality = 0.82,
): Promise<string> {
  return fileToDataUrl(file).then(
    (dataUrl) =>
      new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = function () {
          let { width, height } = img;
          if (Math.max(width, height) > maxDim) {
            const scale = maxDim / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          try {
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch {
            resolve(dataUrl); // fall back to original if canvas is tainted
          }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      }),
  );
}
