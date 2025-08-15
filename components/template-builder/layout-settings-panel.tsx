'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { Separator } from '@/components/ui/separator';
import { Columns, Palette, Layout, X, Trash2 } from 'lucide-react';
import { setFocusedColumn, getFocusedColumn } from './focus-tracker';

interface LayoutSettingsPanelProps {
  element: HTMLElement;
  onUpdate: (updates: any) => void;
  onClose: () => void;
  onSyncContent?: () => void; // NEW: callback to sync content with parent
}

export function LayoutSettingsPanel({
  element,
  onUpdate,
  onClose,
  onSyncContent,
}: LayoutSettingsPanelProps) {
  // Parse current settings with fallback
  const currentSettings = (() => {
    try {
      return JSON.parse(element?.getAttribute('data-settings') || '{}');
    } catch {
      return {};
    }
  })();

  const [settings, setSettings] = useState({
    columns: currentSettings.columns || 2,
    columnGap: currentSettings.columnGap || 16,
    backgroundColor: currentSettings.backgroundColor || '#ffffff',
    borderColor: currentSettings.borderColor || '#e5e7eb',
    borderWidth: currentSettings.borderWidth || 1,
    borderRadius: currentSettings.borderRadius || 8,
    padding: currentSettings.padding || 16,
    minHeight: currentSettings.minHeight || 120,
    ...currentSettings,
  });

  const updateSettings = (newSettings: Partial<typeof settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    // Update the element
    if (element) {
      element.setAttribute('data-settings', JSON.stringify(updatedSettings));

      // If columns changed, replace the entire layout element in the DOM and sync content
      if (newSettings.columns && newSettings.columns !== settings.columns) {
        replaceLayoutElement(element, updatedSettings);
        if (onSyncContent) onSyncContent();
      }
      // If minHeight changed, force a complete replacement to ensure proper height update
      else if (
        newSettings.minHeight &&
        newSettings.minHeight !== settings.minHeight
      ) {
        replaceLayoutElement(element, updatedSettings);
        if (onSyncContent) onSyncContent();
      }
      // For other changes, just apply styles
      else {
        applySettingsToElement(updatedSettings);
      }
    }

    // Notify parent component
    onUpdate({ settings: updatedSettings });
  };

  const applySettingsToElement = (newSettings: typeof settings) => {
    if (!element) return;

    // Update the layout container styles (for instant feedback)
    const layoutElement = element.querySelector(
      '.layout-element'
    ) as HTMLElement;
    if (layoutElement) {
      layoutElement.style.backgroundColor = newSettings.backgroundColor;
      layoutElement.style.borderColor = newSettings.borderColor;
      layoutElement.style.borderWidth = `${newSettings.borderWidth}px`;
      layoutElement.style.borderRadius = `${newSettings.borderRadius}px`;
      layoutElement.style.padding = `${newSettings.padding}px`;
      layoutElement.style.gap = `${newSettings.columnGap}px`;
      layoutElement.style.minHeight = `${newSettings.minHeight}px`;

      // Update column min-heights
      const columns = layoutElement.querySelectorAll(
        '.layout-column'
      ) as NodeListOf<HTMLElement>;
      columns.forEach((column) => {
        column.style.minHeight = `${Math.max(
          newSettings.minHeight - 40,
          80
        )}px`; // Subtract padding/margin
      });
    }
  };

  // Helper to generate layout element HTML string
  const generateLayoutElementHtml = (
    settingsObj: typeof settings,
    existingContents: string[] = []
  ) => {
    const columnMinHeight = Math.max(settingsObj.minHeight - 40, 80); // Subtract padding/margin, minimum 80px
    const columnsHtml = Array.from({ length: settingsObj.columns })
      .map(
        (_, i) => `
      <div class="layout-column" style="flex: 1; min-height: ${columnMinHeight}px; border: 2px dashed #d1d5db; border-radius: 4px; padding: 12px; position: relative; display: flex; flex-direction: column;">
        
        <div contenteditable="true" class="layout-column-content" style="flex: 1; outline: none; font-size: 14px; color: #374151; line-height: 1.5; min-height: 60px; padding-top: 20px;" onfocus="window.setFocusedColumn && window.setFocusedColumn(this)" onclick="window.setFocusedColumn && window.setFocusedColumn(this)" onblur="window.handleColumnBlur && window.handleColumnBlur(this)">${
          existingContents[i] || ''
        }</div>
      </div>
    `
      )
      .join('');
    return `
      <div class="layout-element" data-element-type="layout" data-element-id="${
        element.getAttribute('data-element-id') || 'layout-' + Date.now()
      }" data-settings='${JSON.stringify(
      settingsObj
    )}' style="width: 100%; min-height: ${
      settingsObj.minHeight
    }px; background-color: ${settingsObj.backgroundColor}; border: ${
      settingsObj.borderWidth
    }px solid ${settingsObj.borderColor}; border-radius: ${
      settingsObj.borderRadius
    }px; padding: ${settingsObj.padding}px; display: flex; gap: ${
      settingsObj.columnGap
    }px; position: relative;" contenteditable="false">
        <div class="drag-handle content-element-drag-handle" style="position: absolute; top: 8px; left: -24px; width: 16px; height: 16px; background: #cbd5e1; border-radius: 50%; cursor: grab; display: flex; align-items: center; justify-content: center; opacity: 0.5; transition: opacity 0.2s;" title="Select Layout"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div>
        ${columnsHtml}
      </div>
    `;
  };

  // Helper to replace the layout element in the DOM
  const replaceLayoutElement = (
    container: HTMLElement,
    settingsObj: typeof settings
  ) => {
    // Find the closest .element-container (the actual block in the editor)
    const oldContainer = container.closest('.element-container') as HTMLElement;
    if (!oldContainer) return;
    const oldLayout = oldContainer.querySelector(
      '.layout-element'
    ) as HTMLElement;
    if (!oldLayout) return;
    const existingColumns = Array.from(
      oldLayout.querySelectorAll('.layout-column')
    );
    const existingContents = existingColumns.map((col) => {
      const contentDiv = col.querySelector(
        '.layout-column-content'
      ) as HTMLElement;
      return contentDiv ? contentDiv.innerHTML : '';
    });
    // Generate new HTML for the .element-container with the new layout
    const newHtml = `
      <div class="element-container" style="display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;" contenteditable="false">
        ${generateLayoutElementHtml(settingsObj, existingContents)}
      </div>
    `;
    // Replace old .element-container
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newHtml;
    const newContainer = tempDiv.firstElementChild;
    if (newContainer && oldContainer.parentNode) {
      oldContainer.parentNode.replaceChild(newContainer, oldContainer);
      // Auto re-select the new layout element to keep the settings panel open
      const newLayout = newContainer.querySelector(
        '.layout-element'
      ) as HTMLElement;
      if (newLayout) {
        setTimeout(() => {
          newLayout.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }, 0);
      }
    }
  };

  // Helper to update columns in the DOM and preserve content
  const updateLayoutColumns = (
    layoutContainer: HTMLElement,
    newColumnCount: number
  ) => {
    const layoutElement = layoutContainer.querySelector(
      '.layout-element'
    ) as HTMLElement;
    if (!layoutElement) return;
    const existingColumns = Array.from(
      layoutElement.querySelectorAll('.layout-column')
    );
    const existingContents = existingColumns.map((col) => {
      const contentDiv = col.querySelector(
        '.layout-column-content'
      ) as HTMLElement;
      return contentDiv ? contentDiv.innerHTML : '';
    });
    // Remove all columns
    existingColumns.forEach((col) => col.remove());

    const columnMinHeight = Math.max(settings.minHeight - 40, 80); // Use current settings

    // Add new columns, preserving content where possible
    for (let i = 0; i < newColumnCount; i++) {
      const column = document.createElement('div');
      column.className = 'layout-column';
      column.style.cssText = `
        flex: 1; 
        min-height: ${columnMinHeight}px; 
        border: 2px dashed #d1d5db; 
        border-radius: 4px; 
        padding: 12px; 
        position: relative; 
        display: flex; 
        flex-direction: column;
      `;
      column.innerHTML = `
        
        <div contenteditable="true" class="layout-column-content" style="flex: 1; outline: none; font-size: 14px; color: #374151; line-height: 1.5; min-height: 60px; padding-top: 20px;" onfocus="window.setFocusedColumn && window.setFocusedColumn(this)" onclick="window.setFocusedColumn && window.setFocusedColumn(this)" onblur="window.handleColumnBlur && window.handleColumnBlur(this)">
          
        </div>
      `;
      layoutElement.appendChild(column);
    }
  };

  // Handle case where element might be null/undefined
  if (!element) {
    return (
      <Card className='w-80'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg flex items-center gap-2 text-foreground'>
              <Columns className='h-5 w-5 text-purple-600' />
              Layout Settings
            </CardTitle>
            <Button variant='ghost' size='sm' onClick={onClose}>
              <X className='h-4 w-4' />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            No layout element selected
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-80'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg flex items-center gap-2 text-foreground'>
            <Columns className='h-5 w-5 text-purple-600' />
            Layout Settings
          </CardTitle>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                if (element) {
                  const container = element.closest('.element-container');
                  if (container) {
                    container.remove();
                  } else {
                    element.remove();
                  }
                  onUpdate({ deleted: true });
                  onClose();
                }
              }}
              className='text-red-600 hover:text-red-700 hover:bg-red-50'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Tabs defaultValue='layout' className='w-full'>
          {/* <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger
              value='layout'
              className='flex items-center gap-1 text-foreground'
            >
              <Layout className='h-3 w-3' />
              Layout
            </TabsTrigger>
            <TabsTrigger
              value='style'
              className='flex items-center gap-1 text-foreground'
            >
              <Palette className='h-3 w-3' />
              Style
            </TabsTrigger>
          </TabsList> */}

          <TabsContent value='layout' className='space-y-4'>
            <div className='space-y-2'>
              <Label className='text-foreground'>Number of Columns</Label>
              <Select
                value={settings.columns.toString()}
                onValueChange={(value) =>
                  updateSettings({ columns: Number.parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='2'>2 Columns</SelectItem>
                  {/* <SelectItem value='3'>3 Columns</SelectItem>
                  <SelectItem value='4'>4 Columns</SelectItem> */}
                </SelectContent>
              </Select>
            </div>

            {/* <div className='space-y-2'>
              <Label className='text-foreground'>
                Column Gap: {settings.columnGap}px
              </Label>
              <Slider
                value={[settings.columnGap]}
                onValueChange={([value]) =>
                  updateSettings({ columnGap: value })
                }
                max={50}
                min={0}
                step={2}
                className='w-full'
              />
            </div> */}

            {/* <div className='space-y-2'>
              <Label className='text-foreground'>
                Padding: {settings.padding}px
              </Label>
              <Slider
                value={[settings.padding]}
                onValueChange={([value]) => updateSettings({ padding: value })}
                max={50}
                min={0}
                step={2}
                className='w-full'
              />
            </div> */}

            <div className='space-y-2'>
              <Label className='text-foreground'>
                Minimum Height: {settings.minHeight}px
              </Label>
              <Slider
                value={[settings.minHeight]}
                onValueChange={([value]) =>
                  updateSettings({ minHeight: value })
                }
                max={300}
                min={80}
                step={10}
                className='w-full'
              />
            </div>
          </TabsContent>

          {/* <TabsContent value='style' className='space-y-4'>
            <div className='space-y-2'>
              <Label className='text-foreground'>Background Color</Label>
              <ColorPicker
                color={settings.backgroundColor}
                onChange={(color) => updateSettings({ backgroundColor: color })}
              />
            </div>

            <Separator />

            <div className='space-y-2'>
              <Label className='text-foreground'>Border Color</Label>
              <ColorPicker
                color={settings.borderColor}
                onChange={(color) => updateSettings({ borderColor: color })}
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-foreground'>
                Border Width: {settings.borderWidth}px
              </Label>
              <Slider
                value={[settings.borderWidth]}
                onValueChange={([value]) =>
                  updateSettings({ borderWidth: value })
                }
                max={5}
                min={0}
                step={1}
                className='w-full'
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-foreground'>
                Border Radius: {settings.borderRadius}px
              </Label>
              <Slider
                value={[settings.borderRadius]}
                onValueChange={([value]) =>
                  updateSettings({ borderRadius: value })
                }
                max={20}
                min={0}
                step={1}
                className='w-full'
              />
            </div>
          </TabsContent> */}
        </Tabs>
        <div className='p-4 border-t flex gap-2'>
          <Button variant='outline' onClick={onClose} className='w-full'>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
