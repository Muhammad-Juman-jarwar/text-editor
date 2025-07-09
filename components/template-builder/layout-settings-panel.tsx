"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ColorPicker } from "@/components/ui/color-picker"
import { Separator } from "@/components/ui/separator"
import { Columns, Palette, Layout, X } from "lucide-react"

interface LayoutSettingsPanelProps {
  element: HTMLElement
  onUpdate: (updates: any) => void
  onClose: () => void
}

export function LayoutSettingsPanel({ element, onUpdate, onClose }: LayoutSettingsPanelProps) {
  // Parse current settings with fallback
  const currentSettings = (() => {
    try {
      return JSON.parse(element?.getAttribute("data-settings") || "{}")
    } catch {
      return {}
    }
  })()

  const [settings, setSettings] = useState({
    columns: currentSettings.columns || 2,
    columnGap: currentSettings.columnGap || 16,
    backgroundColor: currentSettings.backgroundColor || "#ffffff",
    borderColor: currentSettings.borderColor || "#e5e7eb",
    borderWidth: currentSettings.borderWidth || 1,
    borderRadius: currentSettings.borderRadius || 8,
    padding: currentSettings.padding || 16,
    minHeight: currentSettings.minHeight || 120,
    ...currentSettings,
  })

  const updateSettings = (newSettings: Partial<typeof settings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    // Update the element
    if (element) {
      element.setAttribute("data-settings", JSON.stringify(updatedSettings))
      applySettingsToElement(updatedSettings)
    }

    // Notify parent component
    onUpdate({ settings: updatedSettings })
  }

  const applySettingsToElement = (newSettings: typeof settings) => {
    if (!element) return

    // Update the layout container styles
    const layoutElement = element.querySelector(".layout-element") as HTMLElement
    if (layoutElement) {
      layoutElement.style.backgroundColor = newSettings.backgroundColor
      layoutElement.style.borderColor = newSettings.borderColor
      layoutElement.style.borderWidth = `${newSettings.borderWidth}px`
      layoutElement.style.borderRadius = `${newSettings.borderRadius}px`
      layoutElement.style.padding = `${newSettings.padding}px`
      layoutElement.style.gap = `${newSettings.columnGap}px`
      layoutElement.style.minHeight = `${newSettings.minHeight}px`

      // Update column count
      const currentColumns = layoutElement.querySelectorAll(".layout-column").length
      if (currentColumns !== newSettings.columns) {
        updateColumnCount(layoutElement, newSettings.columns)
      }
    }
  }

  const updateColumnCount = (layoutElement: HTMLElement, columnCount: number) => {
    // Remove existing columns
    const existingColumns = layoutElement.querySelectorAll(".layout-column")
    existingColumns.forEach((col) => col.remove())

    // Add new columns
    for (let i = 0; i < columnCount; i++) {
      const column = document.createElement("div")
      column.className = "layout-column"
      column.style.cssText = `
        flex: 1; 
        min-height: 80px; 
        border: 2px dashed #d1d5db; 
        border-radius: 4px; 
        padding: 12px; 
        position: relative; 
        display: flex; 
        flex-direction: column;
      `

      column.innerHTML = `
        <div style="position: absolute; top: 4px; right: 4px; font-size: 10px; color: #9ca3af; pointer-events: none; display: flex; align-items: center; gap: 2px;">
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          <span>Col ${i + 1}</span>
        </div>
        <div contenteditable="true" class="layout-column-content" style="flex: 1; outline: none; font-size: 14px; color: #374151; line-height: 1.5; min-height: 60px; padding-top: 20px;">
          <p style="color: #9ca3af; font-style: italic;">Click to add content...</p>
        </div>
      `

      layoutElement.appendChild(column)
    }
  }

  // Handle case where element might be null/undefined
  if (!element) {
    return (
      <Card className="w-80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Columns className="h-5 w-5 text-purple-600" />
              Layout Settings
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-foreground">No layout element selected</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Columns className="h-5 w-5 text-purple-600" />
            Layout Settings
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="layout" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layout" className="flex items-center gap-1 text-foreground">
              <Layout className="h-3 w-3" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-1 text-foreground">
              <Palette className="h-3 w-3" />
              Style
            </TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Number of Columns</Label>
              <Select
                value={settings.columns.toString()}
                onValueChange={(value) => updateSettings({ columns: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Column Gap: {settings.columnGap}px</Label>
              <Slider
                value={[settings.columnGap]}
                onValueChange={([value]) => updateSettings({ columnGap: value })}
                max={50}
                min={0}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Padding: {settings.padding}px</Label>
              <Slider
                value={[settings.padding]}
                onValueChange={([value]) => updateSettings({ padding: value })}
                max={50}
                min={0}
                step={2}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Minimum Height: {settings.minHeight}px</Label>
              <Slider
                value={[settings.minHeight]}
                onValueChange={([value]) => updateSettings({ minHeight: value })}
                max={300}
                min={80}
                step={10}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Background Color</Label>
              <ColorPicker
                color={settings.backgroundColor}
                onChange={(color) => updateSettings({ backgroundColor: color })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-foreground">Border Color</Label>
              <ColorPicker color={settings.borderColor} onChange={(color) => updateSettings({ borderColor: color })} />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Border Width: {settings.borderWidth}px</Label>
              <Slider
                value={[settings.borderWidth]}
                onValueChange={([value]) => updateSettings({ borderWidth: value })}
                max={5}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Border Radius: {settings.borderRadius}px</Label>
              <Slider
                value={[settings.borderRadius]}
                onValueChange={([value]) => updateSettings({ borderRadius: value })}
                max={20}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
