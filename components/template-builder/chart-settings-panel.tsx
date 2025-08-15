'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/ui/color-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart, LineChart, Plus, Trash2 } from 'lucide-react';

interface ChartSettingsPanelProps {
  selectedElement: HTMLElement | null;
  onUpdate: (updates: any) => void;
  onClose: () => void;
}

interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
}

interface ChartSettings {
  title: string;
  type: 'bar' | 'pie' | 'line' | 'doughnut';
  width: number;
  height: number;
  showTitle: boolean;
  showLegend: boolean;
  showValues: boolean;
  titleColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  data: ChartDataPoint[];
}

const defaultChartSettings: ChartSettings = {
  title: 'Chart Title',
  type: 'bar',
  width: 400,
  height: 300,
  showTitle: true,
  showLegend: true,
  showValues: true,
  titleColor: '#1f2937',
  backgroundColor: '#ffffff',
  borderColor: '#e5e7eb',
  borderWidth: 1,
  data: [
    { label: 'Critical', value: 5, color: '#dc2626' },
    { label: 'High', value: 12, color: '#ea580c' },
    { label: 'Medium', value: 8, color: '#d97706' },
    { label: 'Low', value: 3, color: '#65a30d' },
    { label: 'Info', value: 2, color: '#0891b2' },
  ],
};

const chartTypes = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'doughnut', label: 'Doughnut Chart', icon: PieChart },
];

const predefinedColors = [
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#65a30d',
  '#0891b2',
  '#7c3aed',
  '#c026d3',
  '#db2777',
  '#059669',
  '#0d9488',
];

export function ChartSettingsPanel({
  selectedElement,
  onUpdate,
  onClose,
}: ChartSettingsPanelProps) {
  const [settings, setSettings] = useState<ChartSettings>(defaultChartSettings);

  // Load settings from element when selected
  useEffect(() => {
    if (selectedElement) {
      try {
        const settingsAttr = selectedElement.getAttribute(
          'data-chart-settings'
        );
        if (settingsAttr) {
          const parsedSettings = JSON.parse(settingsAttr);
          setSettings({ ...defaultChartSettings, ...parsedSettings });
        } else {
          setSettings(defaultChartSettings);
        }
      } catch (error) {
        console.error('Failed to parse chart settings:', error);
        setSettings(defaultChartSettings);
      }
    }
  }, [selectedElement]);

  const updateSettings = (updates: Partial<ChartSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    if (selectedElement) {
      // Update the element's data attribute
      selectedElement.setAttribute(
        'data-chart-settings',
        JSON.stringify(newSettings)
      );

      // Update the visual representation
      updateChartElement(selectedElement, newSettings);

      // Notify parent component
      onUpdate(newSettings);
    }
  };

  const updateChartElement = (
    element: HTMLElement,
    chartSettings: ChartSettings
  ) => {
    // Check if the chart is inside a layout column
    const isInLayoutColumn =
      element.closest('.layout-column-content') !== null ||
      element.closest('.layout-column') !== null;

    console.log('Chart settings panel - updating chart:', {
      isInLayoutColumn,
      elementType: element.getAttribute('data-element-type'),
      parentClasses: element.parentElement?.className,
      layoutColumnContent: element.closest('.layout-column-content'),
      layoutColumn: element.closest('.layout-column'),
    });

    // Generate the new chart content using the appropriate generator
    const tempDiv = document.createElement('div');
    if (isInLayoutColumn) {
      tempDiv.innerHTML = generateChartHtmlForLayoutColumn(chartSettings);
      console.log('Using layout column generator for chart update');
    } else {
      tempDiv.innerHTML = generateChartHtml(chartSettings);
      console.log('Using regular generator for chart update');
    }

    const newChartDiv = tempDiv.firstElementChild as HTMLElement;
    if (!newChartDiv) return;

    // Replace the content of the existing element
    element.innerHTML = newChartDiv.innerHTML;

    // Update all relevant attributes and styles
    Array.from(newChartDiv.attributes).forEach((attr) => {
      element.setAttribute(attr.name, attr.value);
    });
    element.style.cssText = newChartDiv.style.cssText;

    // Explicitly set the chart title color in case CSS overrides inline style
    const chartTitle = element.querySelector('h3');
    if (chartTitle && chartSettings.titleColor) {
      (chartTitle as HTMLElement).style.setProperty(
        'color',
        chartSettings.titleColor,
        'important'
      );
    }

    // Explicitly set border styles to ensure they override any defaults
    if (chartSettings.borderColor && chartSettings.borderWidth !== undefined) {
      element.style.setProperty(
        'border',
        `${chartSettings.borderWidth}px solid ${chartSettings.borderColor}`,
        'important'
      );
    }
  };

  const generateChartHtml = (settings: ChartSettings): string => {
    const {
      title,
      width,
      height,
      showTitle,
      showLegend,
      showValues,
      data,
      titleColor,
      backgroundColor,
      borderColor,
      borderWidth,
      type = 'bar',
    } = settings;

    const chartAreaHeight = height - 40 - 60;
    const maxValue = Math.max(...data.map((d) => d.value));
    const barWidth = Math.max(20, (width - 80) / data.length - 10);

    // --- build the inner content ---
    let chartContent = '';

    if (type === 'bar') {
      chartContent = `
      <div style="display:flex;align-items:end;justify-content:center;height:${chartAreaHeight}px;padding:20px;">
        ${data
          .map(
            (item) => `
            <div style="display:flex;flex-direction:column;align-items:center;margin:0 5px;">
              <div style="
                width:${barWidth}px;
                height:${(
                  (item.value / maxValue) *
                  (chartAreaHeight - 80)
                ).toFixed(0)}px;
                background-color:${item.color};
                border-radius:4px 4px 0 0;
                position:relative;
              ">
                ${
                  showValues
                    ? `<div style="
                        position:absolute;
                        top:-20px;
                        left:50%;
                        transform:translateX(-50%);
                        font-size:12px;
                        font-weight:bold;
                        color:#374151;
                      ">${item.value}</div>`
                    : ''
                }
              </div>
              <div style="
                margin-top:8px;
                font-size:12px;
                text-align:center;
                max-width:${barWidth + 10}px;
                word-wrap:break-word;
                color:#374151;
              ">${item.label}</div>
            </div>`
          )
          .join('')}
      </div>
    `;
    } else if (type === 'pie' || type === 'doughnut') {
      const total = data.reduce((sum, d) => sum + d.value, 0);
      let currentAngle = 0;
      const radius = Math.min(width - 72, chartAreaHeight - 40) / 2;
      const centerX = (width - 32) / 2;
      const centerY = (chartAreaHeight - 20) / 2;
      const innerRadius = type === 'doughnut' ? radius * 0.5 : 0;

      chartContent = `
      <div style="display:flex;justify-content:center;align-items:center;height:${chartAreaHeight}px;padding:20px;">
        <svg width="${width - 32}" height="${
        chartAreaHeight - 20
      }" style="overflow:visible;">
          ${data
            .map((item) => {
              const angle = (item.value / total) * 360;
              const start = currentAngle;
              const end = currentAngle + angle;
              currentAngle += angle;
              const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
              const x1 = centerX + radius * Math.cos(rad(start));
              const y1 = centerY + radius * Math.sin(rad(start));
              const x2 = centerX + radius * Math.cos(rad(end));
              const y2 = centerY + radius * Math.sin(rad(end));
              const largeArc = angle > 180 ? 1 : 0;
              let path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
              if (type === 'doughnut') {
                const ix1 = centerX + innerRadius * Math.cos(rad(start));
                const iy1 = centerY + innerRadius * Math.sin(rad(start));
                const ix2 = centerX + innerRadius * Math.cos(rad(end));
                const iy2 = centerY + innerRadius * Math.sin(rad(end));
                path = `
                  M ${x1} ${y1}
                  A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                  L ${ix2} ${iy2}
                  A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}
                  Z
                `;
              }
              return `<path d="${path.trim()}" fill="${
                item.color
              }" stroke="#fff" stroke-width="2"/>`;
            })
            .join('')}
          ${
            showValues
              ? data
                  .map((item, idx) => {
                    const subtotal = data
                      .slice(0, idx)
                      .reduce((s, d) => s + (d.value / total) * 360, 0);
                    const midAng = subtotal + (item.value / total) * 180;
                    const aRad = ((midAng - 90) * Math.PI) / 180;
                    const r = (radius + innerRadius) / 2;
                    const x = centerX + r * Math.cos(aRad);
                    const y = centerY + r * Math.sin(aRad);
                    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="12" font-weight="bold">${item.value}</text>`;
                  })
                  .join('')
              : ''
          }
        </svg>
      </div>
    `;
    } else if (type === 'line') {
      const availW = width - 112;
      const availH = chartAreaHeight - 80;
      const spacing = data.length > 1 ? availW / (data.length - 1) : 0;

      chartContent = `
      <div style="position:relative;height:${chartAreaHeight}px;padding:30px 40px 50px 40px;">
        <svg width="${availW}" height="${availH}" style="overflow:visible;">
          ${data
            .map((item, i) => {
              const x = i * spacing;
              const y = availH - 40 - (item.value / maxValue) * (availH - 60);
              const next = data[i + 1];
              let seg = '';
              if (next) {
                const nx = (i + 1) * spacing;
                const ny =
                  availH - 40 - (next.value / maxValue) * (availH - 60);
                seg = `<line x1="${x}" y1="${y}" x2="${nx}" y2="${ny}" stroke="${item.color}" stroke-width="3"/>`;
              }
              return `
                ${seg}
                <circle cx="${x}" cy="${y}" r="6" fill="${
                item.color
              }" stroke="#fff" stroke-width="2"/>
                ${
                  showValues
                    ? `<text x="${x}" y="${
                        y - 15
                      }" text-anchor="middle" font-size="12" font-weight="bold" fill="#374151">${
                        item.value
                      }</text>`
                    : ''
                }
              `;
            })
            .join('')}
        </svg>
        <div style="position:absolute;bottom:10px;left:40px;right:40px;display:flex;justify-content:space-between;">
          ${data
            .map(
              (item) =>
                `<div style="font-size:11px;text-align:center;color:#374151;flex:1;">${item.label}</div>`
            )
            .join('')}
        </div>
      </div>
    `;
    }

    // --- wrap up the chart container ---
    const html = `
    <div style="
      width:${width}px;
      background:${backgroundColor};
      border:${borderWidth}px solid ${borderColor};
      border-radius:8px;
      padding:16px;
      font-family:Arial,sans-serif;
      position:relative;
      cursor:default;
    " data-element-type="chart" data-element-id="chart-${Date.now()}" data-chart-settings='${JSON.stringify(
      settings
    )}' draggable="false" contenteditable="false">
      <div class="drag-handle content-element-drag-handle" style="
        position:absolute;
        top:8px;
        left:-24px;
        width:16px;
        height:16px;
        background:#cbd5e1;
        border-radius:50%;
        cursor:grab;
        display:flex;
        align-items:center;
        justify-content:center;
        opacity:0.5;
        transition:opacity 0.2s;
      " title="Select Chart">
        <!-- svg icon here -->
      </div>
      ${
        showTitle
          ? `<h3 style="margin:0 0 16px 0;text-align:center;color:${titleColor};font-size:16px;font-weight:bold;">${title}</h3>`
          : ''
      }
      ${chartContent}
      ${
        showLegend
          ? `<div style="display:flex;justify-content:center;flex-wrap:wrap;margin-top:16px;gap:12px;">
              ${data
                .map(
                  (item) => `
                  <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:12px;height:12px;background:${item.color};border-radius:2px;"></div>
                    <span style="font-size:12px;color:#374151;">${item.label}</span>
                  </div>`
                )
                .join('')}
            </div>`
          : ''
      }
    </div>
  `;

    // strip ALL internal newlines + indentation
    return html.trim().replace(/\n\s*/g, '');
  };

  // Generate a chart HTML that fits inside a layout column (responsive, width: 100%)
  const generateChartHtmlForLayoutColumn = (
    settings: ChartSettings
  ): string => {
    const {
      title,
      showTitle,
      showLegend,
      showValues,
      data,
      titleColor,
      backgroundColor,
      borderColor,
      borderWidth,
      type = 'bar',
    } = settings;

    const maxValue = Math.max(...data.map((d) => d.value));
    let chartContent = '';

    if (type === 'bar') {
      chartContent = `
        <div style="display: flex; align-items: end; justify-content: space-evenly; height: 120px; padding: 8px 4px; width: 100%; box-sizing: border-box; overflow: hidden;">
          ${data
            .map(
              (item) => `
                <div style="display: flex; flex-direction: column; align-items: center; flex: 1; max-width: none; margin: 0 2px; min-width: 0; overflow: hidden;">
                  <div style="
                    width: 100%; 
                    max-width: 32px; 
                    height: ${Math.max(12, (item.value / maxValue) * 80)}px; 
                    background-color: ${item.color}; 
                    border-radius: 4px 4px 0 0; 
                    position: relative; 
                    margin: 0 auto;
                    flex-shrink: 0;
                  ">
                    ${
                      showValues
                        ? `<div style="position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: bold; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px;">${item.value}</div>`
                        : ''
                    }
                  </div>
                  <div style="margin-top: 4px; font-size: 10px; text-align: center; color: #374151; word-break: break-word; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; max-height: 2.4em;">${
                    item.label
                  }</div>
                </div>`
            )
            .join('')}
        </div>
      `;
    } else if (type === 'pie' || type === 'doughnut') {
      const total = data.reduce((sum, item) => sum + item.value, 0);
      let currentAngle = 0;
      const radius = 40;
      const centerX = 50;
      const centerY = 50;
      const innerRadius = type === 'doughnut' ? radius * 0.5 : 0;

      chartContent = `
        <div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 120px; padding: 8px;">
          <svg width="100" height="100" viewBox="0 0 100 100" style="max-width: 100%; max-height: 100%; height: auto;">
            ${data
              .map((item) => {
                const angle = (item.value / total) * 360;
                const start = currentAngle;
                const end = currentAngle + angle;
                currentAngle += angle;
                const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
                const x1 = centerX + radius * Math.cos(rad(start));
                const y1 = centerY + radius * Math.sin(rad(start));
                const x2 = centerX + radius * Math.cos(rad(end));
                const y2 = centerY + radius * Math.sin(rad(end));
                const largeArc = angle > 180 ? 1 : 0;
                let path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                if (type === 'doughnut') {
                  const ix1 = centerX + innerRadius * Math.cos(rad(start));
                  const iy1 = centerY + innerRadius * Math.sin(rad(start));
                  const ix2 = centerX + innerRadius * Math.cos(rad(end));
                  const iy2 = centerY + innerRadius * Math.sin(rad(end));
                  path = `
                    M ${x1} ${y1}
                    A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                    L ${ix2} ${iy2}
                    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}
                    Z
                  `;
                }
                return `<path d="${path.trim()}" fill="${
                  item.color
                }" stroke="#fff" stroke-width="2"/>`;
              })
              .join('')}
            ${
              showValues
                ? data
                    .map((item, idx) => {
                      const subtotal = data
                        .slice(0, idx)
                        .reduce((s, d) => s + (d.value / total) * 360, 0);
                      const midAng = subtotal + (item.value / total) * 180;
                      const aRad = ((midAng - 90) * Math.PI) / 180;
                      const r = (radius + innerRadius) / 2;
                      const x = centerX + r * Math.cos(aRad);
                      const y = centerY + r * Math.sin(aRad);
                      return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="10" font-weight="bold">${item.value}</text>`;
                    })
                    .join('')
                : ''
            }
          </svg>
        </div>
      `;
    } else if (type === 'line') {
      chartContent = `
        <div style="width: 100%; height: 120px; padding: 8px; box-sizing: border-box;">
          <svg width="100%" height="100%" viewBox="0 0 200 100" style="max-width: 100%; height: auto;" preserveAspectRatio="xMidYMid meet">
            ${data
              .map((item, index) => {
                const x = (index / (data.length - 1)) * 180 + 10;
                const y = 80 - (item.value / maxValue) * 60;
                const next = data[index + 1];
                let line = '';
                if (next) {
                  const nextX = ((index + 1) / (data.length - 1)) * 180 + 10;
                  const nextY = 80 - (next.value / maxValue) * 60;
                  line = `<line x1="${x}" y1="${y}" x2="${nextX}" y2="${nextY}" stroke="${item.color}" stroke-width="2"/>`;
                }
                return `
                  ${line}
                  <circle cx="${x}" cy="${y}" r="4" fill="${
                  item.color
                }" stroke="#fff" stroke-width="2"/>
                  ${
                    showValues
                      ? `<text x="${x}" y="${
                          y - 10
                        }" text-anchor="middle" font-size="8" font-weight="bold" fill="#374151">${
                          item.value
                        }</text>`
                      : ''
                  }
                `;
              })
              .join('')}
          </svg>
        </div>
      `;
    }

    return `
      <div style="width: 100% !important; max-width: 100% !important; min-width: 0 !important; height: auto; background: ${backgroundColor}; border: ${borderWidth}px solid ${borderColor}; border-radius: 8px; padding: 12px; font-family: Arial, sans-serif; cursor: default; position: relative; box-sizing: border-box !important; overflow: hidden !important; display: block !important; flex-shrink: 1 !important;" data-element-type="chart" data-element-id="chart-${Date.now()}" data-chart-settings='${JSON.stringify(
      settings
    )}' draggable="false" contenteditable="false">
        <div class="drag-handle content-element-drag-handle" style="position: absolute; top: 8px; left: -24px; width: 16px; height: 16px; background: #cbd5e1; border-radius: 50%; cursor: grab; display: flex; align-items: center; justify-content: center; opacity: 0.5; transition: opacity 0.2s;" title="Select Chart">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
        </div>
        ${
          showTitle
            ? `<h3 style="margin: 0 0 12px 0; text-align: center; color: ${titleColor} !important; font-size: 14px; font-weight: bold; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</h3>`
            : ''
        }
        ${chartContent}
        ${
          showLegend
            ? `<div style="display: flex; justify-content: center; flex-wrap: wrap; margin-top: 12px; gap: 8px; max-width: 100%; overflow: hidden;">
              ${data
                .map(
                  (item) =>
                    `<div style="display: flex; align-items: center; gap: 4px; min-width: 0; flex-shrink: 1;">
                      <div style="width: 8px; height: 8px; background: ${item.color}; border-radius: 2px; flex-shrink: 0;"></div>
                      <span style="font-size: 10px; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.label}</span>
                    </div>`
                )
                .join('')}
            </div>`
            : ''
        }
      </div>
    `;
  };

  const addDataPoint = () => {
    const newDataPoint: ChartDataPoint = {
      label: `Item ${settings.data.length + 1}`,
      value: 1,
      color: predefinedColors[settings.data.length % predefinedColors.length],
    };
    updateSettings({ data: [...settings.data, newDataPoint] });
  };

  const removeDataPoint = (index: number) => {
    if (settings.data.length > 1) {
      const newData = settings.data.filter((_, i) => i !== index);
      updateSettings({ data: newData });
    }
  };

  const updateDataPoint = (index: number, updates: Partial<ChartDataPoint>) => {
    const newData = settings.data.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    updateSettings({ data: newData });
  };

  if (!selectedElement) return null;

  return (
    <div className='w-80 bg-background border-l border-border flex flex-col'>
      <div className='p-4 border-b border-border flex items-center justify-between'>
        <h3 className='font-semibold text-foreground'>Chart Settings</h3>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => {
            if (selectedElement) {
              // Check if the element is inside a layout column
              const isInLayoutColumn =
                selectedElement.closest('.layout-column-content') !== null ||
                selectedElement.closest('.layout-column') !== null;

              if (isInLayoutColumn) {
                // For elements inside layout columns, only remove the element itself
                selectedElement.remove();
              } else {
                // For standalone elements, remove the element-container if it exists
                const container = selectedElement.closest('.element-container');
                if (container) {
                  container.remove();
                } else {
                  selectedElement.remove();
                }
              }
              onUpdate({ deleted: true });
            }
          }}
          className='text-red-600 hover:text-red-700 hover:bg-red-50'
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>

      <ScrollArea className='flex-1'>
        <div className='p-4 space-y-6'>
          {/* Chart Type */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm'>Chart Type</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='grid grid-cols-2 gap-2'>
                {chartTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      variant={
                        settings.type === type.value ? 'default' : 'outline'
                      }
                      size='sm'
                      className='flex flex-col h-16 p-2'
                      onClick={() =>
                        updateSettings({ type: type.value as any })
                      }
                    >
                      <Icon className='h-4 w-4 mb-1' />
                      <span className='text-xs'>
                        {type.label.split(' ')[0]}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Chart Properties */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm'>Properties</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label className='text-sm font-medium'>Title</Label>
                <Input
                  value={settings.title}
                  onChange={(e) => updateSettings({ title: e.target.value })}
                  className='mt-1'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <Label className='text-sm font-medium'>Width</Label>
                  <Input
                    type='number'
                    value={settings.width}
                    onChange={(e) =>
                      updateSettings({
                        width: Number.parseInt(e.target.value) || 400,
                      })
                    }
                    className='mt-1'
                  />
                </div>
                <div>
                  <Label className='text-sm font-medium'>Height</Label>
                  <Input
                    type='number'
                    value={settings.height}
                    onChange={(e) =>
                      updateSettings({
                        height: Number.parseInt(e.target.value) || 300,
                      })
                    }
                    className='mt-1'
                  />
                </div>
              </div>

              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label className='text-sm font-medium'>Show Title</Label>
                  <Switch
                    checked={settings.showTitle}
                    onCheckedChange={(checked) =>
                      updateSettings({ showTitle: checked })
                    }
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <Label className='text-sm font-medium'>Show Legend</Label>
                  <Switch
                    checked={settings.showLegend}
                    onCheckedChange={(checked) =>
                      updateSettings({ showLegend: checked })
                    }
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <Label className='text-sm font-medium'>Show Values</Label>
                  <Switch
                    checked={settings.showValues}
                    onCheckedChange={(checked) =>
                      updateSettings({ showValues: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Styling */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm'>Styling</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label className='text-sm font-medium'>Title Color</Label>
                <div className='mt-2'>
                  <ColorPicker
                    value={settings.titleColor}
                    onChange={(color) => updateSettings({ titleColor: color })}
                  />
                </div>
              </div>

              <div>
                <Label className='text-sm font-medium'>Background Color</Label>
                <div className='mt-2'>
                  <ColorPicker
                    value={settings.backgroundColor}
                    onChange={(color) =>
                      updateSettings({ backgroundColor: color })
                    }
                  />
                </div>
              </div>

              <div>
                <Label className='text-sm font-medium'>Border Color</Label>
                <div className='mt-2'>
                  <ColorPicker
                    value={settings.borderColor}
                    onChange={(color) => updateSettings({ borderColor: color })}
                  />
                </div>
              </div>

              <div>
                <Label className='text-sm font-medium'>Border Width</Label>
                <div className='mt-2'>
                  <Slider
                    value={[settings.borderWidth]}
                    onValueChange={([value]) =>
                      updateSettings({ borderWidth: value })
                    }
                    max={10}
                    min={0}
                    step={1}
                    className='w-full'
                  />
                  <div className='text-sm text-muted-foreground mt-1'>
                    {settings.borderWidth}px
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm flex items-center justify-between'>
                Data Points
                <Button size='sm' onClick={addDataPoint}>
                  <Plus className='h-4 w-4' />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm border border-border rounded-lg'>
                  <thead>
                    <tr className='bg-muted'>
                      <th className='px-2 py-1 text-left font-medium'>Label</th>
                      <th className='px-2 py-1 text-left font-medium'>Value</th>
                      <th className='px-2 py-1 text-left font-medium'>Color</th>
                      <th className='px-2 py-1 text-center font-medium'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.data.map((item, index) => (
                      <tr key={index} className='border-t border-border'>
                        <td className='px-2 py-1'>
                          <input
                            type='text'
                            value={item.label}
                            onChange={(e) =>
                              updateDataPoint(index, { label: e.target.value })
                            }
                            placeholder='Enter label'
                            className='w-fit max-w-20 px-2 py-2 text-xs border rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                          />
                        </td>
                        <td className='px-2 py-1'>
                          <input
                            type='number'
                            value={item.value}
                            onChange={(e) =>
                              updateDataPoint(index, {
                                value: Number.parseInt(e.target.value) || 0,
                              })
                            }
                            min='0'
                            className='w-fit max-w-12 px-2 py-2 text-xs border rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                          />
                        </td>
                        <td className='px-2 py-1'>
                          <ColorPicker
                            value={item.color}
                            onChange={(color) =>
                              updateDataPoint(index, { color })
                            }
                            showValue={false}
                          />
                        </td>
                        <td className='px-2 py-1 text-center'>
                          {settings.data.length > 1 && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => removeDataPoint(index)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
      <div className='p-4 border-t flex gap-2'>
        <Button variant='outline' onClick={onClose} className='w-full'>
          Close
        </Button>
      </div>
    </div>
  );
}
