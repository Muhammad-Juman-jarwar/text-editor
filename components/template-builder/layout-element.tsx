"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "@/components/ui/color-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, X, GripVertical, Plus } from "lucide-react";
import { setFocusedColumn, getFocusedColumn } from "./focus-tracker";

interface LayoutElementProps {
  element: {
    id: string;
    type: "layout";
    settings: {
      columns: number;
      columnGap: number;
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
      borderRadius: number;
      padding: number;
      minHeight: number;
    };
    content: {
      columns: Array<{
        id: string;
        content: string;
      }>;
    };
  };
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function LayoutElement({
  element,
  onUpdate,
  onDelete,
  onClose,
}: LayoutElementProps) {
  const [localContent, setLocalContent] = useState(element.content);

  const handleColumnContentChange = (columnIndex: number, content: string) => {
    const updatedColumns = [...localContent.columns];
    if (updatedColumns[columnIndex]) {
      updatedColumns[columnIndex].content = content;
      const newContent = { ...localContent, columns: updatedColumns };
      setLocalContent(newContent);
      onUpdate({ content: newContent });
    }
  };

  const updateColumns = (newColumnCount: number) => {
    const currentColumns = localContent.columns || [];
    const newColumns = Array.from({ length: newColumnCount }).map(
      (_, index) => ({
        id: `col-${index}`,
        content: currentColumns[index]?.content || "",
      })
    );

    const newContent = { ...localContent, columns: newColumns };
    setLocalContent(newContent);
    onUpdate({
      settings: { ...element.settings, columns: newColumnCount },
      content: newContent,
    });
  };

  return (
    <div
      className="element-container"
      style={{ width: "100%", margin: "16px 0" }}
    >
      <div
        className="layout-element"
        data-element-type="layout"
        data-element-id={element.id}
        data-settings={JSON.stringify(element.settings)}
        style={{
          width: "100%",
          minHeight: `${element.settings.minHeight || 120}px`,
          backgroundColor: element.settings.backgroundColor || "#ffffff",
          border: `${element.settings.borderWidth || 1}px solid ${
            element.settings.borderColor || "#e5e7eb"
          }`,
          borderRadius: `${element.settings.borderRadius || 8}px`,
          padding: `${element.settings.padding || 16}px`,
          display: "flex",
          gap: `${element.settings.columnGap || 16}px`,
          position: "relative",
        }}
      >
        {/* Drag Handle */}
        <div
          className="drag-handle absolute -left-6 top-2 opacity-0 hover:opacity-100 transition-opacity cursor-grab bg-blue-500 text-white rounded p-1"
          style={{ zIndex: 10 }}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Columns */}
        {Array.from({ length: element.settings.columns || 2 }).map(
          (_, index) => {
            const columnContent = localContent.columns?.[index]?.content || "";
            return (
              <div
                key={index}
                className="layout-column"
                style={{
                  flex: 1,
                  minHeight: "80px",
                  border: "2px dashed #d1d5db",
                  borderRadius: "4px",
                  padding: "12px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    fontSize: "10px",
                    color: "#9ca3af",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <Plus className="h-3 w-3" />
                  <span>Col {index + 1}</span>
                </div>

                {/* Editable Content */}
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="layout-column-content"
                  style={{
                    flex: 1,
                    outline: "none",
                    fontSize: "14px",
                    color: "#374151",
                    lineHeight: "1.5",
                    minHeight: "60px",
                    paddingTop: "20px", // Space for header
                  }}
                  onBlur={(e) => {
                    handleColumnContentChange(index, e.target.innerHTML);
                    // Clear focus if this was the focused column
                    if (e.target === getFocusedColumn()) setFocusedColumn(null);
                  }}
                  onFocus={(e) => {
                    setFocusedColumn(e.currentTarget);
                    if (
                      e.target.textContent?.trim() === `Column ${index + 1}` ||
                      e.target.textContent?.trim() === ""
                    ) {
                      e.target.innerHTML = "";
                    }
                  }}
                  onClick={(e) => setFocusedColumn(e.currentTarget)}
                  dangerouslySetInnerHTML={{
                    __html:
                      columnContent ||
                      `<p style="color: #9ca3af; font-style: italic;">Click to add content...</p>`,
                  }}
                />
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

interface LayoutSettingsPanelProps {
  selectedElement: HTMLElement;
  onUpdate: (updates: any) => void;
  onClose: () => void;
}

export function LayoutSettingsPanel({
  selectedElement,
  onUpdate,
  onClose,
}: LayoutSettingsPanelProps) {
  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(selectedElement.getAttribute("data-settings") || "{}");
    } catch {
      return {
        columns: 2,
        columnGap: 16,
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        minHeight: 120,
      };
    }
  });

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Update the element's data attribute
    selectedElement.setAttribute("data-settings", JSON.stringify(newSettings));

    // Apply visual updates immediately
    const layoutElement = selectedElement.querySelector(
      ".layout-element"
    ) as HTMLElement;
    if (layoutElement) {
      if (key === "backgroundColor") {
        layoutElement.style.backgroundColor = value;
      } else if (key === "borderColor") {
        layoutElement.style.borderColor = value;
      } else if (key === "borderWidth") {
        layoutElement.style.borderWidth = `${value}px`;
      } else if (key === "borderRadius") {
        layoutElement.style.borderRadius = `${value}px`;
      } else if (key === "padding") {
        layoutElement.style.padding = `${value}px`;
      } else if (key === "columnGap") {
        layoutElement.style.gap = `${value}px`;
      } else if (key === "minHeight") {
        layoutElement.style.minHeight = `${value}px`;
      } else if (key === "columns") {
        // Handle column count change
        const currentColumns = layoutElement.querySelectorAll(".layout-column");
        const currentCount = currentColumns.length;

        if (value > currentCount) {
          // Add columns
          for (let i = currentCount; i < value; i++) {
            const newColumn = document.createElement("div");
            newColumn.className = "layout-column";
            newColumn.style.cssText = `
              flex: 1;
              min-height: 80px;
              border: 2px dashed #d1d5db;
              border-radius: 4px;
              padding: 12px;
              position: relative;
              display: flex;
              flex-direction: column;
            `;
            newColumn.innerHTML = `
              <div style="position: absolute; top: 4px; right: 4px; font-size: 10px; color: #9ca3af; pointer-events: none; display: flex; align-items: center; gap: 2px;">
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                <span>Col ${i + 1}</span>
              </div>
              <div contenteditable="true" class="layout-column-content" style="flex: 1; outline: none; font-size: 14px; color: #374151; line-height: 1.5; min-height: 60px; padding-top: 20px;">
                <p style="color: #9ca3af; font-style: italic;">Click to add content...</p>
              </div>
            `;
            layoutElement.appendChild(newColumn);
          }
        } else if (value < currentCount) {
          // Remove columns
          for (let i = currentCount - 1; i >= value; i--) {
            currentColumns[i].remove();
          }
        }
      }
    }

    onUpdate({ settings: newSettings });
  };

  return (
    <div className="w-80 bg-background border-l border-border h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Layout Settings</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Multi-column layout element
        </p>
      </div>

      <div className="p-4 space-y-6">
        <Tabs defaultValue="layout" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="space-y-4">
            <div>
              <Label className="text-xs">Number of Columns</Label>
              <Select
                value={settings.columns?.toString() || "2"}
                onValueChange={(value) =>
                  updateSetting("columns", Number.parseInt(value))
                }
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

            <div>
              <Label className="text-xs">Column Gap</Label>
              <Slider
                value={[settings.columnGap || 16]}
                onValueChange={([value]) => updateSetting("columnGap", value)}
                min={0}
                max={50}
                step={2}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {settings.columnGap || 16}px
              </div>
            </div>

            <div>
              <Label className="text-xs">Padding</Label>
              <Slider
                value={[settings.padding || 16]}
                onValueChange={([value]) => updateSetting("padding", value)}
                min={0}
                max={50}
                step={2}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {settings.padding || 16}px
              </div>
            </div>

            <div>
              <Label className="text-xs">Minimum Height</Label>
              <Slider
                value={[settings.minHeight || 120]}
                onValueChange={([value]) => updateSetting("minHeight", value)}
                min={60}
                max={400}
                step={10}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {settings.minHeight || 120}px
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <div>
              <Label className="text-xs">Background Color</Label>
              <ColorPicker
                value={settings.backgroundColor || "#ffffff"}
                onChange={(color) => updateSetting("backgroundColor", color)}
              />
            </div>

            <div>
              <Label className="text-xs">Border Color</Label>
              <ColorPicker
                value={settings.borderColor || "#e5e7eb"}
                onChange={(color) => updateSetting("borderColor", color)}
              />
            </div>

            <div>
              <Label className="text-xs">Border Width</Label>
              <Slider
                value={[settings.borderWidth || 1]}
                onValueChange={([value]) => updateSetting("borderWidth", value)}
                min={0}
                max={10}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {settings.borderWidth || 1}px
              </div>
            </div>

            <div>
              <Label className="text-xs">Border Radius</Label>
              <Slider
                value={[settings.borderRadius || 8]}
                onValueChange={([value]) =>
                  updateSetting("borderRadius", value)
                }
                min={0}
                max={50}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {settings.borderRadius || 8}px
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <Button
          variant="destructive"
          size="sm"
          onClick={onClose}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Layout
        </Button>
      </div>
    </div>
  );
}
