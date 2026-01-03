import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { Download, Loader2, Smartphone, Tablet, Monitor, Share2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-solid';
import type { ExportSettings, DevicePreset } from '../../types';
import { DEVICE_PRESETS } from '../../utils/export';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

interface ExportPanelProps {
  onExport: (settings: ExportSettings) => Promise<void>;
  isExporting?: boolean;
}

export const ExportPanel: Component<ExportPanelProps> = (props) => {
  const [selectedPreset, setSelectedPreset] = createSignal<DevicePreset>(DEVICE_PRESETS[0]);
  const [customWidth, setCustomWidth] = createSignal(393);
  const [customHeight, setCustomHeight] = createSignal(852);
  const [quality, setQuality] = createSignal<1 | 2 | 3>(2);
  const [format, setFormat] = createSignal<'png' | 'jpeg'>('png');
  const [backgroundColor, setBackgroundColor] = createSignal('#ffffff');
  const [includeTransparency, setIncludeTransparency] = createSignal(false);
  const [settingsExpanded, setSettingsExpanded] = createSignal(true);
  const [copySuccess, setCopySuccess] = createSignal(false);

  const isCustom = () => selectedPreset().category === 'custom';
  
  const effectiveWidth = () => isCustom() ? customWidth() : selectedPreset().width;
  const effectiveHeight = () => isCustom() ? customHeight() : selectedPreset().height;

  const handlePresetChange = (preset: DevicePreset) => {
    setSelectedPreset(preset);
    if (!isCustom()) {
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
    }
  };

  const handleExport = async () => {
    const settings: ExportSettings = {
      width: effectiveWidth(),
      height: effectiveHeight(),
      quality: quality(),
      format: format(),
      backgroundColor: includeTransparency() ? 'transparent' : backgroundColor(),
      devicePreset: selectedPreset().name,
    };

    await props.onExport(settings);
  };
  
  const handleCopySettings = async () => {
    const settingsText = `Export Settings:
Dimensions: ${effectiveWidth()} × ${effectiveHeight()}px
Quality: ${quality()}x (${effectiveWidth() * quality()} × ${effectiveHeight() * quality()}px)
Format: ${format().toUpperCase()}
Background: ${includeTransparency() ? 'Transparent' : backgroundColor()}`;
    
    try {
      await navigator.clipboard.writeText(settingsText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      case 'desktop': return Monitor;
      case 'social': return Share2;
      default: return Smartphone;
    }
  };

  const presetsByCategory = () => {
    const categories: Record<string, DevicePreset[]> = {};
    DEVICE_PRESETS.forEach(preset => {
      if (!categories[preset.category]) {
        categories[preset.category] = [];
      }
      categories[preset.category].push(preset);
    });
    return categories;
  };

  return (
    <div class="space-y-6 p-4 border rounded-lg bg-card">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Export Conversation</h2>
        <Button
          onClick={handleExport}
          disabled={props.isExporting}
          class="min-w-32"
        >
          <Show
            when={!props.isExporting}
            fallback={
              <>
                <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            }
          >
            <Download class="w-4 h-4 mr-2" />
            Export PNG
          </Show>
        </Button>
      </div>

      {/* Device Presets */}
      <div class="space-y-3">
        <Label>Device Presets</Label>
        <div class="space-y-2">
          <For each={Object.entries(presetsByCategory())}>
            {([category, presets]) => (
              <div class="space-y-1">
                <div class="text-xs font-medium text-muted-foreground uppercase">
                  {category}
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <For each={presets}>
                    {(preset) => {
                      const Icon = getCategoryIcon(preset.category);
                      const isSelected = () => selectedPreset().name === preset.name;
                      return (
                        <Button
                          onClick={() => handlePresetChange(preset)}
                          variant={isSelected() ? 'default' : 'outline'}
                          class="flex items-center gap-2 h-auto py-2 text-sm justify-start"
                          classList={{
                            'ring-2 ring-primary/20': isSelected(),
                          }}
                        >
                          <Icon class="w-4 h-4 flex-shrink-0" />
                          <div class="flex-1 text-left min-w-0">
                            <div class="font-medium truncate">{preset.name}</div>
                            <Show when={preset.category !== 'custom'}>
                              <div class="text-xs opacity-80">
                                {preset.width} × {preset.height}
                              </div>
                            </Show>
                          </div>
                        </Button>
                      );
                    }}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Custom Dimensions */}
      <Show when={isCustom()}>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="custom-width">Width (px)</Label>
            <input
              id="custom-width"
              type="number"
              min="100"
              max="4096"
              value={customWidth()}
              onInput={(e) => setCustomWidth(parseInt(e.currentTarget.value) || 393)}
              class="w-full px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div class="space-y-2">
            <Label for="custom-height">Height (px)</Label>
            <input
              id="custom-height"
              type="number"
              min="100"
              max="4096"
              value={customHeight()}
              onInput={(e) => setCustomHeight(parseInt(e.currentTarget.value) || 852)}
              class="w-full px-3 py-2 border rounded-md bg-background"
            />
          </div>
        </div>
      </Show>

      {/* Quality Settings */}
      <div class="space-y-2">
        <Label for="quality">Quality (Resolution Multiplier)</Label>
        <div class="grid grid-cols-3 gap-2">
          <For each={[1, 2, 3] as const}>
            {(q) => {
              const isSelected = () => quality() === q;
              return (
                <Button
                  onClick={() => setQuality(q)}
                  variant={isSelected() ? 'default' : 'outline'}
                  class="text-sm font-medium"
                  classList={{
                    'ring-2 ring-primary/20': isSelected(),
                  }}
                >
                  {q}x
                </Button>
              );
            }}
          </For>
        </div>
        <p class="text-xs text-muted-foreground">
          Higher quality = larger file size. 2x recommended for most uses.
        </p>
      </div>

      {/* Format Selection */}
      <div class="space-y-2">
        <Label for="format">Format</Label>
        <div class="grid grid-cols-2 gap-2">
          <For each={[{ value: 'png', label: 'PNG' }, { value: 'jpeg', label: 'JPEG' }] as const}>
            {(fmt) => {
              const isSelected = () => format() === fmt.value;
              return (
                <Button
                  onClick={() => setFormat(fmt.value)}
                  variant={isSelected() ? 'default' : 'outline'}
                  class="text-sm font-medium"
                  classList={{
                    'ring-2 ring-primary/20': isSelected(),
                  }}
                >
                  {fmt.label}
                </Button>
              );
            }}
          </For>
        </div>
      </div>

      {/* Background Options */}
      <Show when={format() === 'png'}>
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <input
              id="transparency"
              type="checkbox"
              checked={includeTransparency()}
              onChange={(e) => setIncludeTransparency(e.currentTarget.checked)}
              class="w-4 h-4"
            />
            <Label for="transparency" class="cursor-pointer">
              Transparent Background
            </Label>
          </div>
          
          <Show when={!includeTransparency()}>
            <div class="space-y-2">
              <Label for="bg-color">Background Color</Label>
              <div class="flex gap-2">
                <input
                  id="bg-color"
                  type="color"
                  value={backgroundColor()}
                  onInput={(e) => setBackgroundColor(e.currentTarget.value)}
                  class="w-12 h-10 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor()}
                  onInput={(e) => setBackgroundColor(e.currentTarget.value)}
                  class="flex-1 px-3 py-2 border rounded-md bg-background font-mono text-sm"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </Show>
        </div>
      </Show>

      {/* Export Info */}
      <div class="border rounded-md overflow-hidden">
        <Button
          onClick={() => setSettingsExpanded(!settingsExpanded())}
          variant="ghost"
          class="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-none h-auto"
        >
          <span class="font-medium text-sm">Export Settings Summary</span>
          <Show
            when={settingsExpanded()}
            fallback={<ChevronDown class="w-4 h-4" />}
          >
            <ChevronUp class="w-4 h-4" />
          </Show>
        </Button>
        
        <Show when={settingsExpanded()}>
          <div class="p-3 space-y-2 text-sm bg-muted/20">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Dimensions:</span>
              <span class="font-mono font-medium">{effectiveWidth()} × {effectiveHeight()}px</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Quality:</span>
              <span class="font-mono font-medium">{quality()}x ({effectiveWidth() * quality()} × {effectiveHeight() * quality()}px)</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Format:</span>
              <span class="font-mono font-medium">{format().toUpperCase()}</span>
            </div>
            <Show when={format() === 'png'}>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Background:</span>
                <div class="flex items-center gap-2">
                  <Show
                    when={!includeTransparency()}
                    fallback={<span class="font-mono font-medium">Transparent</span>}
                  >
                    <div 
                      class="w-4 h-4 rounded border"
                      style={{ 'background-color': backgroundColor() }}
                    />
                    <span class="font-mono font-medium">{backgroundColor()}</span>
                  </Show>
                </div>
              </div>
            </Show>
            <div class="pt-2 border-t mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySettings}
                class="w-full"
              >
                <Show
                  when={copySuccess()}
                  fallback={
                    <>
                      <Copy class="w-4 h-4 mr-2" />
                      Copy Settings
                    </>
                  }
                >
                  <Check class="w-4 h-4 mr-2" />
                  Copied!
                </Show>
              </Button>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
