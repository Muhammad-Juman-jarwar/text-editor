"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ColorPicker } from "@/components/ui/color-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

interface ThemeTabProps {
  template: any
  onUpdateTemplate: (updates: any) => void
}

const fontFamilies = ["Arial", "Times New Roman", "Helvetica", "Georgia", "Verdana", "Calibri", "Inter", "Roboto"]

export function ThemeTab({ template, onUpdateTemplate }: ThemeTabProps) {
  return (
    <div className="space-y-4 mt-0">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground">Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-foreground">Primary Color</Label>
            <ColorPicker
              value={template.theme.colors.primary}
              onChange={(color) =>
                onUpdateTemplate({
                  theme: {
                    ...template.theme,
                    colors: { ...template.theme.colors, primary: color },
                  },
                })
              }
            />
          </div>

          <div>
            <Label className="text-xs text-foreground">Secondary Color</Label>
            <ColorPicker
              value={template.theme.colors.secondary}
              onChange={(color) =>
                onUpdateTemplate({
                  theme: {
                    ...template.theme,
                    colors: { ...template.theme.colors, secondary: color },
                  },
                })
              }
            />
          </div>

          <div>
            <Label className="text-xs text-foreground">Text Color</Label>
            <ColorPicker
              value={template.theme.colors.text}
              onChange={(color) =>
                onUpdateTemplate({
                  theme: {
                    ...template.theme,
                    colors: { ...template.theme.colors, text: color },
                  },
                })
              }
            />
          </div>

          <div>
            <Label className="text-xs text-foreground">Page Background</Label>
            <ColorPicker
              value={template.theme.colors.pageBackground}
              onChange={(color) =>
                onUpdateTemplate({
                  theme: {
                    ...template.theme,
                    colors: { ...template.theme.colors, pageBackground: color },
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground">Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-foreground mb-2 block">Default Font Family</Label>
            <Select
              value={template.theme.typography.fontFamily || "Arial"}
              onValueChange={(value) =>
                onUpdateTemplate({
                  theme: {
                    ...template.theme,
                    typography: { ...template.theme.typography, fontFamily: value },
                  },
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs text-foreground">Base Font Size</Label>
              <span className="text-xs text-muted-foreground">
                {template.theme.typography.baseFontSize || 14}px
              </span>
            </div>
            <Slider
              defaultValue={[template.theme.typography.baseFontSize || 14]}
              min={10}
              max={24}
              step={1}
              onValueChange={([value]) =>
                onUpdateTemplate({
                  theme: {
                    ...template.theme,
                    typography: { ...template.theme.typography, baseFontSize: value },
                  },
                })
              }
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs text-foreground">Line Height</Label>
              <span className="text-xs text-muted-foreground">
                {template.theme.typography.lineHeight || 1.5}
              </span>
            </div>
            <Slider
              defaultValue={[template.theme.typography.lineHeight || 1.5]}
              min={1}
              max={2}
              step={0.1}
              onValueChange={([value]) =>
                onUpdateTemplate({
                  theme: {
                    ...template.theme,
                    typography: { ...template.theme.typography, lineHeight: value },
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
