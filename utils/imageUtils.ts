import { Slide } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get raw base64 if needed, 
      // but for displaying in <img> we usually want the prefix.
      // For Gemini API, we will strip it later.
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const stripBase64Prefix = (dataUrl: string): { data: string; mimeType: string } => {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URL");
  }
  return {
    mimeType: match[1],
    data: match[2],
  };
};

export const downloadSlide = async (slide: Slide, aspectRatio: number = 4/5) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  img.crossOrigin = "anonymous";
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = slide.currentImage;
  });

  // Target dimensions (high res)
  const targetWidth = 1080;
  const targetHeight = 1350; // 4:5 ratio standard for IG
  
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // 1. Draw Image (Cover)
  // Calculate scaling to cover
  const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
  const x = (targetWidth / 2) - (img.width / 2) * scale;
  const y = (targetHeight / 2) - (img.height / 2) * scale;
  
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

  // 2. Draw Gradient Overlay
  // Linear gradient from transparent to black at the bottom
  const gradient = ctx.createLinearGradient(0, targetHeight * 0.4, 0, targetHeight);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.7)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.9)");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, targetHeight * 0.4, targetWidth, targetHeight * 0.6);

  // 3. Draw Text
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  
  // Title
  if (slide.title) {
    const fontSize = 64;
    ctx.font = `bold ${fontSize}px sans-serif`;
    wrapText(ctx, slide.title, 60, targetHeight - 240, targetWidth - 120, fontSize * 1.2);
  }

  // Body
  if (slide.body) {
    const fontSize = 36;
    ctx.font = `normal ${fontSize}px sans-serif`;
    // Place body below title area
    wrapText(ctx, slide.body, 60, targetHeight - 120, targetWidth - 120, fontSize * 1.3);
  }

  // Trigger Download
  const link = document.createElement('a');
  link.download = `instagram-slide-${slide.id}.jpg`;
  link.href = canvas.toDataURL('image/jpeg', 0.9);
  link.click();
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  // Since we are drawing from bottom up conceptually for layout, we might want to measure first.
  // But for simplicity, let's just draw from the given Y downwards? 
  // The requirements said "bottom layer", so text sits at the bottom.
  // Let's assume Y is the starting baseline for the block.
  
  // A better approach for "bottom aligned" text:
  // 1. Calculate total height
  // 2. Draw from (Bottom - Height)
  
  // Re-calculating for bottom-up approach to ensure it fits in the gradient
  // Let's simplify: User provides text, we draw it at fixed positions relative to bottom.
  // We'll stick to the passed Y for now, assuming the caller passes a good Y.
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}