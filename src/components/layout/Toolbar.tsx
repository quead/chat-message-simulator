import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch, SwitchControl, SwitchThumb } from '../ui/switch';
import { Moon, Sun, Download, Save, Upload, Trash2, MoreVertical, Menu, Database } from 'lucide-solid';
import { AVAILABLE_LAYOUTS, DEFAULT_LAYOUT } from '../../constants/layouts';
import type { LayoutType } from '../../types/layout';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface ToolbarProps {
  onLayoutChange?: (layout: LayoutType) => void;
  onThemeToggle?: () => void;
  onExportClick?: () => void;
  onSave?: () => void;
  onLoad?: (file: File) => void;
  onClear?: () => void;
  onSaveToLocalStorage?: () => void;
  onToggleSidebar?: () => void;
  theme?: 'light' | 'dark';
}

export const Toolbar: Component<ToolbarProps> = (props) => {
  const [selectedLayout, setSelectedLayout] = createSignal<LayoutType>(DEFAULT_LAYOUT);
  const [showMenu, setShowMenu] = createSignal(false);
  let fileInputRef: HTMLInputElement | undefined;
  
  const isDark = () => props.theme === 'dark';

  const handleLayoutChange = (value: LayoutType | null) => {
    if (value) {
      setSelectedLayout(value);
      props.onLayoutChange?.(value);
    }
  };

  const handleLoadFile = () => {
    fileInputRef?.click();
  };

  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && props.onLoad) {
      props.onLoad(file);
      target.value = ''; // Reset input
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      props.onClear?.();
      setShowMenu(false);
    }
  };

  return (
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 items-center justify-between px-4">
        <div class="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={props.onToggleSidebar}
            title="Toggle sidebar"
            class="md:hidden"
          >
            <Menu class="w-5 h-5" />
          </Button>
          <h1 class="text-xl font-semibold hidden sm:block">Chat Message Simulator</h1>
          <h1 class="text-lg font-semibold sm:hidden">Chat Sim</h1>
        </div>
        
        <div class="flex items-center gap-3">
          {/* File Management */}
          <div class="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={props.onSave}
              title="Save conversation as JSON"
            >
              <Save class="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadFile}
              title="Load conversation from JSON"
            >
              <Upload class="w-4 h-4 mr-1" />
              Load
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              class="hidden"
            />
          </div>

          <div class="h-6 w-px bg-border" />
          
          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={props.onExportClick}
          >
            <Download class="w-4 h-4 mr-1" />
            Export
          </Button>
          
          <div class="h-6 w-px bg-border" />
          
          {/* Theme Toggle */}
          <div class="flex items-center gap-2">
            <Sun size={16} class={cn('transition-opacity', isDark() && 'opacity-50')} />
            <Switch
              checked={isDark()}
              onChange={() => props.onThemeToggle?.()}
            >
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
            </Switch>
            <Moon size={16} class={cn('transition-opacity', !isDark() && 'opacity-50')} />
          </div>
          
          <div class="h-6 w-px bg-border" />
          
          {/* Layout Selector */}
          <div class="flex items-center gap-2">
            <label for="layout-select" class="text-sm font-medium">
              Style:
            </label>
            <Select
              value={selectedLayout()}
              onChange={handleLayoutChange}
              options={AVAILABLE_LAYOUTS.map(layout => layout.id)}
              placeholder="Select a layout"
              itemComponent={(props: any) => (
                <SelectItem item={props.item}>
                  {AVAILABLE_LAYOUTS.find(l => l.id === props.item.rawValue)?.name}
                </SelectItem>
              )}
            >
              <SelectTrigger id="layout-select" aria-label="Select chat layout" class="w-[180px]">
                <SelectValue>
                  {(state: any) => AVAILABLE_LAYOUTS.find(l => l.id === state.selectedOption())?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>
          
          <div class="h-6 w-px bg-border" />
          
          {/* More Menu */}
          <div class="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu())}
              title="More options"
            >
              <MoreVertical class="w-4 h-4" />
            </Button>
            {showMenu() && (
              <div class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-popover border">
                <div class="py-1">
                  <Button
                    onClick={() => {
                      props.onSaveToLocalStorage?.();
                      setShowMenu(false);
                    }}
                    variant="ghost"
                    class="w-full px-4 py-2 text-sm justify-start hover:bg-accent"
                  >
                    <Database class="w-4 h-4 mr-2" />
                    Save to LocalStorage
                  </Button>
                  <div class="h-px bg-border my-1" />
                  <Button
                    onClick={handleClear}
                    variant="ghost"
                    class="w-full px-4 py-2 text-sm justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 class="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
