"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import debounce from "lodash/debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ColorPicker } from "@/components/ui/color-picker"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus, Merge, Split, AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react"

// Define types for cell data and table settings
interface CellData {
  row: number
  col: number
  content: string
  isHeader: boolean
  colspan: number
  rowspan: number
  merged: boolean
  mergedWith?: { row: number; col: number }
}

interface TableSettings {
  rows: number;
  columns: number;
  hasHeader: boolean;
  showBorders: boolean;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  headerBackgroundColor: string;
  headerTextColor: string;
  cellBackgroundColor: string;
  cellTextColor: string;
  cellPadding: number;
  fontSize: number;
  fontFamily: string;
  fullWidth: boolean;
  selectedCells: { row: number; col: number }[];
  data: CellData[][];
  columnWidths?: number[];
}

interface TableSettingsPanelProps {
  selectedElement: HTMLElement | null
  onUpdate: (updates: TableSettings) => void
  onClose: () => void
}

const createDefaultCell = (content: string, isHeader: boolean, defaults: Partial<TableSettings>): CellData => ({
  content,
  colspan: 1,
  rowspan: 1,
  isHeader,
  merged: false,
  row: 0,
  col: 0
})

const generateInitialData = (
  numDataRows: number,
  numColumns: number,
  hasHeader: boolean,
  defaults: Partial<TableSettings>,
): CellData[][] => {
  const data: CellData[][] = []
  const totalRows = numDataRows + (hasHeader ? 1 : 0)

  for (let r = 0; r < totalRows; r++) {
    const rowData: CellData[] = []
    const isHeaderRow = hasHeader && r === 0
    for (let c = 0; c < numColumns; c++) {
      rowData.push(
        createDefaultCell(
          isHeaderRow ? `Header ${c + 1}` : `Cell ${isHeaderRow ? 1 : r - (hasHeader ? 1 : 0) + 1}-${c + 1}`,
          isHeaderRow,
          defaults,
        ),
      )
    }
    data.push(rowData)
  }
  return data
}

const defaultTableSettings: TableSettings = {
  rows: 3,
  columns: 3,
  hasHeader: true,
  showBorders: true,
  borderColor: "#d1d5db",
  borderWidth: 1,
  borderRadius: 0,
  headerBackgroundColor: "#f8f9fa",
  headerTextColor: "#1f2937",
  cellBackgroundColor: "#ffffff",
  cellTextColor: "#1f2937",
  cellPadding: 12,
  fontSize: 14,
  fontFamily: "Arial",
  selectedCells: [],
  data: [], // Will be initialized by generateInitialData
  fullWidth: false, // Default to standard width
}
defaultTableSettings.data = generateInitialData(
  defaultTableSettings.rows,
  defaultTableSettings.columns,
  defaultTableSettings.hasHeader,
  defaultTableSettings,
)

const fontFamilies = ["Arial", "Times New Roman", "Helvetica", "Georgia", "Verdana", "Calibri"]

export const TableSettingsPanel = ({ selectedElement, onUpdate, onClose }: TableSettingsPanelProps): React.ReactElement => {
  // Debug information
  console.log("TableSettingsPanel rendered with:", {
    selectedElement: selectedElement ? `Element: ${selectedElement.tagName}` : "null",
    hasDataAttr: selectedElement ? !!selectedElement.getAttribute("data-table-settings") : false,
  });
  // Track when user is actively editing cell text content
  const [isEditingText, setIsEditingText] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [settings, setSettings] = useState<TableSettings>(defaultTableSettings);
  const [previewTable, setPreviewTable] = useState<HTMLTableElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isInteractingWithTable, setIsInteractingWithTable] = useState(false);
  const isInitialMount = useRef(true);

  
  // Reference to track initialization state to prevent infinite loops
  const initializedRef = useRef<boolean>(false);
  
  // Reference to track when updates are triggered manually vs programmatically
  const manualUpdateRef = useRef<boolean>(false);
  
  // Reference for debounced updates
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to parse an existing table into our data format
  const parseExistingTable = useCallback((element: HTMLElement): TableSettings => {
    // First, check if we have a data-table-settings attribute on the parent element
    // If so, use that as our primary source of truth
    const parentElement = element.closest('[data-table-settings]');
    if (parentElement) {
      try {
        const settingsAttr = parentElement.getAttribute('data-table-settings');
        if (settingsAttr) {
          const parsedSettings = JSON.parse(settingsAttr);
          if (parsedSettings && parsedSettings.data && parsedSettings.data.length > 0) {
            // We have valid data in the attribute, use it
            return { ...defaultTableSettings, ...parsedSettings };
          }
        }
      } catch (err) {
        console.error('Failed to parse table settings from attribute:', err);
        // Continue with HTML parsing as fallback
      }
    }
    
    // Fallback to parsing the HTML structure
    const tRows = Array.from(element.querySelectorAll("tr"))
    let numCols = 0
    tRows.forEach((tr) => {
      let currentCols = 0
      Array.from(tr.children).forEach((cell) => {
        currentCols += Number.parseInt(cell.getAttribute("colspan") || "1")
      })
      if (currentCols > numCols) numCols = currentCols
    })

    const newSettings = { ...defaultTableSettings, columns: numCols, data: [] as CellData[][] }
    let hasHeader = false
    if (tRows.length > 0 && tRows[0].querySelector("th")) {
      hasHeader = true
    }
    newSettings.hasHeader = hasHeader
    newSettings.rows = hasHeader ? tRows.length - 1 : tRows.length

    // Create a grid matching the table dimensions, initially all cells are not merged
    const grid: CellData[][] = Array(tRows.length)
      .fill(null)
      .map(() =>
        Array(numCols)
          .fill(null)
          .map((_, cIndex) =>
            createDefaultCell(`Parsed ${cIndex}`, false, newSettings /* Pass newSettings for default colors */),
          ),
      )

    // Detect and track merged cells
    const mergedCells = new Set();

    tRows.forEach((tr, rIndex) => {
      let currentGridCol = 0
      Array.from(tr.children).forEach((cell) => {
        // Skip cells already covered by a rowspan from a previous row
        while (currentGridCol < numCols && 
               grid[rIndex][currentGridCol] && 
               grid[rIndex][currentGridCol].merged) {
          currentGridCol++
        }
        
        // Skip if we've gone past the end of the row
        if (currentGridCol >= numCols) return;

        const htmlCell = cell as HTMLTableCellElement
        const colspan = Number.parseInt(htmlCell.getAttribute("colspan") || "1")
        const rowspan = Number.parseInt(htmlCell.getAttribute("rowspan") || "1")
        const isTh = htmlCell.tagName === "TH"
        const isMergedMaster = htmlCell.hasAttribute('data-is-merged-master')

        // Store cell content and data
        grid[rIndex][currentGridCol] = {
          content: htmlCell.innerText || "",
          colspan: colspan,
          rowspan: rowspan,
          isHeader: isTh,
          merged: false,
          row: rIndex,
          col: currentGridCol
        }

        // Mark cells covered by colspan and rowspan as merged
        if (colspan > 1 || rowspan > 1) {
          // Keep track of which cells are merged for easier debugging
          mergedCells.add(`${rIndex},${currentGridCol}`);
          
          for (let i = 0; i < rowspan; i++) {
            for (let j = 0; j < colspan; j++) {
              if (i === 0 && j === 0) continue // Don't mark the main cell itself as merged
              if (rIndex + i < tRows.length && currentGridCol + j < numCols) {
                grid[rIndex + i][currentGridCol + j].merged = true;
                grid[rIndex + i][currentGridCol + j].mergedWith = { row: rIndex, col: currentGridCol };
                grid[rIndex + i][currentGridCol + j].content = ""; // Clear content of covered cells
                mergedCells.add(`${rIndex+i},${currentGridCol+j}`); // Add to tracking set
              }
            }
          }
        }
        
        currentGridCol += colspan
      })
    })
    
    console.log(`Parsed table with ${mergedCells.size} merged cells`);
    
    newSettings.data = grid
    newSettings.selectedCells = []
    return newSettings
  }, [])

  const generateTableHtml = useCallback((tableSettings: TableSettings): string => {
    const {
      fullWidth,
      showBorders,
      borderColor,
      borderWidth,
      borderRadius,
      cellPadding,
      fontSize,
      fontFamily,
      data,
      headerBackgroundColor,
      headerTextColor,
      cellBackgroundColor,
      cellTextColor
    } = tableSettings;

    // Define explicit border style to ensure it's visible when showBorders is true
    const borderStyle = showBorders 
      ? `${borderWidth}px solid ${borderColor}` 
      : 'none';
    
    // Apply styles to the table element with explicit border handling
    // Always use border-collapse: collapse to ensure cells are adjacent with no spacing
    // This keeps cells tightly packed whether borders are visible or not
    const tableStyles = `
      border-collapse: collapse;
      border-spacing: 0;
      width: ${fullWidth ? '100%' : 'auto'};
      border-radius: ${borderRadius}px;
      overflow: hidden;
      border: ${borderStyle};
    `.trim().replace(/\s+/g, ' ');

    // Make sure font-family and font-size are explicitly applied
    // Apply borders to all cells when showBorders is true
    // Using !important to ensure these styles override any defaults
    const universalCellStyles = `
      padding: ${cellPadding}px;
      text-align: left;
      vertical-align: top;
      font-size: ${fontSize}px !important;
      font-family: ${fontFamily} !important;
      border: ${borderStyle} !important;
    `.trim().replace(/\s+/g, ' ');

    let html = `<table style="${tableStyles}" data-merged-cells="true">`;

    if (data && data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        html += '<tr>';
        for (let j = 0; j < data[i].length; j++) {
          const cell = data[i][j];
          if (cell.merged) continue;

          const tag = cell.isHeader ? 'th' : 'td';
          
          // Make sure colors are applied with !important to override any default styling
          const specificCellStyles = `
            ${universalCellStyles}
            background-color: ${cell.isHeader ? headerBackgroundColor : cellBackgroundColor} !important;
            color: ${cell.isHeader ? headerTextColor : cellTextColor} !important;
          `.trim().replace(/\s+/g, ' ');

          const mergedDataAttr = cell.colspan > 1 || cell.rowspan > 1 ? 'data-is-merged-master="true"' : '';

          html += `<${tag} 
            style="${specificCellStyles}" 
            colspan="${cell.colspan}" 
            rowspan="${cell.rowspan}"
            data-row="${cell.row}" 
            data-col="${cell.col}"
            ${mergedDataAttr}
          >${cell.content}</${tag}>`;
        }
        html += '</tr>';
      }
    }

    html += '</table>';
    return html;
  }, []);

  const addTableInteractivity = useCallback((element: HTMLElement): void => {
    const table = element.querySelector("table");
    if (!table) return;

    // Clone the table for editing while preserving all styling
    const clone = table.cloneNode(true) as HTMLTableElement;
    if (table.parentNode) {
      table.parentNode.replaceChild(clone, table);
    }

    // Ensure table maintains its styling attributes
    const tableSettings = element.getAttribute("data-table-settings");
    if (tableSettings) {
      try {
        const parsed = JSON.parse(tableSettings);
        // Preserve the original table's styles by applying all settings consistently
        const borderStyle = parsed.showBorders 
          ? `${parsed.borderWidth}px solid ${parsed.borderColor}` 
          : 'none';
        
        // Apply same border-collapse setting as in generateTableHtml
        clone.style.borderCollapse = parsed.showBorders ? 'collapse' : 'separate';
        
        // Apply the same border style to the table
        clone.style.border = borderStyle;
        clone.style.borderRadius = `${parsed.borderRadius}px`;
        clone.style.overflow = 'hidden';
        
        // Apply consistent border styling to all cells
        clone.querySelectorAll('td, th').forEach((cell: Element) => {
          // Apply border styling consistently
          (cell as HTMLElement).style.border = borderStyle;
          
          // Apply font styling consistently
          (cell as HTMLElement).style.fontFamily = parsed.fontFamily;
          (cell as HTMLElement).style.fontSize = `${parsed.fontSize}px`;
          
          // Apply color styling based on cell type
          const isHeader = cell.tagName.toLowerCase() === 'th';
          (cell as HTMLElement).style.color = isHeader 
            ? parsed.headerTextColor 
            : parsed.cellTextColor;
          (cell as HTMLElement).style.backgroundColor = isHeader 
            ? parsed.headerBackgroundColor 
            : parsed.cellBackgroundColor;
        });
      } catch (error) {
        console.error("Error parsing table settings in addTableInteractivity:", error);
      }
    }

    clone.querySelectorAll('td, th').forEach((cell: Element) => {
      cell.setAttribute("contenteditable", "true");
      cell.classList.add("editable-cell");
      
      // Preserve existing cell styling when adding interactivity
      // This ensures text color, font family and size are maintained
      const style = (cell as HTMLElement).getAttribute('style');
      if (style) {
        (cell as HTMLElement).setAttribute('data-original-style', style);
      }
    });

    const handleFocusIn = (e: Event) => {
      const targetCell = (e.target as HTMLElement).closest(".editable-cell");
      if (!targetCell) return;
      targetCell.classList.add("cell-focus");
      setIsEditingText(true);
    };

    const handleFocusOut = (e: Event) => {
      const targetCell = (e.target as HTMLElement).closest(".editable-cell");
      if (!targetCell) return;
      targetCell.classList.remove("cell-focus");

      const row = Number.parseInt(targetCell.getAttribute("data-row") || "-1");
      const col = Number.parseInt(targetCell.getAttribute("data-col") || "-1");
      if (row < 0 || col < 0) return;

      // Update settings state without calling onUpdate (which triggers parent state updates)
      setSettings((currentSettings) => {
        const newData = [...currentSettings.data.map(r => [...r])];
        if (newData[row] && newData[row][col]) {
          newData[row][col].content = targetCell.innerHTML;
        }
        const updatedSettings = { ...currentSettings, data: newData };
        // Just update the attribute - the parent notification will happen separately
        element.setAttribute("data-table-settings", JSON.stringify(updatedSettings));
        return updatedSettings;
      });
      
      // Schedule an update to the parent component after state changes are complete
      setTimeout(() => {
        if (element) {
          try {
            const updatedSettingsStr = element.getAttribute("data-table-settings");
            if (updatedSettingsStr) {
              const parsedSettings = JSON.parse(updatedSettingsStr);
              // Use notifyParent instead of directly calling onUpdate
              notifyParent(parsedSettings);
            }
          } catch (error) {
            console.error("Error parsing settings after cell edit:", error);
          }
        }
      }, 0);
      setIsEditingText(false);
    };

    clone.addEventListener("focusin", handleFocusIn, true);
    clone.addEventListener("focusout", handleFocusOut, true);
    clone.addEventListener("input", () => setIsEditingText(true), true);
    clone.classList.add("main-document-table");
  }, [onUpdate]);

  const updateTableElement = useCallback((element: HTMLElement, newSettings: TableSettings): void => {
    if (isEditingText) {
      // Even when editing text, we should update the settings attribute
      element.setAttribute('data-table-settings', JSON.stringify(newSettings));
      
      // Apply critical style changes to cells even during text editing
      // This ensures real-time preview of color, font, and border changes
      const table = element.querySelector('table');
      if (table) {
        // Update borders on the table itself if showBorders setting changed
        if (newSettings.showBorders !== undefined) {
          const borderStyle = newSettings.showBorders
            ? `${newSettings.borderWidth}px solid ${newSettings.borderColor}`
            : 'none';
          
          // Apply border to the table with !important to override any default styling
          table.style.cssText += `; border: ${borderStyle} !important;`;
          
          // Set the table's border-collapse property based on showBorders setting
          // This ensures proper border rendering between cells
          table.style.borderCollapse = newSettings.showBorders ? 'collapse' : 'separate';
          
          // Apply borders to all cells individually to ensure they appear between non-merged cells
          table.querySelectorAll('td, th').forEach((cell) => {
            // For merged cells, we need to check rowspan and colspan
            const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);
            const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
            const isMerged = rowspan > 1 || colspan > 1;
            
            // Apply border to the cell with !important flag to override any default styling
            (cell as HTMLElement).style.cssText += `; border: ${borderStyle} !important;`;
          });
        }
        
        // Apply header row changes if hasHeader setting changed
        if (newSettings.hasHeader !== undefined && !isEditingText) {
          const firstRow = table.querySelector('tr');
          if (firstRow) {
            const cells = Array.from(firstRow.children);
            
            // If header should be enabled, convert all cells in first row to TH
            if (newSettings.hasHeader) {
              cells.forEach((cell, index) => {
                // Only convert if it's not already a TH
                if (cell.tagName.toLowerCase() !== 'th') {
                  const content = cell.innerHTML;
                  const newHeader = document.createElement('th');
                  
                  // Copy attributes from old cell
                  Array.from(cell.attributes).forEach(attr => {
                    newHeader.setAttribute(attr.name, attr.value);
                  });
                  
                  // Apply header styling
                  newHeader.style.backgroundColor = newSettings.headerBackgroundColor;
                  newHeader.style.color = newSettings.headerTextColor;
                  newHeader.style.fontFamily = newSettings.fontFamily;
                  newHeader.style.fontSize = `${newSettings.fontSize}px`;
                  
                  // Add content and replace cell
                  newHeader.innerHTML = content || `Header ${index + 1}`;
                  cell.replaceWith(newHeader);
                }
              });
            } 
            // If header should be disabled, convert all TH to TD
            else {
              cells.forEach((cell, index) => {
                if (cell.tagName.toLowerCase() === 'th') {
                  const content = cell.innerHTML;
                  const newCell = document.createElement('td');
                  
                  // Copy attributes from old cell
                  Array.from(cell.attributes).forEach(attr => {
                    newCell.setAttribute(attr.name, attr.value);
                  });
                  
                  // Apply regular cell styling
                  newCell.style.backgroundColor = newSettings.cellBackgroundColor;
                  newCell.style.color = newSettings.cellTextColor;
                  newCell.style.fontFamily = newSettings.fontFamily;
                  newCell.style.fontSize = `${newSettings.fontSize}px`;
                  
                  // Add content and replace cell
                  newCell.innerHTML = content;
                  cell.replaceWith(newCell);
                }
              });
            }
          }
        }
        
        // Update font properties and colors on all cells
        table.querySelectorAll('td, th').forEach((cell) => {
          const isHeader = cell.tagName.toLowerCase() === 'th';
          if (isHeader) {
            (cell as HTMLElement).style.color = newSettings.headerTextColor;
          } else {
            (cell as HTMLElement).style.color = newSettings.cellTextColor;
          }
          
          (cell as HTMLElement).style.fontFamily = newSettings.fontFamily;
          (cell as HTMLElement).style.fontSize = `${newSettings.fontSize}px`;
        });
      }
      return;
    }
    
    // When not editing text, completely regenerate the table HTML
    const tableHtml = generateTableHtml(newSettings);
    element.innerHTML = tableHtml;
    element.setAttribute('data-element-type', 'table');
    element.setAttribute('data-table-settings', JSON.stringify(newSettings));
    addTableInteractivity(element);
  }, [isEditingText, generateTableHtml, addTableInteractivity]);

  // Initialize settings when the selected element changes - separate from update logic
  useEffect(() => {
    if (!selectedElement) {
      initializedRef.current = false;
      return;
    }

    // Only initialize once per element selection
    if (initializedRef.current && selectedElement.getAttribute('data-table-settings')) {
      return;
    }
    
    initializedRef.current = true;
    console.log("Initializing table settings from element");

    // Use a function to avoid any possible state updates during render
    const initializeSettings = () => {
      try {
        const settingsAttr = selectedElement.getAttribute("data-table-settings");
        let initialSettings: TableSettings;
        if (settingsAttr) {
          const parsed = JSON.parse(settingsAttr);
          initialSettings = { ...defaultTableSettings, ...parsed };
          if (!initialSettings.data || initialSettings.data.length === 0) {
            initialSettings.data = generateInitialData(
              initialSettings.rows, 
              initialSettings.columns, 
              initialSettings.hasHeader, 
              initialSettings
            );
          }
        } else {
          initialSettings = parseExistingTable(selectedElement);
        }
        
        // Update local state only - no parent updates during initialization
        setSettings(initialSettings);
        
        // Just update the DOM element directly
        updateTableElement(selectedElement, initialSettings);
      } catch (err) {
        console.error('Error initializing table settings:', err);
        const newDefaults = { ...defaultTableSettings };
        newDefaults.data = generateInitialData(
          newDefaults.rows, 
          newDefaults.columns, 
          newDefaults.hasHeader, 
          newDefaults
        );
        
        setSettings(newDefaults);
        if (selectedElement) {
          updateTableElement(selectedElement, newDefaults);
        }
      }
      
      // Mark initialization as complete
      setIsInitializing(false);
    };
    
    // Use setTimeout to ensure this happens after render is complete
    setTimeout(initializeSettings, 0);
    
    return () => {
      // Clean up any possible timeouts
      setIsInitializing(true);
    };
  }, [selectedElement, parseExistingTable, updateTableElement]);

  // Separate DOM updates from parent notification
  const updateDOM = useCallback((element: HTMLElement, newSettings: TableSettings) => {
    updateTableElement(element, newSettings);
  }, [updateTableElement]);
  
  // Create a separate debounced function just for parent updates
  const notifyParent = useCallback(
    debounce((newSettings: TableSettings) => {
      console.log("Notifying parent of settings changes");
      onUpdate(newSettings);
    }, 500),
    [onUpdate]
  );

  // Effect for DOM updates - always happens first
  useEffect(() => {
    if (isInitializing || !selectedElement || !settings) {
      return;
    }

    console.log("Updating DOM with new settings");
    updateDOM(selectedElement, settings);
  }, [settings, selectedElement, updateDOM, isInitializing]);
  
  // Separate effect for parent notification - only runs after initialization and editing
  // This is kept separate from the DOM updates to avoid parent updates during render
  useEffect(() => {
    if (isInitializing || !settings || isEditingText) {
      return;
    }
    
    console.log("Scheduling notification to parent");
    notifyParent(settings);
    
    return () => {
      // Cancel any pending notifications when component updates or unmounts
      notifyParent.cancel();
    };
  }, [settings, isInitializing, isEditingText, notifyParent]);

  // Handlers for rows and columns
  const handleRowChange = (delta: number) => {
    const newRowCount = settings.rows + delta;
    if (newRowCount < 1) return;

    manualUpdateRef.current = true;
    let newData = [...settings.data.map(row => [...row])];
    if (delta > 0) {
      const newRow: CellData[] = Array.from({ length: settings.columns }, (_, c) => ({
        ...createDefaultCell(`Cell`, false, settings),
        row: newData.length,
        col: c,
      }));
      newData.push(newRow);
    } else {
      newData.pop();
    }
    
    setSettings(prev => ({
      ...prev,
      rows: newRowCount,
      data: newData,
      selectedCells: []
    }));
  };

  const handleColumnChange = (delta: number) => {
    const newColCount = settings.columns + delta;
    if (newColCount < 1) return;

    manualUpdateRef.current = true;
    let newData = [...settings.data.map(row => [...row])];
    if (delta > 0) {
      newData.forEach((row, rIndex) => {
        row.push({
          ...createDefaultCell('Cell', settings.hasHeader && rIndex === 0, settings),
          row: rIndex,
          col: newColCount - 1,
        });
      });
    } else {
      newData.forEach(row => row.pop());
    }

    setSettings(prev => ({
      ...prev,
      columns: newColCount,
      data: newData,
      selectedCells: []
    }));
  };

  // Handlers for merging and splitting
  const canMerge = () => {
    if (settings.selectedCells.length <= 1) return false;
    const rows = settings.selectedCells.map(c => c.row);
    const cols = settings.selectedCells.map(c => c.col);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    
    if (settings.selectedCells.length !== (maxRow - minRow + 1) * (maxCol - minCol + 1)) {
      return false; // Not a rectangle
    }

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cell = settings.data[r]?.[c];
        if (!cell || cell.merged || cell.colspan > 1 || cell.rowspan > 1) {
          return false; // Contains already merged cells
        }
      }
    }
    return true;
  };

  const handleMergeCells = () => {
    if (!canMerge()) return;
    manualUpdateRef.current = true;
    
    const rows = settings.selectedCells.map(c => c.row);
    const cols = settings.selectedCells.map(c => c.col);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    
    const newData = [...settings.data.map(row => row.map(cell => ({...cell})))];
    const masterCell = newData[minRow][minCol];
    masterCell.colspan = maxCol - minCol + 1;
    masterCell.rowspan = maxRow - minRow + 1;
    
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r === minRow && c === minCol) continue;
        const cell = newData[r][c];
        cell.merged = true;
        cell.mergedWith = { row: minRow, col: minCol };
        cell.content = '';
      }
    }
    setSettings(prev => ({ ...prev, data: newData, selectedCells: [{ row: minRow, col: minCol }] }));
  };

  const canSplit = () => {
    if (settings.selectedCells.length !== 1) return false;
    const { row, col } = settings.selectedCells[0];
    const cell = settings.data[row][col];
    const masterCell = cell.merged && cell.mergedWith ? settings.data[cell.mergedWith.row][cell.mergedWith.col] : cell;
    return masterCell.colspan > 1 || masterCell.rowspan > 1;
  };

  const handleSplitCell = () => {
    if (!canSplit()) return;
    manualUpdateRef.current = true;
    
    const { row, col } = settings.selectedCells[0];
    const cell = settings.data[row][col];
    const masterCellCoord = cell.merged && cell.mergedWith ? cell.mergedWith : {row, col};
    const masterCell = settings.data[masterCellCoord.row][masterCellCoord.col];

    const newData = [...settings.data.map(row => row.map(cell => ({...cell})))];
    
    for (let r = masterCellCoord.row; r < masterCellCoord.row + masterCell.rowspan; r++) {
      for (let c = masterCellCoord.col; c < masterCellCoord.col + masterCell.colspan; c++) {
        const cellToSplit = newData[r][c];
        cellToSplit.merged = false;
        cellToSplit.mergedWith = undefined;
        cellToSplit.colspan = 1;
        cellToSplit.rowspan = 1;
      }
    }
    setSettings(prev => ({ ...prev, data: newData, selectedCells: [{ row: masterCellCoord.row, col: masterCellCoord.col }] }));
  };

  const updateSettings = useCallback(
    (
      key: keyof TableSettings,
      value: TableSettings[keyof TableSettings],
      shouldDebounce: boolean = false
    ): void => {
      // Create a function to update the settings
      const updateFunc = () => {
        // Handle special cases like data updates from cell edits
        if (key === "data" && Array.isArray(value)) {
          setSettings((prev) => ({
            ...prev,
            data: value as CellData[][],
          }));
        } 
        // Special handling for hasHeader toggle to properly update the table structure
        else if (key === "hasHeader") {
          setSettings((prev: TableSettings) => {
            const hasHeader = value as boolean;
            let newData = [...prev.data.map(row => [...row])];
            
            // If toggling header ON and there wasn't one before
            if (hasHeader && !prev.hasHeader) {
              // Create new header row
              const headerRow: CellData[] = Array.from({ length: prev.columns }, (_, c) => ({
                ...createDefaultCell(`Header ${c + 1}`, true, prev),
                row: 0,
                col: c,
              }));
              
              // Insert header row at the beginning
              newData.unshift(headerRow);
              
              // Update row indices for existing data rows
              for (let r = 1; r < newData.length; r++) {
                for (let c = 0; c < newData[r].length; c++) {
                  newData[r][c].row = r;
                }
              }
            } 
            // If toggling header OFF and there was one before
            else if (!hasHeader && prev.hasHeader) {
              // Remove the header row
              newData.shift();
              
              // Update row indices for remaining rows
              for (let r = 0; r < newData.length; r++) {
                for (let c = 0; c < newData[r].length; c++) {
                  newData[r][c].row = r;
                  newData[r][c].isHeader = false; // Ensure no cells are marked as headers
                }
              }
            }
            
            return {
              ...prev,
              hasHeader: hasHeader,
              data: newData,
              // Keep row count consistent with actual data
              rows: newData.length - (hasHeader ? 1 : 0)
            };
          });
        }
        else {
          // For all other properties, perform a simple update
          setSettings((prev: TableSettings) => ({
            ...prev,
            [key]: value,
          }));
        }
      };

      // If debounce is requested, wait for 300ms before updating
      // This prevents excessive re-renders for things like slider inputs
      if (shouldDebounce) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          updateFunc();
        }, 300);
      } else {
        // Otherwise update immediately
        updateFunc();
      }
    },
    [setSettings]
  );
  
  // This useEffect is responsible for propagating changes to the parent component.
  // It uses the isInitialMount ref to prevent running on the initial render,
  // This useEffect has been removed because it was redundant with the separate effects
  // for DOM updates and parent notifications. Keeping both caused duplicate updates.

  // Function to handle cell selection in the preview table
  const handleCellSelection = useCallback((row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Get the cell data
    const cell = settings.data[row][col];
    
    // Skip cells that are covered by rowspan/colspan from other cells
    if (cell.merged) {
      // If it's a merged cell, select the master cell instead
      if (cell.mergedWith) {
        handleCellSelection(cell.mergedWith.row, cell.mergedWith.col, e);
      }
      return;
    }
    
    setSettings(prev => {
      // Create a new selectedCells array
      let newSelectedCells = [...prev.selectedCells];
      
      // Check if the cell is already selected
      const existingIndex = newSelectedCells.findIndex(c => c.row === row && c.col === col);
      
      if (existingIndex >= 0) {
        // If the cell is already selected and we're not using shift, deselect it
        if (!e.shiftKey) {
          newSelectedCells.splice(existingIndex, 1);
        }
      } else {
        // If we're not using shift, clear the selection first
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          newSelectedCells = [];
        }
        
        // Add the cell to selection
        newSelectedCells.push({ row, col });
      }
      
      return { ...prev, selectedCells: newSelectedCells };
    });
  }, [settings.data]);

  // Function to create table preview with selectable cells
  const generatePreviewTable = useCallback(() => {
    const tableEl = document.createElement('table');
    tableEl.className = 'preview-table';
    tableEl.style.width = '100%';
    tableEl.style.borderCollapse = 'collapse';
    tableEl.style.tableLayout = 'fixed';

    for (let i = 0; i < settings.data.length; i++) {
      const tr = document.createElement('tr');
      tableEl.appendChild(tr);

      for (let j = 0; j < settings.data[i].length; j++) {
        const cell = settings.data[i][j];
        if (cell.merged) continue;

        const cellEl = document.createElement(cell.isHeader ? 'th' : 'td');
        cellEl.colSpan = cell.colspan;
        cellEl.rowSpan = cell.rowspan;
        cellEl.dataset.row = i.toString();
        cellEl.dataset.col = j.toString();
        cellEl.innerHTML = '&nbsp;'; // No text content

        // Apply styles from settings, but without font-size
        const bgColor = cell.isHeader ? settings.headerBackgroundColor : settings.cellBackgroundColor;
        cellEl.style.backgroundColor = bgColor;
        cellEl.style.padding = `${settings.cellPadding}px`;
        if (settings.showBorders) {
          cellEl.style.border = `${settings.borderWidth}px solid ${settings.borderColor}`;
        }

        // Use a box-shadow to indicate selection, which doesn't interfere with background color
        const isSelected = settings.selectedCells.some(c => c.row === i && c.col === j);
        if (isSelected) {
          cellEl.style.boxShadow = 'inset 0 0 0 2px #3b82f6'; // A blue glow for selection
        }

        tr.appendChild(cellEl);
        cellEl.addEventListener('mousedown', (e) => {
          handleCellSelection(i, j, e as unknown as React.MouseEvent);
        });
      }
    }

    return tableEl;
  }, [settings, handleCellSelection]);
  
  // Update preview table when settings change
  useEffect(() => {
    // Skip updating during text editing to avoid disruption
    if (isEditingText) return;
    
    // Generate new preview
    const newPreviewTable = generatePreviewTable();
    
    // Get the preview container
    const previewContainer = document.getElementById('table-preview-container');
    if (previewContainer) {
      // Clear and update
      previewContainer.innerHTML = '';
      previewContainer.appendChild(newPreviewTable);
      
      // Store reference
      setPreviewTable(newPreviewTable as HTMLTableElement);
    }
  }, [settings, generatePreviewTable, isEditingText]);

  // Return the component UI
  return (
    <div className="table-settings-panel w-full max-w-sm border-l bg-background flex flex-col h-screen">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Table Settings</h2>
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Live Preview</CardTitle></CardHeader>
            <CardContent>
              <div id="table-preview-container" className="p-2 bg-gray-100 rounded-md overflow-x-auto">
                {/* Preview table will be injected here */}
              </div>
               <div className="mt-2 text-xs text-muted-foreground">
                Click to select cells. Use Ctrl/Cmd+click for multiple selection.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Structure</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Rows</Label>
                <div className="flex items-center">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleRowChange(-1)}><Minus className="h-4 w-4" /></Button>
                  <Input type="number" value={settings.rows} readOnly className="w-12 h-8 text-center border-0 focus-visible:ring-0 bg-transparent" />
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleRowChange(1)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Columns</Label>
                <div className="flex items-center">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleColumnChange(-1)}><Minus className="h-4 w-4" /></Button>
                  <Input type="number" value={settings.columns} readOnly className="w-12 h-8 text-center border-0 focus-visible:ring-0 bg-transparent" />
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleColumnChange(1)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Header Row</Label>
                <Switch checked={settings.hasHeader} onCheckedChange={(val) => updateSettings('hasHeader', val)} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <Button onClick={handleMergeCells} disabled={!canMerge()} className="w-full">
                  <Merge className="w-4 h-4 mr-2" /> Merge
                </Button>
                <Button onClick={handleSplitCell} disabled={!canSplit()} className="w-full">
                  <Split className="w-4 h-4 mr-2" /> Split
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Styling</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Label className="col-span-2 text-xs text-muted-foreground">Header Colors</Label>
                <div>
                  <Label className="text-sm font-normal">Background</Label>
                  <ColorPicker value={settings.headerBackgroundColor} onChange={(color) => updateSettings('headerBackgroundColor', color)} />
                </div>
                <div>
                  <Label className="text-sm font-normal">Text</Label>
                  <ColorPicker value={settings.headerTextColor} onChange={(color) => updateSettings('headerTextColor', color)} />
                </div>
                <Label className="col-span-2 text-xs text-muted-foreground pt-2">Body Colors</Label>
                <div>
                  <Label className="text-sm font-normal">Background</Label>
                  <ColorPicker value={settings.cellBackgroundColor} onChange={(color) => updateSettings('cellBackgroundColor', color)} />
                </div>
                <div>
                  <Label className="text-sm font-normal">Text</Label>
                  <ColorPicker value={settings.cellTextColor} onChange={(color) => updateSettings('cellTextColor', color)} />
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <Label>Font Family</Label>
                <Select value={settings.fontFamily} onValueChange={(value) => updateSettings('fontFamily', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Font Size: {settings.fontSize}px</Label>
                <Slider value={[settings.fontSize]} onValueChange={([val]) => updateSettings('fontSize', val)} min={8} max={32} step={1} />
              </div>
              <div className="space-y-2">
                <Label>Cell Padding: {settings.cellPadding}px</Label>
                <Slider value={[settings.cellPadding]} onValueChange={([val]) => updateSettings('cellPadding', val)} min={0} max={32} step={1} />
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <Label>Full Width</Label>
                <Switch checked={settings.fullWidth} onCheckedChange={(checked) => updateSettings('fullWidth', checked)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Show Borders</Label>
                <Switch checked={settings.showBorders} onCheckedChange={(checked) => updateSettings('showBorders', checked)} />
              </div>
              {settings.showBorders && (
                <div className="space-y-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Border Width: {settings.borderWidth}px</Label>
                    <Slider value={[settings.borderWidth]} onValueChange={([val]) => updateSettings('borderWidth', val)} min={1} max={10} step={1} />
                  </div>
                  <div>
                    <Label>Border Color</Label>
                    <ColorPicker value={settings.borderColor} onChange={(color) => updateSettings('borderColor', color)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
      </div>
    </div>
  );
}
