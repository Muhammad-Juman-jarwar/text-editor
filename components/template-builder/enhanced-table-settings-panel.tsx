"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EnhancedTableComponent } from "./enhanced-table-component";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ChevronLeft } from "lucide-react";

interface TableSettingsPanelProps {
  selectedElement: HTMLElement | null;
  onUpdate: (updates: any) => void;
  onClose?: () => void;
}

export function EnhancedTableSettingsPanel({
  selectedElement,
  onUpdate,
  onClose,
}: TableSettingsPanelProps) {
  const [tableHtml, setTableHtml] = useState<string>("");
  const [tableId] = useState(`table-${Date.now()}`);
  const [theme, setTheme] = useState<any>(null);

  // When the component mounts, extract existing table HTML if any
  useEffect(() => {
    if (selectedElement) {
      // Extract theme if available through parent components
      const themeData = selectedElement
        .closest("[data-theme]")
        ?.getAttribute("data-theme");
      if (themeData) {
        try {
          setTheme(JSON.parse(themeData));
        } catch (error) {
          console.error("Failed to parse theme data:", error);
        }
      }

      // Extract table content or settings
      try {
        // Check if there's already a table
        const existingTable = selectedElement.querySelector("table");
        if (existingTable) {
          const wrapper = document.createElement("div");
          wrapper.appendChild(existingTable.cloneNode(true));
          setTableHtml(wrapper.innerHTML);
        } else {
          // No table found, use default from the EnhancedTableComponent
          setTableHtml("");
        }
      } catch (error) {
        console.error("Failed to extract table content:", error);
        setTableHtml("");
      }
    }
  }, [selectedElement]);

  const handleTableUpdate = useCallback(
    (html: string) => {
      setTableHtml(html);

      // Use setTimeout to defer the DOM updates and state changes to avoid
      // state updates during render
      setTimeout(() => {
        if (selectedElement) {
          // Store table data in the container's attributes for future editing
          selectedElement.setAttribute("data-element-type", "table");

          // We'll update the table content in the DOM
          if (!selectedElement.querySelector(".table-container")) {
            // Create wrapper if it doesn't exist
            const wrapper = document.createElement("div");
            wrapper.className = "table-container";
            wrapper.innerHTML = html;

            // Clear existing content and add the new table
            selectedElement.innerHTML = "";
            selectedElement.appendChild(wrapper);
          } else {
            // Update existing wrapper
            const wrapper = selectedElement.querySelector(".table-container");
            if (wrapper) wrapper.innerHTML = html;
          }

          // Notify parent components after render is complete
          onUpdate({ tableHtml: html });
        }
      }, 0);
    },
    [selectedElement, onUpdate]
  );

  const handleDelete = () => {
    if (selectedElement) {
      // Check if the element is inside a layout column
      const isInLayoutColumn = 
        selectedElement.closest('.layout-column-content') !== null ||
        selectedElement.closest('.layout-column') !== null;

      if (isInLayoutColumn) {
        // For elements inside layout columns, only remove the element itself
        selectedElement.remove();
      } else {
        // For standalone elements, look for parent container first
        const container =
          selectedElement.closest(".element-container") ||
          selectedElement.parentElement?.closest(".element-container");

        if (container) {
          container.remove();
        } else {
          selectedElement.remove();
        }
      }

      // Notify parent about deletion
      onUpdate({ deleted: true });
      if (onClose) onClose();
    }
  };

  return (
    <div className="w-80 bg-background border-l border-border flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="mr-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <h3 className="font-semibold text-foreground">Table Editor</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          title="Delete Table"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Table Content</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedTableComponent
                initialContent={tableHtml || undefined}
                onUpdate={handleTableUpdate}
                tableId={tableId}
                theme={theme}
              />
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground">
            Select cells to edit their content. Use the toolbar to add/remove
            rows and columns or merge/split cells.
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
