"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "@/components/ui/color-picker";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";

interface TocEntry {
  title: string;
  level: number;
  page: number;
}

interface TocSettingsPanelProps {
  selectedElement: HTMLElement | null;
  onUpdate: (updates: any) => void;
  onClose: () => void;
}

// Reduced but comprehensive dummy content for all heading levels
const dummyTocEntries: TocEntry[] = [
  // H1 entries
  { title: "Executive Summary", level: 1, page: 3 },
  { title: "Methodology", level: 1, page: 5 },
  { title: "Findings", level: 1, page: 8 },
  { title: "Risk Assessment", level: 1, page: 15 },
  { title: "Recommendations", level: 1, page: 20 },

  // H2 entries
  { title: "Scope and Limitations", level: 2, page: 6 },
  { title: "Testing Approach", level: 2, page: 7 },
  { title: "High Risk Issues", level: 2, page: 12 },
  { title: "Business Impact", level: 2, page: 16 },
  { title: "Technical Risks", level: 2, page: 18 },
  { title: "Immediate Actions", level: 2, page: 21 },

  // H3 entries
  { title: "Data Exposure", level: 3, page: 14 },
  { title: "Financial Impact", level: 3, page: 17 },
  { title: "Operational Risk", level: 3, page: 19 },

  // H4 entries
  { title: "API Endpoints", level: 4, page: 14 },

  // H5 entries
  { title: "File Upload Flaws", level: 5, page: 14 },
];

export function TocSettingsPanel({
  selectedElement,
  onUpdate,
  onClose,
}: TocSettingsPanelProps) {
  const [settings, setSettings] = useState({
    title: "Table of Contents",
    titleColor: "#1f2937",
    fontFamily: "Arial",
    fontSize: 14,
    textColor: "#1f2937",
    headingLevels: [1, 2, 3],
    bulletStyle: "numbers",
    indentSize: 20,
    showBorder: false, // Default to no border
    borderStyle: "solid",
    borderColor: "#d1d5db",
    borderWidth: 1,
  });

  const fontFamilies = [
    "Arial",
    "Times New Roman",
    "Helvetica",
    "Georgia",
    "Verdana",
    "Calibri",
  ];
  const bulletStyles = [
    { value: "numbers", label: "Numbers (1.1, 1.2)" },
    { value: "bullets", label: "Bullet Points" },
    { value: "roman", label: "Roman (I, II, III)" },
    { value: "none", label: "None" },
  ];
  const borderStyles = [
    { value: "solid", label: "Solid" },
    { value: "dashed", label: "Dashed" },
    { value: "dotted", label: "Dotted" },
  ];

  const headingOptions = [
    { level: 1, label: "H1" },
    { level: 2, label: "H2" },
    { level: 3, label: "H3" },
    { level: 4, label: "H4" },
    { level: 5, label: "H5" },
  ];

  // Get filtered entries based on selected heading levels
  const getFilteredEntries = () => {
    return dummyTocEntries.filter((entry) =>
      settings.headingLevels.includes(entry.level)
    );
  };

  // Convert number to Roman numerals
  const toRoman = (num: number): string => {
    const romanNumerals = [
      { value: 1000, symbol: "M" },
      { value: 900, symbol: "CM" },
      { value: 500, symbol: "D" },
      { value: 400, symbol: "CD" },
      { value: 100, symbol: "C" },
      { value: 90, symbol: "XC" },
      { value: 50, symbol: "L" },
      { value: 40, symbol: "XL" },
      { value: 10, symbol: "X" },
      { value: 9, symbol: "IX" },
      { value: 5, symbol: "V" },
      { value: 4, symbol: "IV" },
      { value: 1, symbol: "I" },
    ];

    let result = "";
    for (const { value, symbol } of romanNumerals) {
      while (num >= value) {
        result += symbol;
        num -= value;
      }
    }
    return result;
  };

  // Initialize settings from selected element
  useEffect(() => {
    if (selectedElement) {
      selectedElement.classList.add("selected");
    }

    return () => {
      if (selectedElement) {
        selectedElement.classList.remove("selected");
      }
    };
  }, [selectedElement]);

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettingsToElement(newSettings);
    onUpdate(newSettings);
  };

  const toggleHeadingLevel = (level: number) => {
    const newLevels = settings.headingLevels.includes(level)
      ? settings.headingLevels.filter((l) => l !== level)
      : [...settings.headingLevels, level].sort();
    updateSetting("headingLevels", newLevels);
  };

  const getBulletSymbol = (
    entry: TocEntry,
    index: number,
    filteredEntries: TocEntry[]
  ) => {
    if (settings.bulletStyle === "none") return "";

    if (settings.bulletStyle === "numbers") {
      // Create hierarchical numbering like 1, 2, 3 for H1; 1.1, 1.2, 2.1 for H2; etc.
      const numbering: number[] = [];

      // Track counters for each level up to current entry
      const counters: number[] = [0, 0, 0, 0, 0, 0]; // Support up to H6

      // Process all entries up to current index to build correct hierarchical numbering
      for (let i = 0; i <= index; i++) {
        const currentEntry = filteredEntries[i];
        const currentLevel = currentEntry.level;

        // Reset deeper level counters when we encounter a higher level heading
        for (let j = currentLevel; j < counters.length; j++) {
          if (j > currentLevel - 1) {
            counters[j] = 0;
          }
        }

        // Increment counter for current level
        counters[currentLevel - 1]++;
      }

      // Build numbering string for the target entry
      const targetLevel = entry.level;
      const result = counters.slice(0, targetLevel).join(".");
      return result + ".";
    }

    if (settings.bulletStyle === "roman") {
      if (entry.level === 1) {
        // Count H1 entries before this one
        const h1Count = filteredEntries
          .slice(0, index + 1)
          .filter((e) => e.level === 1).length;
        return toRoman(h1Count) + ".";
      } else if (entry.level === 2) {
        // Count H2 entries under current H1
        const h2Count = filteredEntries
          .slice(0, index + 1)
          .filter((e) => e.level === 2).length;
        return toRoman(h2Count).toLowerCase() + ")";
      } else if (entry.level === 3) {
        // Use letters for H3
        const h3Count = filteredEntries
          .slice(0, index + 1)
          .filter((e) => e.level === 3).length;
        const letter = String.fromCharCode(96 + h3Count); // a, b, c, etc.
        return letter + ")";
      } else {
        // Use numbers in parentheses for H4+
        const count = filteredEntries
          .slice(0, index + 1)
          .filter((e) => e.level === entry.level).length;
        return `(${count})`;
      }
    }

    if (settings.bulletStyle === "bullets") {
      const bullets = ["•", "◦", "▪", "▫", "‣"];
      return bullets[Math.min(entry.level - 1, bullets.length - 1)];
    }

    return "";
  };

  const applySettingsToElement = (newSettings: typeof settings) => {
    if (!selectedElement) return;

    const filteredEntries = dummyTocEntries.filter((entry) =>
      newSettings.headingLevels.includes(entry.level)
    );

    // Update the entire TOC content with border at the edge
    selectedElement.innerHTML = `
      <div style="
        background: white; 
        font-family: ${newSettings.fontFamily};
        ${
          newSettings.showBorder
            ? `border: ${newSettings.borderWidth}px ${newSettings.borderStyle} ${newSettings.borderColor};`
            : ""
        }
      ">
        <div style="padding: 16px;">
          <h3 style="
            color: ${newSettings.titleColor} !important; 
            font-family: ${newSettings.fontFamily}; 
            font-size: ${newSettings.fontSize + 4}px; 
            font-weight: 600; 
            margin: 0 0 16px 0;
          ">
            ${newSettings.title}
          </h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${filteredEntries
              .map((entry, index) => {
                const bullet = getBulletSymbol(entry, index, filteredEntries);
                const indent = (entry.level - 1) * newSettings.indentSize;
                return `
                  <div style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: flex-start;
                    margin-left: ${indent}px;
                    color: ${newSettings.textColor};
                    font-family: ${newSettings.fontFamily};
                    font-size: ${newSettings.fontSize}px;
                    line-height: 1.4;
                  ">
                    <div style="display: flex; align-items: flex-start; flex: 1; min-width: 0;">
                      ${
                        bullet
                          ? `<span style="margin-right: 8px; flex-shrink: 0; font-weight: 500; min-width: ${
                              newSettings.bulletStyle === "roman"
                                ? "40px"
                                : "30px"
                            };">${bullet}</span>`
                          : ""
                      }
                      <span style="flex: 1; word-break: break-word;">${
                        entry.title
                      }</span>
                    </div>
                    <span style="
                      margin-left: 16px; 
                      flex-shrink: 0; 
                      font-family: 'Courier New', monospace; 
                      font-size: ${Math.max(newSettings.fontSize - 1, 10)}px;
                      color: ${newSettings.textColor};
                      opacity: 0.8;
                    ">${entry.page}</span>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
      </div>
    `;
  };

  // Apply settings when component mounts or settings change
  useEffect(() => {
    if (selectedElement) {
      applySettingsToElement(settings);
    }
  }, [selectedElement, settings]);

  if (!selectedElement) {
    return null;
  }

  return (
    <div className="w-80 bg-background border-l border-border flex flex-col h-screen">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-background border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Table of Contents Settings</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (selectedElement) {
                // Check if the element is inside a layout column
                const isInLayoutColumn =
                  selectedElement.closest(".layout-column-content") !== null ||
                  selectedElement.closest(".layout-column") !== null;

                if (isInLayoutColumn) {
                  // For elements inside layout columns, only remove the element itself
                  selectedElement.remove();
                } else {
                  // For standalone elements, remove the element-container if it exists
                  const container =
                    selectedElement.closest(".element-container");
                  if (container) {
                    container.remove();
                  } else {
                    selectedElement.remove();
                  }
                }
                onUpdate({ deleted: true });
              }
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1">
        <div className="p-4 space-y-4 pb-8">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={settings.title}
              onChange={(e) => updateSetting("title", e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Title Color */}
          <div>
            <Label className="text-sm font-medium">Title Color</Label>
            <div className="mt-2">
              <ColorPicker
                value={settings.titleColor}
                onChange={(color) => updateSetting("titleColor", color)}
              />
            </div>
          </div>

          {/* Font Family */}
          <div>
            <Label className="text-sm font-medium">Font Family</Label>
            <Select
              value={settings.fontFamily}
              onValueChange={(value) => updateSetting("fontFamily", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>{font}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div>
            <Label className="text-sm font-medium">Font Size</Label>
            <div className="mt-2 px-2">
              <Slider
                value={[settings.fontSize]}
                onValueChange={(value) => updateSetting("fontSize", value[0])}
                min={8}
                max={24}
                step={1}
                className="w-full"
              />
              <div className="text-right text-sm text-muted-foreground mt-1">
                {settings.fontSize}px
              </div>
            </div>
          </div>

          {/* Text Color */}
          <div>
            <Label className="text-sm font-medium">Text Color</Label>
            <div className="mt-2">
              <ColorPicker
                value={settings.textColor}
                onChange={(color) => updateSetting("textColor", color)}
              />
            </div>
          </div>

          {/* Include Heading Levels */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Include Heading Levels
            </Label>
            <div className="flex gap-2">
              {headingOptions.map((option) => (
                <Button
                  key={option.level}
                  variant={
                    settings.headingLevels.includes(option.level)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => toggleHeadingLevel(option.level)}
                  className={
                    settings.headingLevels.includes(option.level)
                      ? "bg-red-500 hover:bg-red-600 text-white w-12 h-8"
                      : "hover:bg-red-50 w-12 h-8"
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Showing {getFilteredEntries().length} entries
            </div>
          </div>

          {/* Bullet Style */}
          <div>
            <Label className="text-sm font-medium">Bullet Style</Label>
            <Select
              value={settings.bulletStyle}
              onValueChange={(value) => updateSetting("bulletStyle", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bulletStyles.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Indent Size */}
          <div>
            <Label className="text-sm font-medium">Indent Size</Label>
            <div className="mt-2 px-2">
              <Slider
                value={[settings.indentSize]}
                onValueChange={(value) => updateSetting("indentSize", value[0])}
                min={0}
                max={60}
                step={5}
                className="w-full"
              />
              <div className="text-right text-sm text-muted-foreground mt-1">
                {settings.indentSize}px
              </div>
            </div>
          </div>

          <Separator />

          {/* Show Border */}
          <div>
            <Label className="text-sm font-medium">Border</Label>
            <Select
              value={settings.showBorder ? "border" : "none"}
              onValueChange={(value) =>
                updateSetting("showBorder", value === "border")
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="border">Show Border</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.showBorder && (
            <>
              {/* Border Style */}
              <div>
                <Label className="text-sm font-medium">Border Style</Label>
                <Select
                  value={settings.borderStyle}
                  onValueChange={(value) => updateSetting("borderStyle", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {borderStyles.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Border Color */}
              <div>
                <Label className="text-sm font-medium">Border Color</Label>
                <div className="mt-2">
                  <ColorPicker
                    value={settings.borderColor}
                    onChange={(color) => updateSetting("borderColor", color)}
                  />
                </div>
              </div>

              {/* Border Width */}
              <div>
                <Label className="text-sm font-medium">Border Width</Label>
                <div className="mt-2 px-2">
                  <Slider
                    value={[settings.borderWidth]}
                    onValueChange={(value) =>
                      updateSetting("borderWidth", value[0])
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-right text-sm text-muted-foreground mt-1">
                    {settings.borderWidth}px
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="p-4 border-t flex gap-2">
        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );
}
