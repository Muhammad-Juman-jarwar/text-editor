"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ColorPicker } from "@/components/ui/color-picker"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, PieChart, LineChart, Plus, Trash2 } from "lucide-react"

interface ChartSettingsPanelProps {
  selectedElement: HTMLElement | null;
  onUpdate: (updates: any) => void;
  onClose: () => void;
}

interface ChartDataPoint {
  label: string
  value: number
  color: string
}

interface ChartSettings {
  title: string
  type: "bar" | "pie" | "line" | "doughnut"
  width: number
  height: number
  showTitle: boolean
  showLegend: boolean
  showValues: boolean
  titleColor: string
  backgroundColor: string
  borderColor: string
  borderWidth: number
  data: ChartDataPoint[]
}

const defaultChartSettings: ChartSettings = {
  title: "Chart Title",
  type: "bar",
  width: 400,
  height: 300,
  showTitle: true,
  showLegend: true,
  showValues: true,
  titleColor: "#1f2937",
  backgroundColor: "#ffffff",
  borderColor: "#e5e7eb",
  borderWidth: 1,
  data: [
    { label: "Critical", value: 5, color: "#dc2626" },
    { label: "High", value: 12, color: "#ea580c" },
    { label: "Medium", value: 8, color: "#d97706" },
    { label: "Low", value: 3, color: "#65a30d" },
    { label: "Info", value: 2, color: "#0891b2" },
  ],
}

const chartTypes = [
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "pie", label: "Pie Chart", icon: PieChart },
  { value: "line", label: "Line Chart", icon: LineChart },
  { value: "doughnut", label: "Doughnut Chart", icon: PieChart },
]

const predefinedColors = [
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#65a30d",
  "#0891b2",
  "#7c3aed",
  "#c026d3",
  "#db2777",
  "#059669",
  "#0d9488",
]

export function ChartSettingsPanel({ selectedElement, onUpdate }: ChartSettingsPanelProps) {
  const [settings, setSettings] = useState<ChartSettings>(defaultChartSettings)

  // Load settings from element when selected
  useEffect(() => {
    if (selectedElement) {
      try {
        const settingsAttr = selectedElement.getAttribute("data-chart-settings")
        if (settingsAttr) {
          const parsedSettings = JSON.parse(settingsAttr)
          setSettings({ ...defaultChartSettings, ...parsedSettings })
        } else {
          setSettings(defaultChartSettings)
        }
      } catch (error) {
        console.error("Failed to parse chart settings:", error)
        setSettings(defaultChartSettings)
      }
    }
  }, [selectedElement])

  const updateSettings = (updates: Partial<ChartSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)

    if (selectedElement) {
      // Update the element's data attribute
      selectedElement.setAttribute("data-chart-settings", JSON.stringify(newSettings))

      // Update the visual representation
      updateChartElement(selectedElement, newSettings)

      // Notify parent component
      onUpdate(newSettings)
    }
  }

  const updateChartElement = (element: HTMLElement, chartSettings: ChartSettings) => {
    // Generate chart HTML based on settings
    const chartHtml = generateChartHtml(chartSettings)

    // Update the element's innerHTML while preserving its structure
    element.innerHTML = chartHtml

    // Ensure the element maintains its data attributes
    element.setAttribute("data-element-type", "chart")
    element.setAttribute("data-chart-settings", JSON.stringify(chartSettings))

    // Apply the chart container styles
    element.style.width = `${chartSettings.width}px`
    element.style.height = `${chartSettings.height}px`
    element.style.backgroundColor = chartSettings.backgroundColor
    element.style.border = `${chartSettings.borderWidth}px solid ${chartSettings.borderColor}`
    element.style.borderRadius = "8px"
    element.style.padding = "16px"
    element.style.fontFamily = "Arial, sans-serif"
    element.style.position = "relative"
    element.style.display = "block"
  }

  const generateChartHtml = (chartSettings: ChartSettings) => {
    const { title, type, width, height, showTitle, showLegend, data, titleColor } = chartSettings

    // Calculate chart area dimensions with proper spacing
    const titleHeight = showTitle ? 40 : 0
    const legendHeight = showLegend ? 80 : 0 // Increased space for legend
    const padding = 32 // Total padding (16px on each side)
    const chartAreaHeight = height - titleHeight - legendHeight - padding

    const maxValue = Math.max(...data.map((d) => d.value))

    let chartContent = ""

    if (type === "bar") {
      const availableWidth = width - padding - 40 // Extra margin for labels
      const barWidth = Math.max(20, availableWidth / data.length - 20) // More spacing between bars
      const chartHeight = chartAreaHeight - 60 // Space for labels at bottom

      chartContent = `
        <div style="display: flex; align-items: flex-end; justify-content: center; height: ${chartHeight}px; padding: 20px 20px 0px 20px; position: relative;">
          ${data
            .map((item) => {
              const barHeight = Math.max(10, (item.value / maxValue) * (chartHeight - 40))
              return `
              <div style="display: flex; flex-direction: column; align-items: center; margin: 0 10px; height: 100%;">
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; position: relative;">
                  ${chartSettings.showValues ? `<div style="margin-bottom: 8px; font-size: 12px; font-weight: bold; color: #374151;">${item.value}</div>` : ""}
                  <div style="
                    width: ${barWidth}px; 
                    height: ${barHeight}px; 
                    background-color: ${item.color}; 
                    border-radius: 4px 4px 0 0;
                  "></div>
                </div>
                <div style="margin-top: 12px; font-size: 11px; text-align: center; max-width: ${barWidth + 20}px; word-wrap: break-word; color: #374151; height: 30px; display: flex; align-items: center; justify-content: center;">${item.label}</div>
              </div>
            `
            })
            .join("")}
        </div>
      `
    } else if (type === "pie" || type === "doughnut") {
      const total = data.reduce((sum, item) => sum + item.value, 0)
      let currentAngle = 0
      const radius = Math.min(width - padding - 40, chartAreaHeight - 40) / 2
      const centerX = (width - padding) / 2
      const centerY = (chartAreaHeight - 20) / 2
      const innerRadius = type === "doughnut" ? radius * 0.5 : 0

      chartContent = `
        <div style="display: flex; justify-content: center; align-items: center; height: ${chartAreaHeight}px; padding: 20px;">
          <svg width="${width - padding}" height="${chartAreaHeight - 20}" style="overflow: visible;">
            ${data
              .map((item) => {
                const angle = (item.value / total) * 360
                const startAngle = currentAngle
                const endAngle = currentAngle + angle
                currentAngle += angle

                const startAngleRad = ((startAngle - 90) * Math.PI) / 180
                const endAngleRad = ((endAngle - 90) * Math.PI) / 180

                const x1 = centerX + radius * Math.cos(startAngleRad)
                const y1 = centerY + radius * Math.sin(startAngleRad)
                const x2 = centerX + radius * Math.cos(endAngleRad)
                const y2 = centerY + radius * Math.sin(endAngleRad)

                const largeArcFlag = angle > 180 ? 1 : 0

                let path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

                if (type === "doughnut") {
                  const ix1 = centerX + innerRadius * Math.cos(startAngleRad)
                  const iy1 = centerY + innerRadius * Math.sin(startAngleRad)
                  const ix2 = centerX + innerRadius * Math.cos(endAngleRad)
                  const iy2 = centerY + innerRadius * Math.sin(endAngleRad)

                  path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1} Z`
                }

                return `<path d="${path}" fill="${item.color}" stroke="#fff" strokeWidth="2"/>`
              })
              .join("")}
            ${
              chartSettings.showValues
                ? data
                    .map((item, index) => {
                      const angle =
                        (data.slice(0, index).reduce((sum, d) => sum + d.value, 0) / total) * 360 +
                        ((item.value / total) * 360) / 2
                      const angleRad = ((angle - 90) * Math.PI) / 180
                      const labelRadius = (radius + innerRadius) / 2
                      const x = centerX + labelRadius * Math.cos(angleRad)
                      const y = centerY + labelRadius * Math.sin(angleRad)

                      return `<text x="${x}" y="${y}" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="bold">${item.value}</text>`
                    })
                    .join("")
                : ""
            }
          </svg>
        </div>
      `
    } else if (type === "line") {
      const availableWidth = width - padding - 80 // Extra margin for labels
      const availableHeight = chartAreaHeight - 80 // Extra margin for labels and values
      const pointSpacing = data.length > 1 ? availableWidth / (data.length - 1) : 0

      chartContent = `
        <div style="position: relative; height: ${chartAreaHeight}px; padding: 30px 40px 50px 40px;">
          <svg width="${availableWidth}" height="${availableHeight}" style="overflow: visible;">
            ${data
              .map((item, index) => {
                const x = index * pointSpacing
                const y = availableHeight - 40 - (item.value / maxValue) * (availableHeight - 60)
                const nextItem = data[index + 1]

                let line = ""
                if (nextItem && index < data.length - 1) {
                  const nextX = (index + 1) * pointSpacing
                  const nextY = availableHeight - 40 - (nextItem.value / maxValue) * (availableHeight - 60)
                  line = `<line x1="${x}" y1="${y}" x2="${nextX}" y2="${nextY}" stroke="${item.color}" strokeWidth="3"/>`
                }

                return `
                ${line}
                <circle cx="${x}" cy="${y}" r="6" fill="${item.color}" stroke="#fff" strokeWidth="2"/>
                ${chartSettings.showValues ? `<text x="${x}" y="${y - 15}" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">${item.value}</text>` : ""}
              `
              })
              .join("")}
          </svg>
          <!-- Labels positioned below the chart -->
          <div style="position: absolute; bottom: 10px; left: 40px; right: 40px; display: flex; justify-content: space-between;">
            ${data
              .map(
                (item) => `
              <div style="font-size: 11px; text-align: center; color: #374151; flex: 1;">${item.label}</div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
    }

    return `
      <div class="drag-handle" style="
        position: absolute;
        top: -8px;
        left: -8px;
        width: 16px;
        height: 16px;
        background: #10b981;
        border: 2px solid white;
        border-radius: 50%;
        cursor: move;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 10;
      "></div>
      ${showTitle ? `<h3 style="margin: 0 0 16px 0; text-align: center; color: ${titleColor}; font-size: 16px; font-weight: bold;">${title}</h3>` : ""}
      ${chartContent}
      ${
        showLegend
          ? `
        <div style="display: flex; justify-content: center; flex-wrap: wrap; margin-top: 24px; gap: 12px; padding: 0 16px;">
          ${data
            .map(
              (item) => `
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 12px; height: 12px; background: ${item.color}; border-radius: 2px;"></div>
              <span style="font-size: 12px; color: #374151;">${item.label}</span>
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }
    `
  }

  const addDataPoint = () => {
    const newDataPoint: ChartDataPoint = {
      label: `Item ${settings.data.length + 1}`,
      value: 1,
      color: predefinedColors[settings.data.length % predefinedColors.length],
    }
    updateSettings({ data: [...settings.data, newDataPoint] })
  }

  const removeDataPoint = (index: number) => {
    if (settings.data.length > 1) {
      const newData = settings.data.filter((_, i) => i !== index)
      updateSettings({ data: newData })
    }
  }

  const updateDataPoint = (index: number, updates: Partial<ChartDataPoint>) => {
    const newData = settings.data.map((item, i) => (i === index ? { ...item, ...updates } : item))
    updateSettings({ data: newData })
  }

  if (!selectedElement) return null

  return (
    <div className="w-80 bg-background border-l border-border flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Chart Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (selectedElement) {
              const container = selectedElement.closest(".element-container")
              if (container) {
                container.remove()
              } else {
                selectedElement.remove()
              }
              onUpdate({ deleted: true })
            }
          }}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Chart Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Chart Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {chartTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.value}
                      variant={settings.type === type.value ? "default" : "outline"}
                      size="sm"
                      className="flex flex-col h-16 p-2"
                      onClick={() => updateSettings({ type: type.value as any })}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{type.label.split(" ")[0]}</span>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Chart Properties */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <Input
                  value={settings.title}
                  onChange={(e) => updateSettings({ title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Width</Label>
                  <Input
                    type="number"
                    value={settings.width}
                    onChange={(e) => updateSettings({ width: Number.parseInt(e.target.value) || 400 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Height</Label>
                  <Input
                    type="number"
                    value={settings.height}
                    onChange={(e) => updateSettings({ height: Number.parseInt(e.target.value) || 300 })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Show Title</Label>
                  <Switch
                    checked={settings.showTitle}
                    onCheckedChange={(checked) => updateSettings({ showTitle: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Show Legend</Label>
                  <Switch
                    checked={settings.showLegend}
                    onCheckedChange={(checked) => updateSettings({ showLegend: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Show Values</Label>
                  <Switch
                    checked={settings.showValues}
                    onCheckedChange={(checked) => updateSettings({ showValues: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Styling */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Styling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Title Color</Label>
                <div className="mt-2">
                  <ColorPicker
                    value={settings.titleColor}
                    onChange={(color) => updateSettings({ titleColor: color })}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Background Color</Label>
                <div className="mt-2">
                  <ColorPicker
                    value={settings.backgroundColor}
                    onChange={(color) => updateSettings({ backgroundColor: color })}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Border Color</Label>
                <div className="mt-2">
                  <ColorPicker
                    value={settings.borderColor}
                    onChange={(color) => updateSettings({ borderColor: color })}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Border Width</Label>
                <div className="mt-2">
                  <Slider
                    value={[settings.borderWidth]}
                    onValueChange={([value]) => updateSettings({ borderWidth: value })}
                    max={10}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground mt-1">{settings.borderWidth}px</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Data Points
                <Button size="sm" onClick={addDataPoint}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.data.map((item, index) => (
                <div key={index} className="p-3 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Item {index + 1}</span>
                    {settings.data.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeDataPoint(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={item.label}
                      onChange={(e) => updateDataPoint(index, { label: e.target.value })}
                      className="mt-1"
                      placeholder="Enter label"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      type="number"
                      value={item.value}
                      onChange={(e) => updateDataPoint(index, { value: Number.parseInt(e.target.value) || 0 })}
                      className="mt-1"
                      placeholder="Enter value"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Color</Label>
                    <div className="mt-1">
                      <ColorPicker value={item.color} onChange={(color) => updateDataPoint(index, { color })} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
