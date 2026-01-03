import { toPng, toJpeg } from 'html-to-image';
import type { ExportSettings, DevicePreset } from '../types';

// Device presets with exact dimensions
export const DEVICE_PRESETS: DevicePreset[] = [
  { name: 'iPhone 14 Pro', width: 393, height: 852, category: 'mobile' },
  { name: 'iPhone SE', width: 375, height: 667, category: 'mobile' },
  { name: 'Samsung Galaxy S22', width: 360, height: 800, category: 'mobile' },
  { name: 'Google Pixel 7', width: 412, height: 915, category: 'mobile' },
  { name: 'iPad', width: 768, height: 1024, category: 'tablet' },
  { name: 'iPad Pro 11"', width: 834, height: 1194, category: 'tablet' },
  { name: 'Desktop HD', width: 1920, height: 1080, category: 'desktop' },
  { name: 'Instagram Story', width: 1080, height: 1920, category: 'social' },
  { name: 'Custom', width: 0, height: 0, category: 'custom' },
];

export interface ExportOptions {
  element: HTMLElement;
  settings: ExportSettings;
  onProgress?: (progress: number) => void;
}

export interface ExportResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
  filename: string;
}

/**
 * Export conversation view as PNG image
 */
export async function exportConversationAsPng(
  options: ExportOptions
): Promise<ExportResult> {
  const { element, settings, onProgress } = options;
  
  try {
    onProgress?.(10);
    
    // Apply custom dimensions if needed
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    const originalMaxWidth = element.style.maxWidth;
    
    if (settings.width && settings.height) {
      element.style.width = `${settings.width}px`;
      element.style.height = `${settings.height}px`;
      element.style.maxWidth = `${settings.width}px`;
    }
    
    onProgress?.(30);
    
    // Calculate pixel ratio for quality
    const pixelRatio = settings.quality || 2;
    
    // Generate image
    const dataUrl = await toPng(element, {
      pixelRatio,
      backgroundColor: settings.backgroundColor || '#ffffff',
      cacheBust: true,
      width: settings.width,
      height: settings.height,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      },
    });
    
    onProgress?.(80);
    
    // Restore original styles
    element.style.width = originalWidth;
    element.style.height = originalHeight;
    element.style.maxWidth = originalMaxWidth;
    
    onProgress?.(100);
    
    const filename = generateFilename(settings);
    
    return {
      success: true,
      dataUrl,
      filename,
    };
  } catch (error) {
    console.error('Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
      filename: '',
    };
  }
}

/**
 * Export conversation view as JPEG image
 */
export async function exportConversationAsJpeg(
  options: ExportOptions
): Promise<ExportResult> {
  const { element, settings, onProgress } = options;
  
  try {
    onProgress?.(10);
    
    // Apply custom dimensions if needed
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    const originalMaxWidth = element.style.maxWidth;
    
    if (settings.width && settings.height) {
      element.style.width = `${settings.width}px`;
      element.style.height = `${settings.height}px`;
      element.style.maxWidth = `${settings.width}px`;
    }
    
    onProgress?.(30);
    
    // Calculate pixel ratio for quality
    const pixelRatio = settings.quality || 2;
    
    // Generate image
    const dataUrl = await toJpeg(element, {
      pixelRatio,
      backgroundColor: settings.backgroundColor || '#ffffff',
      cacheBust: true,
      width: settings.width,
      height: settings.height,
      quality: 0.95,
    });
    
    onProgress?.(80);
    
    // Restore original styles
    element.style.width = originalWidth;
    element.style.height = originalHeight;
    element.style.maxWidth = originalMaxWidth;
    
    onProgress?.(100);
    
    const filename = generateFilename({ ...settings, format: 'jpeg' });
    
    return {
      success: true,
      dataUrl,
      filename,
    };
  } catch (error) {
    console.error('Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
      filename: '',
    };
  }
}

/**
 * Trigger browser download of image
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Generate filename based on settings
 */
function generateFilename(settings: ExportSettings): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const format = settings.format || 'png';
  const preset = settings.devicePreset || 'custom';
  
  return `chat-conversation_${preset}_${timestamp}.${format}`;
}

/**
 * Get device preset by name
 */
export function getDevicePreset(name: string): DevicePreset | undefined {
  return DEVICE_PRESETS.find(preset => preset.name === name);
}

/**
 * Validate export settings
 */
export function validateExportSettings(settings: ExportSettings): string[] {
  const errors: string[] = [];
  
  if (!settings.width || settings.width <= 0) {
    errors.push('Width must be greater than 0');
  }
  
  if (!settings.height || settings.height <= 0) {
    errors.push('Height must be greater than 0');
  }
  
  if (settings.width && settings.width > 4096) {
    errors.push('Width cannot exceed 4096px');
  }
  
  if (settings.height && settings.height > 4096) {
    errors.push('Height cannot exceed 4096px');
  }
  
  if (settings.quality && (settings.quality < 1 || settings.quality > 3)) {
    errors.push('Quality must be between 1x and 3x');
  }
  
  return errors;
}
