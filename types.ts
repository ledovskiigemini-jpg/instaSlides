export interface Slide {
  id: string;
  originalImage: string; // Base64 or ObjectURL
  currentImage: string; // Might be modified by AI
  title: string;
  body: string;
  isProcessing: boolean;
}

export interface GeneratedImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export type AspectRatio = "1:1" | "4:5" | "9:16";

// Helper for type guards
export function isSlide(obj: any): obj is Slide {
  return obj && typeof obj.id === 'string';
}