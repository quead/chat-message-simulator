export type ExportFormat = 'png' | 'jpeg' | 'jpg';

export type ExportQuality = 1 | 2 | 3; // 1x, 2x, 3x resolution multiplier

export interface DevicePreset {
  name: string;
  width: number;
  height: number;
  category: 'mobile' | 'tablet' | 'desktop' | 'social' | 'custom';
}

export interface ExportSettings {
  width: number;
  height: number;
  quality: ExportQuality;
  format: ExportFormat;
  backgroundColor?: string;
  devicePreset?: string;
  includeChrome?: boolean;
  filename?: string;
}

export interface ExportResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
  filename: string;
}

