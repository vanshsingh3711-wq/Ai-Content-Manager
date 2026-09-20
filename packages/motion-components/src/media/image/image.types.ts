export type ImageFitMode = 'contain' | 'cover' | 'fill' | 'none';

export interface ImagePosition {
  x: number;
  y: number;
}

export interface ImageMediaConfig {
  src?: string; // Optional conceptually for AI planning, but required to render
  fit?: ImageFitMode;
  position?: ImagePosition;
  opacity?: number;
  alt?: string;
  metadata?: {
    width?: number;
    height?: number;
    aspectRatio?: number;
    mimeType?: string;
    source?: string;
    [key: string]: unknown;
  };
}

export interface ResolvedImageMediaConfig {
  src: string;
  fit: ImageFitMode;
  position: ImagePosition;
  opacity: number;
  alt?: string;
  metadata?: Record<string, unknown>;
}
