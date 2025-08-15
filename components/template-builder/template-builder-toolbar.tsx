"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  ImageIcon,
  Table,
  BarChart3,
  Type,
  Palette,
  Heading,
  ChevronDown,
  Columns,
  Code2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  getFocusedColumn,
  setFocusedColumn,
  getFocusedHeader,
  getFocusedFooter,
  getFocusedFooterContainer,
  getFocusedHeaderText,
  getFocusedFooterText,
} from "./focus-tracker";
import { set } from "lodash";

interface TemplateBuilderToolbarProps {
  template: any;
  selectedPage: any;
  onUpdatePage: (pageId: string, updates: any) => void;
  onUpdateTemplate: (updates: any) => void;
}

const fontFamilies = [
  "Arial",
  "Times New Roman",
  "Helvetica",
  "Georgia",
  "Verdana",
  "Calibri",
  "Inter",
  "Roboto",
];

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

const headingLevels = [
  { value: "normal", label: "Normal Text", size: "16px" },
  { value: "h1", label: "Title 1", size: "32px" },
  { value: "h2", label: "Title 2", size: "28px" },
  { value: "h3", label: "Title 3", size: "24px" },
  { value: "h4", label: "Title 4", size: "20px" },
  { value: "h5", label: "Title 5", size: "18px" },
  { value: "h6", label: "Title 6", size: "16px" },
];

// Helper functions for heading numbering
const getHeadingLevel = (tagName: string): number => {
  const match = tagName.match(/^h(\d)$/i);
  return match ? parseInt(match[1], 10) : 0;
};

const generateHeadingNumber = (
  level: number,
  counters: number[],
  pageNumber: number
): string => {
  // Reset counters for levels deeper than current
  for (let i = level; i < counters.length; i++) {
    counters[i] = 0;
  }

  // Increment counter for current level
  counters[level - 1] = (counters[level - 1] || 0) + 1;

  // Generate hierarchical numbering based on heading levels only
  // H1: 1, 2, 3...
  // H2: 1.1, 1.2, 2.1, 2.2...
  // H3: 1.1.1, 1.2.1, 2.1.1...
  const headingNumbers = counters.slice(0, level).join(".");
  return headingNumbers;
};

// Helper function to determine page number for a given container
const getPageNumberForContainer = (
  container: HTMLElement,
  selectedPage: any
): number => {
  // Check if the container is within a subpage by looking for subpage data attributes
  const subPageElement = container.closest("[data-subpage-order]");
  if (subPageElement) {
    // This is a subpage, get its order attribute
    const subPageOrder = subPageElement.getAttribute("data-subpage-order");
    return subPageOrder ? parseInt(subPageOrder, 10) : selectedPage?.order || 1;
  }

  // Check if it's within a main page
  const mainPageElement = container.closest("[data-main-page-order]");
  if (mainPageElement) {
    const mainPageOrder = mainPageElement.getAttribute("data-main-page-order");
    return mainPageOrder
      ? parseInt(mainPageOrder, 10)
      : selectedPage?.order || 1;
  }

  // Try to determine from the editor content area structure
  const editorArea = container.closest(".template-builder-editor-content-area");
  if (editorArea) {
    // Check if this editor area is within a subpage container
    const subPageContainer = editorArea.closest(
      "[data-subpage-order], [data-subpage-index]"
    );
    if (subPageContainer) {
      const subPageOrder = subPageContainer.getAttribute("data-subpage-order");
      if (subPageOrder) {
        return parseInt(subPageOrder, 10);
      }

      // Fallback: use subpage index to calculate order
      const subPageIndex = subPageContainer.getAttribute("data-subpage-index");
      if (subPageIndex && selectedPage?.subPages) {
        const idx = parseInt(subPageIndex, 10);
        return (
          selectedPage.subPages[idx]?.order || selectedPage.order + idx + 1
        );
      }
    }
  }

  // Default to main page order
  return selectedPage?.order || 1;
};

const updateAllHeadingNumbers = (
  container: HTMLElement,
  selectedPage?: any
) => {
  const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const counters: number[] = [0, 0, 0, 0, 0, 0];

  // Determine the page number for this container
  const pageNumber = getPageNumberForContainer(container, selectedPage);

  headings.forEach((heading) => {
    const level = getHeadingLevel(heading.tagName);
    if (level > 0) {
      const number = generateHeadingNumber(level, counters, pageNumber);

      // Remove existing numbering (more robust pattern that includes page numbers)
      const textContent = heading.textContent || "";
      const cleanText = textContent.replace(/^\d+(\.\d+)*\.?\s*/, "");

      // Add new numbering
      heading.textContent = `${number}. ${cleanText}`;
    }
  });
};

const removeHeadingNumbers = (container: HTMLElement) => {
  const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");

  headings.forEach((heading) => {
    const textContent = heading.textContent || "";
    // Updated regex to handle page-based numbering (e.g., "2.1.1." or "1.2.")
    const cleanText = textContent.replace(/^\d+(\.\d+)*\.?\s*/, "");
    heading.textContent = cleanText;
  });
};

// Define ChartDataPoint and ChartSettings types for type safety
interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
}
interface ChartSettings {
  title: string;
  type: "bar" | "pie" | "line" | "doughnut";
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

export function TemplateBuilderToolbar({
  template,
  selectedPage,
  onUpdatePage,
  onUpdateTemplate = (update: any) => {},
}: TemplateBuilderToolbarProps) {
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentSize, setCurrentSize] = useState("14");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [currentHeadingLevel, setCurrentHeadingLevel] = useState<string | null>(
    null
  );
  const [colorPickerColor, setColorPickerColor] = useState("#000000");
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const [lastActiveSelection, setLastActiveSelection] = useState<Range | null>(
    null
  );

  // Default theme values with proper fallbacks
  const defaultTheme = {
    colors: {
      text: "#000000",
      pageBackground: "#ffffff",
      primary: "#dc2626", // Red color for headings
      secondary: "#6b7280",
    },
    typography: {
      fontFamily: "Arial",
      baseFontSize: 14,
      lineHeight: 1.5,
      bodyFont: "Arial, sans-serif",
      headingFont: "Arial, sans-serif",
      bodyFontSize: 14,
      headingFontSize: 18,
      lineSpacing: 1.5,
    },
  };

  // Merge template theme with defaults
  const effectiveTheme = {
    colors: {
      ...defaultTheme.colors,
      ...template?.theme?.colors,
    },
    typography: {
      ...defaultTheme.typography,
      ...template?.theme?.typography,
    },
  };

  const defaultTocSettings = {
    title: "Table of Contents",
    titleColor: effectiveTheme.colors.primary, // Use primary color for TOC title
    fontFamily:
      effectiveTheme.typography.fontFamily ||
      effectiveTheme.typography.bodyFont,
    fontSize:
      effectiveTheme.typography.baseFontSize ||
      effectiveTheme.typography.bodyFontSize,
    textColor: effectiveTheme.colors.text,
    headingLevels: [1, 2, 3],
    bulletStyle: "numbers",
    indentSize: 20,
    showBorder: false,
    borderStyle: "solid",
    borderColor: "#d1d5db",
    borderWidth: 1,
  };

  const defaultChartSettings: ChartSettings = {
    title: "Chart Title",
    type: "bar",
    width: 400,
    height: 300,
    showTitle: true,
    showLegend: true,
    showValues: true,
    titleColor: effectiveTheme.colors.primary, // Use primary color for chart title
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
  };

  const defaultTableSettings = {
    rows: 3,
    columns: 3,
    showBorders: true,
    borderColor: "#d1d5db",
    borderWidth: 1,
    headerBackgroundColor: "#f8f9fa",
    headerTextColor: effectiveTheme.colors.primary, // Use primary color for table headers
    cellBackgroundColor: "#ffffff",
    cellTextColor: effectiveTheme.colors.text,
    cellPadding: 12,
    fontSize:
      effectiveTheme.typography.baseFontSize ||
      effectiveTheme.typography.bodyFontSize,
    fontFamily:
      effectiveTheme.typography.fontFamily ||
      effectiveTheme.typography.bodyFont,
  };

  const dummyTocEntries = [
    { title: "Executive Summary", level: 1, page: 3 },
    { title: "Methodology", level: 1, page: 5 },
    { title: "Findings", level: 1, page: 8 },
    { title: "Risk Assessment", level: 1, page: 15 },
    { title: "Recommendations", level: 1, page: 20 },
    { title: "Scope and Limitations", level: 2, page: 6 },
    { title: "Testing Approach", level: 2, page: 7 },
    { title: "High Risk Issues", level: 2, page: 12 },
    { title: "Business Impact", level: 2, page: 16 },
    { title: "Technical Risks", level: 2, page: 18 },
    { title: "Immediate Actions", level: 2, page: 21 },
    { title: "Data Exposure", level: 3, page: 14 },
    { title: "Financial Impact", level: 3, page: 17 },
    { title: "Operational Risk", level: 3, page: 19 },
    { title: "API Endpoints", level: 4, page: 14 },
  ];

  useEffect(() => {
    const updateToolbarState = () => {
      try {
        setIsBold(document.queryCommandState("bold"));
        setIsItalic(document.queryCommandState("italic"));
        setIsUnderline(document.queryCommandState("underline"));

        // Update font and size state
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (!range.collapsed) {
            // Get the common ancestor element
            let element: Node | null = range.commonAncestorContainer;
            if (element.nodeType === Node.TEXT_NODE) {
              element = element.parentElement;
            }

            if (!element) return; // Handle null case

            // Find the closest element with font-family style
            const fontElement = (element as Element).closest(
              '[style*="font-family"]'
            );
            if (fontElement) {
              const computedStyle = window.getComputedStyle(fontElement);
              const fontFamily = computedStyle.fontFamily;
              // Extract the first font family (before the comma)
              const firstFont = fontFamily
                .split(",")[0]
                .replace(/['"]/g, "")
                .trim();
              if (firstFont && fontFamilies.includes(firstFont)) {
                setCurrentFont(firstFont);
              }
            }

            // Find the closest element with font-size style
            const sizeElement = (element as Element).closest(
              '[style*="font-size"]'
            );
            if (sizeElement) {
              const computedStyle = window.getComputedStyle(sizeElement);
              const fontSize = computedStyle.fontSize;
              // Extract the numeric value
              const sizeValue = parseInt(fontSize);
              if (sizeValue && fontSizes.includes(sizeValue)) {
                setCurrentSize(sizeValue.toString());
              }
            }
          }
        }
      } catch (e) {
        /* Ignore */
      }
    };
    document.addEventListener("selectionchange", updateToolbarState);
    return () =>
      document.removeEventListener("selectionchange", updateToolbarState);
  }, []);

  // Helper function to get the currently focused editor
  const getCurrentlyFocusedEditor = (): HTMLElement | null => {
    const selection = window.getSelection();

    // Try to find the editor containing the current selection
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let element: Node | null = range.commonAncestorContainer;

      // Walk up the DOM tree to find a contenteditable element
      while (element && element.nodeType !== Node.DOCUMENT_NODE) {
        if (element.nodeType === Node.ELEMENT_NODE) {
          const htmlElement = element as HTMLElement;
          if (htmlElement.contentEditable === "true") {
            return htmlElement;
          }
        }
        element = element.parentNode;
      }
    }

    // Fallback to the first editor if no focused editor found
    return document.querySelector(
      '.template-builder-editor-content-area [contenteditable="true"]'
    ) as HTMLElement;
  };

  // Helper function to save current selection
  const saveSelection = (): Range | null => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0).cloneRange();
    }
    return null;
  };

  // Helper function to restore saved selection
  const restoreSelection = (range: Range | null) => {
    if (range) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  // Helper function to apply color to the last active selection
  const applyColorToLastSelection = (
    color: string,
    command: "foreColor" | "backColor"
  ) => {
    if (lastActiveSelection) {
      try {
        // Get the selection object
        const selection = window.getSelection();
        if (selection) {
          // Clear any existing selection
          selection.removeAllRanges();
          // Restore the last active selection
          selection.addRange(lastActiveSelection);

          // Find the container element to focus
          const container = lastActiveSelection.commonAncestorContainer;
          const editableElement =
            container.nodeType === Node.TEXT_NODE
              ? container.parentElement?.closest('[contenteditable="true"]')
              : (container as Element)?.closest('[contenteditable="true"]');

          // Focus the editable element first
          if (editableElement) {
            (editableElement as HTMLElement).focus();
          }

          // For text color (foreColor), always use fallback method with !important to override CSS
          if (command === "foreColor") {
            try {
              const range = selection.getRangeAt(0);
              const selectedContent = range.extractContents();
              const span = document.createElement("span");
              span.style.setProperty("color", color, "important");
              span.appendChild(selectedContent);
              range.insertNode(span);

              // Update selection to show the result
              const newRange = document.createRange();
              newRange.selectNodeContents(span);
              selection.removeAllRanges();
              selection.addRange(newRange);
              return true;
            } catch (fallbackError) {
              console.error(
                "Fallback color application failed:",
                fallbackError
              );
            }
          }

          // Try execCommand first for other commands
          const success = document.execCommand(command, false, color);

          // If execCommand fails, try manual styling for other commands
          if (!success) {
            // Fallback: wrap selection in a span with color style
            try {
              const range = selection.getRangeAt(0);
              const selectedContent = range.extractContents();
              const span = document.createElement("span");
              if (command === "backColor") {
                span.style.setProperty("background-color", color, "important");
              } else {
                span.style.setProperty("color", color, "important");
              }
              span.appendChild(selectedContent);
              range.insertNode(span);

              // Update selection to show the result
              const newRange = document.createRange();
              newRange.selectNodeContents(span);
              selection.removeAllRanges();
              selection.addRange(newRange);
            } catch (fallbackError) {
              console.error(
                "Fallback color application failed:",
                fallbackError
              );
            }
          }

          // Keep the selection visible so user can see the result
          return true;
        }
      } catch (e) {
        console.error("Failed to apply color to last selection:", e);
      }
    }
    return false;
  };

  // Helper function to apply color to saved selection
  const applyColorToSelection = (
    color: string,
    command: "foreColor" | "backColor"
  ) => {
    // First try to apply to the last active selection
    if (applyColorToLastSelection(color, command)) {
      return;
    }

    // Fallback to saved selection
    if (savedSelection) {
      try {
        // Get the selection object
        const selection = window.getSelection();
        if (selection) {
          // Clear any existing selection
          selection.removeAllRanges();
          // Restore the saved selection
          selection.addRange(savedSelection);

          // Apply the command
          document.execCommand(command, false, color);

          // Clear the saved selection
          setSavedSelection(null);
        }
      } catch (e) {
        console.error("Failed to apply color:", e);
        // Fallback to regular execCommand
        execCommand(command, color);
        setSavedSelection(null);
      }
    } else {
      // No saved selection, use regular execCommand
      execCommand(command, color);
    }
  };

  const execCommand = (command: string, value?: string) => {
    try {
      const focusedColumn = getFocusedColumn();
      const focusedHeader = getFocusedHeader();
      const focusedFooter = getFocusedFooter();

      // Determine the target editor
      const targetEditor = focusedColumn || focusedHeader || focusedFooter;

      if (targetEditor) {
        // Use focused column/header/footer if available
        targetEditor.focus();
        document.execCommand(command, false, value);
      } else {
        // Always use the currently focused editor
        const mainEditor = getCurrentlyFocusedEditor();
        if (mainEditor) {
          mainEditor.focus();
          document.execCommand(command, false, value);
        }
      }
    } catch (e) {
      console.error("Command execution failed:", e);
    }
  };

  const createList = (listType: "ul" | "ol") => {
    try {
      const focusedColumn = getFocusedColumn();
      const focusedHeader = getFocusedHeader();
      const focusedFooter = getFocusedFooter();

      // Determine the target editor
      const targetEditor =
        focusedColumn ||
        focusedHeader ||
        focusedFooter ||
        getCurrentlyFocusedEditor();

      if (!targetEditor) {
        console.warn("No editor found for list creation");
        return;
      }

      targetEditor.focus();
      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);

      // Check if selection is within the target editor
      if (!targetEditor.contains(range.commonAncestorContainer)) {
        return;
      }

      let listItems: string[] = [];
      let targetElement: Element | null = null;

      if (range.collapsed) {
        // No selection, find the current paragraph or element
        let node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentNode as Node;
        }

        // Find the closest block element (p, div, etc.)
        while (node && node !== targetEditor) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const tagName = element.tagName.toLowerCase();
            if (
              ["p", "div", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)
            ) {
              targetElement = element;
              const content = element.innerHTML.trim();
              listItems = content ? [content] : ["List item"];
              break;
            }
          }
          node = node.parentNode as Node;
        }

        // If no target element found, create default
        if (listItems.length === 0) {
          listItems = ["List item"];
        }
      } else {
        // There is a selection - handle multi-line and multi-paragraph content
        const tempDiv = document.createElement("div");
        const clonedContent = range.cloneContents();
        tempDiv.appendChild(clonedContent);

        // Check if selection spans multiple block elements
        const blockElements = tempDiv.querySelectorAll(
          "p, div, h1, h2, h3, h4, h5, h6"
        );

        if (blockElements.length > 1) {
          // Multiple block elements selected - convert each to a list item
          listItems = Array.from(blockElements)
            .map((element) => {
              const content = element.innerHTML.trim();
              return content || element.textContent?.trim() || "";
            })
            .filter((content) => content.length > 0);
        } else {
          // Single block or inline content - check for line breaks
          let selectedHtml = tempDiv.innerHTML.trim();

          if (!selectedHtml) {
            listItems = ["List item"];
          } else {
            // Handle multi-line content by splitting on various line break patterns
            // First, normalize different line break patterns

            // Replace paragraph tags with line break markers
            selectedHtml = selectedHtml.replace(
              /<\/p>\s*<p[^>]*>/gi,
              "|||LINEBREAK|||"
            );
            selectedHtml = selectedHtml
              .replace(/<p[^>]*>/gi, "")
              .replace(/<\/p>/gi, "");

            // Replace br tags with line break markers
            selectedHtml = selectedHtml.replace(
              /<br\s*\/?>/gi,
              "|||LINEBREAK|||"
            );

            // Replace div tags (which can act as line breaks)
            selectedHtml = selectedHtml.replace(
              /<\/div>\s*<div[^>]*>/gi,
              "|||LINEBREAK|||"
            );
            selectedHtml = selectedHtml
              .replace(/<div[^>]*>/gi, "")
              .replace(/<\/div>/gi, "");

            // Handle heading tags
            selectedHtml = selectedHtml.replace(
              /<\/(h[1-6])>\s*<h[1-6][^>]*>/gi,
              "|||LINEBREAK|||"
            );
            selectedHtml = selectedHtml
              .replace(/<h[1-6][^>]*>/gi, "")
              .replace(/<\/h[1-6]>/gi, "");

            // Split by our marker and clean up each line
            const lines = selectedHtml
              .split("|||LINEBREAK|||")
              .map((line) => {
                return line
                  .trim()
                  .replace(/^&nbsp;|&nbsp;$/g, "")
                  .replace(/^\s+|\s+$/g, "");
              })
              .filter((line) => line.length > 0 && line !== "&nbsp;");

            if (lines.length === 0) {
              // If no lines found, try splitting by actual line breaks in text
              const textContent =
                tempDiv.textContent || tempDiv.innerText || "";
              const textLines = textContent
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line.length > 0);

              if (textLines.length > 1) {
                listItems = textLines;
              } else {
                // Single line or no meaningful content
                listItems = [selectedHtml];
              }
            } else {
              listItems = lines;
            }
          }
        }

        // Additional check: if we still have only one item but multiple paragraphs were selected,
        // try to handle multi-paragraph selections by examining the DOM range
        if (listItems.length === 1) {
          const allElements = targetEditor.querySelectorAll(
            "p, div, h1, h2, h3, h4, h5, h6"
          );
          const selectedElements: Element[] = [];

          for (const element of allElements) {
            // Check if this element intersects with our selection
            try {
              if (range.intersectsNode && range.intersectsNode(element)) {
                selectedElements.push(element);
              } else {
                // Fallback for browsers that don't support intersectsNode
                const elementRange = document.createRange();
                elementRange.selectNodeContents(element);

                // Check if ranges overlap
                const startComparison = range.compareBoundaryPoints(
                  Range.START_TO_START,
                  elementRange
                );
                const endComparison = range.compareBoundaryPoints(
                  Range.END_TO_END,
                  elementRange
                );

                if (startComparison <= 0 && endComparison >= 0) {
                  // Selection contains this element
                  selectedElements.push(element);
                } else if (startComparison >= 0 && endComparison <= 0) {
                  // Element contains selection
                  selectedElements.push(element);
                } else {
                  // Check for partial overlap
                  const startInside =
                    range.compareBoundaryPoints(
                      Range.START_TO_START,
                      elementRange
                    ) >= 0 &&
                    range.compareBoundaryPoints(
                      Range.START_TO_END,
                      elementRange
                    ) <= 0;
                  const endInside =
                    range.compareBoundaryPoints(
                      Range.END_TO_START,
                      elementRange
                    ) >= 0 &&
                    range.compareBoundaryPoints(
                      Range.END_TO_END,
                      elementRange
                    ) <= 0;

                  if (startInside || endInside) {
                    selectedElements.push(element);
                  }
                }
              }
            } catch (e) {
              // Ignore errors and continue
            }
          }

          // If we found multiple elements, extract their content
          if (selectedElements.length > 1) {
            listItems = selectedElements
              .map((element) => {
                const content = element.innerHTML.trim();
                return content || element.textContent?.trim() || "";
              })
              .filter((content) => content.length > 0);
          }
        }

        // Check if we're dealing with multiple block elements
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;

        let startElement =
          startContainer.nodeType === Node.TEXT_NODE
            ? startContainer.parentElement
            : (startContainer as Element);
        let endElement =
          endContainer.nodeType === Node.TEXT_NODE
            ? endContainer.parentElement
            : (endContainer as Element);

        // Find the closest block elements
        while (
          startElement &&
          !["p", "div", "h1", "h2", "h3", "h4", "h5", "h6"].includes(
            startElement.tagName?.toLowerCase() || ""
          )
        ) {
          startElement = startElement.parentElement;
        }
        while (
          endElement &&
          !["p", "div", "h1", "h2", "h3", "h4", "h5", "h6"].includes(
            endElement.tagName?.toLowerCase() || ""
          )
        ) {
          endElement = endElement.parentElement;
        }

        if (startElement === endElement && startElement) {
          targetElement = startElement;
        }
      }

      // Ensure we have at least one list item
      if (listItems.length === 0) {
        listItems = ["List item"];
      }

      // Create the list HTML with proper styling
      const listTag = listType;
      const listStyleType = listType === "ul" ? "disc" : "decimal";

      const listItemsHtml = listItems
        .map(
          (item) =>
            `<li style="margin: 0; padding: 0; line-height: inherit; color: inherit; list-style-type: inherit; display: list-item;">${item}</li>`
        )
        .join("");

      const listHtml = `<${listTag} style="margin: 0.5em 0; padding-left: 2em; list-style-type: ${listStyleType}; color: inherit; line-height: inherit;">
        ${listItemsHtml}
      </${listTag}>`;

      // Handle replacement based on what type of selection we have
      if (targetElement && listItems.length === 1) {
        // Single element replacement
        targetElement.outerHTML = listHtml;
      } else if (listItems.length > 1) {
        // Multiple items - try to replace the entire selection
        // First, try to find if the selection spans multiple elements
        const allElements = targetEditor.querySelectorAll(
          "p, div, h1, h2, h3, h4, h5, h6"
        );
        const elementsToReplace: Element[] = [];

        for (const element of allElements) {
          try {
            if (range.intersectsNode && range.intersectsNode(element)) {
              elementsToReplace.push(element);
            }
          } catch (e) {
            // Continue if intersectsNode fails
          }
        }

        if (elementsToReplace.length > 1) {
          // Replace multiple elements with the list
          const firstElement = elementsToReplace[0];
          firstElement.outerHTML = listHtml;

          // Remove the other elements
          for (let i = 1; i < elementsToReplace.length; i++) {
            elementsToReplace[i].remove();
          }
        } else {
          // Fallback to range replacement
          range.deleteContents();
          const div = document.createElement("div");
          div.innerHTML = listHtml;
          const listElement = div.firstElementChild;
          if (listElement) {
            range.insertNode(listElement);
          }
        }
      } else {
        // Single item, no target element - insert at current position
        range.deleteContents();
        const div = document.createElement("div");
        div.innerHTML = listHtml;
        const listElement = div.firstElementChild;
        if (listElement) {
          range.insertNode(listElement);

          // Position cursor at the end of the last list item
          const listItems = listElement.querySelectorAll("li");
          const lastListItem = listItems[listItems.length - 1];
          if (lastListItem) {
            const newRange = document.createRange();
            newRange.selectNodeContents(lastListItem);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }

      // Update page content if needed
      if (selectedPage && onUpdatePage) {
        setTimeout(() => {
          onUpdatePage(selectedPage.id, { content: targetEditor.innerHTML });
        }, 10);
      }
    } catch (e) {
      console.error("List creation failed:", e);
      // Fallback to execCommand
      const command =
        listType === "ul" ? "insertUnorderedList" : "insertOrderedList";
      execCommand(command);
    }
  };

  const handleListKeydown = (event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    // Only handle Enter key
    if (keyboardEvent.key !== "Enter") {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    let currentElement = range.startContainer;

    // Find the closest list item
    if (currentElement.nodeType === Node.TEXT_NODE) {
      currentElement = currentElement.parentNode as Node;
    }

    // Walk up to find the li element
    let listItem: HTMLLIElement | null = null;
    let listContainer: HTMLUListElement | HTMLOListElement | null = null;

    while (currentElement && currentElement !== document.body) {
      if (currentElement.nodeType === Node.ELEMENT_NODE) {
        const element = currentElement as Element;
        if (element.tagName.toLowerCase() === "li") {
          listItem = element as HTMLLIElement;
        } else if (
          element.tagName.toLowerCase() === "ul" ||
          element.tagName.toLowerCase() === "ol"
        ) {
          listContainer = element as HTMLUListElement | HTMLOListElement;
          break;
        }
      }
      currentElement = currentElement.parentNode as Node;
    }

    // If we found a list item and container, create a new list item
    if (listItem && listContainer) {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();

      // Check if the current list item is empty
      const currentContent = listItem.innerHTML.trim();
      if (
        !currentContent ||
        currentContent === "<br>" ||
        currentContent === "&nbsp;"
      ) {
        // If current item is empty, remove it and exit the list
        const parentElement = listContainer.parentElement;
        if (parentElement) {
          // Create a new paragraph after the list
          const newParagraph = document.createElement("p");
          newParagraph.innerHTML = "<br>";
          newParagraph.style.cssText = `
            margin: 0;
            padding: 0;
            line-height: inherit;
            color: inherit;
            min-height: 1em;
          `;

          // Insert the paragraph after the list container
          parentElement.insertBefore(newParagraph, listContainer.nextSibling);

          // Remove the empty list item
          listItem.remove();

          // If the list is now empty, remove it
          if (listContainer.children.length === 0) {
            listContainer.remove();
          }

          // Position cursor in the new paragraph
          const newRange = document.createRange();
          newRange.selectNodeContents(newParagraph);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
        return;
      }

      // Create a new list item
      const newListItem = document.createElement("li");
      newListItem.style.cssText = `
        margin: 0;
        padding: 0;
        line-height: inherit;
        color: inherit;
        list-style-type: inherit;
        display: list-item;
      `;
      newListItem.innerHTML = "<br>"; // Empty but ready for content

      // Insert the new list item after the current one
      listItem.parentNode?.insertBefore(newListItem, listItem.nextSibling);

      // Position cursor in the new list item
      const newRange = document.createRange();
      newRange.selectNodeContents(newListItem);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);

      // Update page content
      const targetEditor = getCurrentlyFocusedEditor();
      if (selectedPage && onUpdatePage && targetEditor) {
        setTimeout(() => {
          onUpdatePage(selectedPage.id, { content: targetEditor.innerHTML });
        }, 10);
      }
    }
  };

  const handleFontChange = (font: string) => {
    // console.log("handleFontChange called with:", font);
    setCurrentFont(font);

    const focusedColumn = getFocusedColumn();
    const targetEditor = focusedColumn || getCurrentlyFocusedEditor();

    if (!targetEditor) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (
        !range.collapsed &&
        targetEditor.contains(range.commonAncestorContainer)
      ) {
        // Extract the selected content (preserves DOM structure)
        const selectedContent = range.extractContents();
        if (selectedContent.textContent && selectedContent.textContent.trim()) {
          // Create a span with !important to override theme styles
          const span = document.createElement("span");
          span.style.setProperty("font-family", font, "important");
          // Append the extracted content to preserve structure
          span.appendChild(selectedContent);

          // Insert the styled span
          range.insertNode(span);

          // Update page content
          if (selectedPage && onUpdatePage) {
            setTimeout(() => {
              onUpdatePage(selectedPage.id, {
                content: targetEditor.innerHTML,
              });
            }, 10);
          }
        }
      }
    }
  };

  const handleSizeChange = (size: string) => {
    // console.log("handleSizeChange called with:", size);
    setCurrentSize(size);

    const focusedColumn = getFocusedColumn();
    const targetEditor = focusedColumn || getCurrentlyFocusedEditor();

    if (!targetEditor) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (
        !range.collapsed &&
        targetEditor.contains(range.commonAncestorContainer)
      ) {
        // Extract the selected content (preserves DOM structure)
        const selectedContent = range.extractContents();
        if (selectedContent.textContent && selectedContent.textContent.trim()) {
          // Create a span with !important to override theme styles
          const span = document.createElement("span");
          span.style.setProperty("font-size", `${size}px`, "important");
          // Append the extracted content to preserve structure
          span.appendChild(selectedContent);

          // Insert the styled span
          range.insertNode(span);

          // Clear the selection after applying the font size
          selection.removeAllRanges();

          // Position cursor after the styled text
          const newRange = document.createRange();
          newRange.setStartAfter(span);
          newRange.collapse(true);
          selection.addRange(newRange);

          // Update page content
          if (selectedPage && onUpdatePage) {
            setTimeout(() => {
              onUpdatePage(selectedPage.id, {
                content: targetEditor.innerHTML,
              });
            }, 10);
          }
        }
      }
    }
  };

  const insertHeading = (level: string) => {
    const focusedColumn = getFocusedColumn();
    const selection = window.getSelection();

    // Helper function to convert element to heading or normal text
    const convertElement = (element: HTMLElement, targetLevel: string) => {
      const content = element.innerHTML;
      let newElement: HTMLElement;

      if (targetLevel === "normal") {
        newElement = document.createElement("p");
        newElement.style.fontSize =
          effectiveTheme.typography.bodyFontSize + "px" || "16px";
        newElement.style.fontWeight = "normal";
        newElement.style.margin = "12px 0";
      } else {
        newElement = document.createElement(targetLevel);
        const headingConfig = headingLevels.find(
          (h) => h.value === targetLevel
        );
        const fontSize = headingConfig?.size || "24px";
        newElement.style.fontSize = fontSize;
        newElement.style.fontWeight = "bold";
        newElement.style.margin = "16px 0 12px 0";
      }

      newElement.style.lineHeight =
        effectiveTheme.typography.lineHeight ||
        effectiveTheme.typography.lineSpacing;
      newElement.style.fontFamily =
        effectiveTheme.typography.fontFamily ||
        effectiveTheme.typography.bodyFont;
      newElement.innerHTML = content;

      return newElement;
    };

    // Check if we have a selection
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // Case 1: Text is selected
      if (!selection.isCollapsed) {
        // Find if the selection contains or is within heading elements
        const tempDiv = document.createElement("div");
        const clonedContent = range.cloneContents();
        tempDiv.appendChild(clonedContent);

        const headingElements = tempDiv.querySelectorAll(
          "h1, h2, h3, h4, h5, h6"
        );

        if (headingElements.length > 0) {
          // Selection contains headings - convert them
          const selectedContent = range.extractContents();
          const tempContainer = document.createElement("div");
          tempContainer.appendChild(selectedContent);

          const headings = tempContainer.querySelectorAll(
            "h1, h2, h3, h4, h5, h6"
          );
          headings.forEach((heading) => {
            const newElement = convertElement(heading as HTMLElement, level);
            heading.parentNode?.replaceChild(newElement, heading);
          });

          // Insert the converted content back
          const fragment = document.createDocumentFragment();
          while (tempContainer.firstChild) {
            fragment.appendChild(tempContainer.firstChild);
          }
          range.insertNode(fragment);
        } else {
          // Check if selection is within a single heading element
          let element: Node | null = range.commonAncestorContainer;
          if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
          }

          let headingElement: HTMLElement | null = null;
          while (element && element !== document.body) {
            if (element.nodeType === Node.ELEMENT_NODE) {
              const tagName = (element as Element).tagName.toLowerCase();
              if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
                headingElement = element as HTMLElement;
                break;
              }
            }
            element = element.parentNode;
          }

          if (headingElement) {
            // Convert the entire heading element
            const newElement = convertElement(headingElement, level);
            headingElement.parentNode?.replaceChild(newElement, headingElement);

            // Update selection to the new element
            const newRange = document.createRange();
            newRange.selectNodeContents(newElement);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } else {
            // No heading found, create new heading with selected content
            if (level !== "normal") {
              const selectedContent = range.extractContents();
              const newHeading = convertElement(
                document.createElement("div"),
                level
              );
              newHeading.innerHTML = "";
              newHeading.appendChild(selectedContent);
              range.insertNode(newHeading);
            }
          }
        }
      } else {
        // Case 2: No text selected (cursor position)
        let element: Node | null = range.startContainer;
        if (element.nodeType === Node.TEXT_NODE) {
          element = element.parentElement;
        }

        // Find if we're inside a heading
        let headingElement: HTMLElement | null = null;
        while (element && element !== document.body) {
          if (element.nodeType === Node.ELEMENT_NODE) {
            const tagName = (element as Element).tagName.toLowerCase();
            if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
              headingElement = element as HTMLElement;
              break;
            }
          }
          element = element.parentNode;
        }

        if (headingElement) {
          // Convert the heading we're inside
          const cursorOffset = range.startOffset;
          const newElement = convertElement(headingElement, level);
          headingElement.parentNode?.replaceChild(newElement, headingElement);

          // Restore cursor position
          try {
            const newRange = document.createRange();
            const textNode = newElement.firstChild;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
              const offset = Math.min(
                cursorOffset,
                textNode.textContent?.length || 0
              );
              newRange.setStart(textNode, offset);
              newRange.setEnd(textNode, offset);
            } else {
              newRange.selectNodeContents(newElement);
              newRange.collapse(true);
            }
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (e) {
            // Fallback: just place cursor at start of new element
            const newRange = document.createRange();
            newRange.selectNodeContents(newElement);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        } else {
          // Not inside a heading, create new heading at cursor position
          if (level !== "normal") {
            const newHeading = convertElement(
              document.createElement("div"),
              level
            );
            newHeading.textContent = `Heading ${level.toUpperCase()}`;
            range.insertNode(newHeading);

            // Position cursor at end of new heading
            const newRange = document.createRange();
            newRange.selectNodeContents(newHeading);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }
    }

    // Update page content
    const editor = getCurrentlyFocusedEditor() || focusedColumn;
    if (editor && selectedPage && onUpdatePage) {
      setTimeout(() => {
        onUpdatePage(selectedPage.id, { content: editor.innerHTML });

        // Update heading numbering if enabled
        if (template?.theme?.typography?.titleNumbering) {
          updateAllHeadingNumbers(editor, selectedPage);
          // Update page content again with numbering
          setTimeout(() => {
            onUpdatePage(selectedPage.id, { content: editor.innerHTML });
          }, 10);
        }
      }, 50);
    }

    // Update heading numbering for layout columns if enabled
    if (focusedColumn && template?.theme?.typography?.titleNumbering) {
      setTimeout(() => {
        updateAllHeadingNumbers(focusedColumn, selectedPage);
      }, 50);
    }
  };

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

  const getBulletSymbol = (
    entry: any,
    index: number,
    filteredEntries: any[]
  ) => {
    if (defaultTocSettings.bulletStyle === "none") return "";
    if (defaultTocSettings.bulletStyle === "numbers") {
      // Create hierarchical numbering like 1, 2, 3 for H1; 1.1, 1.2, 2.1 for H2; etc.
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
    if (defaultTocSettings.bulletStyle === "roman") {
      if (entry.level === 1) {
        const h1Count = filteredEntries
          .slice(0, index + 1)
          .filter((e) => e.level === 1).length;
        return toRoman(h1Count) + ".";
      } else if (entry.level === 2) {
        const h2Count = filteredEntries
          .slice(0, index + 1)
          .filter((e) => e.level === 2).length;
        return toRoman(h2Count).toLowerCase() + ")";
      } else if (entry.level === 3) {
        const h3Count = filteredEntries
          .slice(0, index + 1)
          .filter((e) => e.level === 3).length;
        const letter = String.fromCharCode(96 + h3Count);
        return letter + ")";
      } else {
        const count = filteredEntries
          .slice(0, index + 1)
          .filter((e) => e.level === entry.level).length;
        return `(${count})`;
      }
    }
    if (defaultTocSettings.bulletStyle === "bullets") {
      const bullets = ["•", "◦", "▪", "▫", "‣"];
      return bullets[Math.min(entry.level - 1, bullets.length - 1)];
    }
    return "";
  };

  const detectCurrentHeadingLevel = useCallback(() => {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setCurrentHeadingLevel(null);
        return;
      }
      const range = selection.getRangeAt(0);
      let element: Node | null = range.startContainer;
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentNode;
      }
      while (element && element !== document.body) {
        if (element.nodeType === Node.ELEMENT_NODE) {
          const tagName = (element as Element).tagName.toLowerCase();
          if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
            setCurrentHeadingLevel(tagName);
            return;
          }
        }
        element = element.parentNode;
      }
      // If we reach here, the selection is not inside a heading element
      // Check if we're in an editable area to show "normal" as current
      element = range.startContainer;
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentNode;
      }
      while (element && element !== document.body) {
        if (element.nodeType === Node.ELEMENT_NODE) {
          const el = element as HTMLElement;
          if (
            el.contentEditable === "true" ||
            el.closest('[contenteditable="true"]')
          ) {
            setCurrentHeadingLevel("normal");
            return;
          }
        }
        element = element.parentNode;
      }
      setCurrentHeadingLevel(null);
    } catch (e) {
      setCurrentHeadingLevel(null);
    }
  }, []);

  const handleAlignment = (
    alignment: "left" | "center" | "right" | "justify"
  ) => {
    const selectedElement = document.querySelector(
      "[data-element-type].selected"
    ) as HTMLElement;

    const focusedHeader = getFocusedHeader();
    // const focusedFooter = getFocusedFooterContainer();
    const focusedFooter = getFocusedFooter();

    if (focusedHeader) {
      focusedHeader.focus();
      focusedHeader.classList.remove("justify-center");
      focusedHeader.classList.remove("justify-start");
      focusedHeader.classList.remove("justify-end");
      focusedHeader.classList.remove("justify-between");
      focusedHeader.classList.add(
        alignment === "left"
          ? "justify-start"
          : alignment === "right"
          ? "justify-end"
          : "justify-center"
      );
      onUpdateTemplate({
        header: {
          ...template.header,
          alignment,
        },
      });

      return;
    }

    if (focusedFooter) {
      focusedFooter.focus();
      focusedFooter.classList.remove("justify-center");
      focusedFooter.classList.remove("justify-start");
      focusedFooter.classList.remove("justify-end");
      focusedFooter.classList.remove("justify-between");
      focusedFooter.classList.add(
        alignment === "left"
          ? "justify-start"
          : alignment === "right"
          ? "justify-end"
          : alignment === "center"
          ? "justify-center"
          : "justify-between"
      );
      onUpdateTemplate({
        footer: {
          ...template.footer,
          alignment,
        },
      });

      return;
    }

    if (selectedElement) {
      const alignmentStyles = {
        left: "flex-start",
        center: "center",
        right: "flex-end",
        justify: "stretch",
      };
      const container = selectedElement.parentElement;
      if (container && container.classList.contains("element-container")) {
        container.style.justifyContent = alignmentStyles[alignment];
      } else {
        const newContainer = document.createElement("div");
        newContainer.className = "element-container";
        newContainer.style.cssText = `display: flex; width: 100%; margin: 16px 0; justify-content: ${alignmentStyles[alignment]};`;
        selectedElement.parentNode?.insertBefore(newContainer, selectedElement);
        newContainer.appendChild(selectedElement);
      }
    } else {
      const commands = {
        left: "justifyLeft",
        center: "justifyCenter",
        right: "justifyRight",
        justify: "justifyFull",
      };
      execCommand(commands[alignment]);
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      // Capture any valid text selection
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        // Only save if the selection is within our editor areas
        const editorArea = range.commonAncestorContainer;
        const isInEditor =
          editorArea.nodeType === Node.TEXT_NODE
            ? editorArea.parentElement?.closest('[contenteditable="true"]')
            : (editorArea as Element)?.closest('[contenteditable="true"]');

        if (isInEditor) {
          setLastActiveSelection(range.cloneRange());
        }
      }

      // Also call the existing heading level detection
      detectCurrentHeadingLevel();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [detectCurrentHeadingLevel]);

  const generateTocHtml = () => {
    const {
      headingLevels,
      fontFamily,
      title,
      titleColor,
      fontSize,
      textColor,
      showBorder,
      borderWidth,
      borderStyle,
      borderColor,
      indentSize,
      bulletStyle,
    } = defaultTocSettings;

    const filteredEntries = dummyTocEntries.filter((e) =>
      headingLevels.includes(e.level)
    );

    let html = `
    <div class="element-container" style="display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;" contenteditable="false">
      <div style="
        background: white;
        font-family: ${fontFamily};
        position: relative;
        ${
          showBorder
            ? `border: ${borderWidth}px ${borderStyle} ${borderColor};`
            : ""
        }
      " data-element-type="toc" data-element-id="toc-${Date.now()}" draggable="false" contenteditable="false">
        <div style="padding: 16px;">
          <h3 style="
            color: ${titleColor} !important;
            font-family: ${fontFamily};
            font-size: ${fontSize + 4}px;
            font-weight: 600;
            margin: 0 0 16px 0;
          ">${title}</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${filteredEntries
              .map((entry, idx) => {
                const bullet = getBulletSymbol(entry, idx, filteredEntries);
                const indent = (entry.level - 1) * indentSize;
                const pageNumStyle = `
                  margin-left: 16px;
                  flex-shrink: 0;
                  font-family: 'Courier New', monospace;
                  font-size: ${Math.max(fontSize - 1, 10)}px;
                  color: ${textColor};
                  opacity: 0.8;
                `;
                return `
                  <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-left: ${indent}px;
                    color: ${textColor};
                    font-family: ${fontFamily};
                    font-size: ${fontSize}px;
                    line-height: 1.4;
                  ">
                    <div style="display: flex; align-items: flex-start; flex: 1; min-width: 0;">
                      ${
                        bullet
                          ? `<span style="
                              margin-right: 8px;
                              flex-shrink: 0;
                              font-weight: 500;
                              min-width: ${
                                bulletStyle === "roman" ? "40px" : "30px"
                              };
                            ">${bullet}</span>`
                          : ""
                      }
                      <span style="flex: 1; word-break: break-word;">${
                        entry.title
                      }</span>
                    </div>
                    <span style="${pageNumStyle}">${entry.page}</span>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
      </div>
    </div>
  `;

    // strip newlines + leading spaces so no stray <br> or empty spans get injected
    return html.trim().replace(/\n\s*/g, "");
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
      type = "bar",
    } = settings;

    const chartAreaHeight = height - 40 - 60;
    const maxValue = Math.max(...data.map((d) => d.value));
    const barWidth = Math.max(20, (width - 80) / data.length - 10);

    // build the inner chartContent block
    let chartContent = "";
    if (type === "bar") {
      chartContent = `
      <div style="display: flex; align-items: end; justify-content: center; height: auto; padding: 20px;">
        ${data
          .map(
            (item) => `
            <div style="display: flex; flex-direction: column; align-items: center; margin: 0 5px;">
              <div style="
                width: ${barWidth}px;
                height: ${(
                  (item.value / maxValue) *
                  (chartAreaHeight - 80)
                ).toFixed(0)}px;
                background-color: ${item.color};
                border-radius: 4px 4px 0 0;
                position: relative;
              ">
                ${
                  showValues
                    ? `<div style="
                        position: absolute;
                        top: -20px;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 12px;
                        font-weight: bold;
                        color: #374151;
                      ">${item.value}</div>`
                    : ""
                }
              </div>
              <div style="
                margin-top: 8px;
                font-size: 12px;
                text-align: center;
                max-width: ${barWidth + 10}px;
                word-wrap: break-word;
                color: #374151;
              ">${item.label}</div>
            </div>`
          )
          .join("")}
      </div>
    `;
    } else if (type === "pie" || type === "doughnut") {
      const total = data.reduce((sum, d) => sum + d.value, 0);
      let currentAngle = 0;
      const radius = Math.min(width - 72, chartAreaHeight - 40) / 2;
      const centerX = (width - 32) / 2;
      const centerY = (chartAreaHeight - 20) / 2;
      const innerRadius = type === "doughnut" ? radius * 0.5 : 0;

      chartContent = `
      <div style="display: flex; justify-content: center; align-items: center; height: ${chartAreaHeight}px; padding: 20px;">
        <svg width="${width - 32}" height="${
        chartAreaHeight - 20
      }" style="overflow: visible;">
          ${data
            .map((item) => {
              const angle = (item.value / total) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle += angle;
              const rad = (a: number) => ((a - 90) * Math.PI) / 180;
              const x1 = centerX + radius * Math.cos(rad(startAngle));
              const y1 = centerY + radius * Math.sin(rad(startAngle));
              const x2 = centerX + radius * Math.cos(rad(endAngle));
              const y2 = centerY + radius * Math.sin(rad(endAngle));
              const largeArc = angle > 180 ? 1 : 0;
              let path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
              if (type === "doughnut") {
                const ix1 = centerX + innerRadius * Math.cos(rad(startAngle));
                const iy1 = centerY + innerRadius * Math.sin(rad(startAngle));
                const ix2 = centerX + innerRadius * Math.cos(rad(endAngle));
                const iy2 = centerY + innerRadius * Math.sin(rad(endAngle));
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
            .join("")}
          ${
            showValues
              ? data
                  .map((item, idx) => {
                    const startDeg = data
                      .slice(0, idx)
                      .reduce((sum, d) => sum + (d.value / total) * 360, 0);
                    const midAngle = startDeg + (item.value / total) * 180;
                    const rad = ((midAngle - 90) * Math.PI) / 180;
                    const r = (radius + innerRadius) / 2;
                    const x = centerX + r * Math.cos(rad);
                    const y = centerY + r * Math.sin(rad);
                    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="12" font-weight="bold">${item.value}</text>`;
                  })
                  .join("")
              : ""
          }
        </svg>
      </div>
    `;
    } else if (type === "line") {
      const availW = width - 112;
      const availH = chartAreaHeight - 80;
      const spacing = data.length > 1 ? availW / (data.length - 1) : 0;

      chartContent = `
      <div style="position: relative; height: ${chartAreaHeight}px; padding: 30px 40px 50px 40px;">
        <svg width="${availW}" height="${availH}" style="overflow: visible;">
          ${data
            .map((item, i) => {
              const x = i * spacing;
              const y = availH - 40 - (item.value / maxValue) * (availH - 60);
              const next = data[i + 1];
              let seg = "";
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
                    : ""
                }
              `;
            })
            .join("")}
        </svg>
        <div style="position: absolute; bottom: 10px; left: 40px; right: 40px; display: flex; justify-content: space-between;">
          ${data
            .map(
              (item) =>
                `<div style="font-size:11px; text-align:center; color:#374151; flex:1;">${item.label}</div>`
            )
            .join("")}
        </div>
      </div>
    `;
    }

    // wrap the chart block
    const html = `
    <div style="
      width: ${width}px;
      background: ${backgroundColor};
      border: ${borderWidth}px solid ${borderColor};
      border-radius: 8px;
      padding: 16px;
      font-family: Arial, sans-serif;
      position: relative;
      cursor: default;
    " data-element-type="chart" data-element-id="chart-${Date.now()}" data-chart-settings='${JSON.stringify(
      settings
    )}' draggable="false" contenteditable="false">
      ${
        showTitle
          ? `<h3 style="
              margin: 0 0 16px 0;
              text-align: center;
              color: ${titleColor} !important;
              font-size: 16px;
              font-weight: bold;
            ">${title}</h3>`
          : ""
      }
      ${chartContent}
      ${
        showLegend
          ? `<div style="
              display: flex;
              justify-content: center;
              flex-wrap: wrap;
              margin-top: 16px;
              gap: 12px;
            ">
              ${data
                .map(
                  (item) => `
                  <div style="display:flex; align-items:center; gap:6px;">
                    <div style="width:12px; height:12px; background:${item.color}; border-radius:2px;"></div>
                    <span style="font-size:12px; color:#374151;">${item.label}</span>
                  </div>`
                )
                .join("")}
            </div>`
          : ""
      }
    </div>
  `;

    // here’s the magic: strip **all** internal newlines + leading spaces
    return html.trim().replace(/\n\s*/g, "");
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
      type = "bar",
    } = settings;

    const maxValue = Math.max(...data.map((d) => d.value));
    let chartContent = "";

    if (type === "bar") {
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
                        : ""
                    }
                  </div>
                  <div style="margin-top: 4px; font-size: 10px; text-align: center; color: #374151; word-break: break-word; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; max-height: 2.4em;">${
                    item.label
                  }</div>
                </div>`
            )
            .join("")}
        </div>
      `;
    } else if (type === "pie" || type === "doughnut") {
      const total = data.reduce((sum, item) => sum + item.value, 0);
      let currentAngle = 0;
      const radius = 40;
      const centerX = 50;
      const centerY = 50;
      const innerRadius = type === "doughnut" ? radius * 0.5 : 0;

      chartContent = `
        <div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 120px; padding: 8px;">
          <svg width="100" height="100" viewBox="0 0 100 100" style="max-width: 100%; max-height: 100%; height: auto;">
            ${data
              .map((item) => {
                const angle = (item.value / total) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;
                currentAngle += angle;
                const startAngleRad = ((startAngle - 90) * Math.PI) / 180;
                const endAngleRad = ((endAngle - 90) * Math.PI) / 180;
                const x1 = centerX + radius * Math.cos(startAngleRad);
                const y1 = centerY + radius * Math.sin(startAngleRad);
                const x2 = centerX + radius * Math.cos(endAngleRad);
                const y2 = centerY + radius * Math.sin(endAngleRad);
                const largeArcFlag = angle > 180 ? 1 : 0;
                let path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                if (type === "doughnut") {
                  const ix1 = centerX + innerRadius * Math.cos(startAngleRad);
                  const iy1 = centerY + innerRadius * Math.sin(startAngleRad);
                  const ix2 = centerX + innerRadius * Math.cos(endAngleRad);
                  const iy2 = centerY + innerRadius * Math.sin(endAngleRad);
                  path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1} Z`;
                }
                return `<path d="${path}" fill="${item.color}" stroke="#fff" stroke-width="2"/>`;
              })
              .join("")}
          </svg>
        </div>
      `;
    } else if (type === "line") {
      chartContent = `
        <div style="width: 100%; height: 120px; padding: 8px; box-sizing: border-box;">
          <svg width="100%" height="100%" viewBox="0 0 200 100" style="max-width: 100%; height: auto;" preserveAspectRatio="xMidYMid meet">
            ${data
              .map((item, index) => {
                const x = (index / Math.max(data.length - 1, 1)) * 180 + 10;
                const y = 90 - (item.value / maxValue) * 70;
                const nextItem = data[index + 1];
                let line = "";
                if (nextItem && index < data.length - 1) {
                  const nextX =
                    ((index + 1) / Math.max(data.length - 1, 1)) * 180 + 10;
                  const nextY = 90 - (nextItem.value / maxValue) * 70;
                  line = `<line x1="${x}" y1="${y}" x2="${nextX}" y2="${nextY}" stroke="${item.color}" stroke-width="2"/>`;
                }
                return `
                  ${line}
                  <circle cx="${x}" cy="${y}" r="3" fill="${
                  item.color
                }" stroke="#fff" stroke-width="1"/>
                  ${
                    showValues
                      ? `<text x="${x}" y="${
                          y - 8
                        }" text-anchor="middle" font-size="8" fill="#374151">${
                          item.value
                        }</text>`
                      : ""
                  }
                `;
              })
              .join("")}
          </svg>
          <div style="display: flex; justify-content: space-between; margin-top: 4px; padding: 0 10px;">
            ${data
              .map(
                (item) =>
                  `<div style="font-size: 9px; color: #374151; text-align: center; flex: 1; word-break: break-word;">${item.label}</div>`
              )
              .join("")}
          </div>
        </div>
      `;
    }

    return `
      <div style="width: 100% !important; max-width: 100% !important; min-width: 0 !important; height: auto; background: ${backgroundColor}; border: ${borderWidth}px solid ${borderColor}; border-radius: 8px; padding: 12px; font-family: Arial, sans-serif; cursor: default; position: relative; box-sizing: border-box !important; overflow: hidden !important; display: block !important; flex-shrink: 1 !important;" data-element-type="chart" data-element-id="chart-${Date.now()}" data-chart-settings='${JSON.stringify(
      settings
    )}' draggable="false" contenteditable="false">
        ${
          showTitle
            ? `<h3 style="margin: 0 0 12px 0; text-align: center; color: ${titleColor} !important; font-size: 14px; font-weight: bold; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</h3>`
            : ""
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
                .join("")}
            </div>`
            : ""
        }
      </div>
    `;
  };

  // Generate an image placeholder HTML that fits inside a layout column (responsive, width: 100%)
  const generateImagePlaceholderHtmlForLayoutColumn = () => {
    return `
      <div style=\"width: 100%; max-width: 100%; height: 160px; min-height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #f3f4f6; border: 2px dashed #d1d5db; color: #6b7280; border-radius: 8px; cursor: default; position: relative; box-sizing: border-box;\"
           data-element-type=\"image\" data-element-id=\"image-${Date.now()}\"
           data-settings='${JSON.stringify({
             src: "",
             alt: "Image",
             width: "100%",
             height: 160,
             maintainAspectRatio: true,
             alignment: "center",
             borderWidth: 0,
             borderColor: "#e5e7eb",
             borderStyle: "solid",
             borderRadius: 0,
             opacity: 100,
             rotation: 0,
             shadow: false,
             shadowColor: "#000000",
             shadowBlur: 10,
             shadowOffsetX: 0,
             shadowOffsetY: 4,
           })}'
           draggable=\"false\" contenteditable=\"false\">
       
        <div style=\"font-size: 40px; margin-bottom: 6px;\">🖼️</div>
        <div style=\"font-weight: 600; margin-bottom: 3px; color: #374151;\">Click to add image</div>
        <div style=\"font-size: 11px; color: #6b7280;\">or drag and drop</div>
      </div>
    `;
  };

  // Generate a code block HTML that fits inside a layout column (responsive, width: 100%)
  const generateCodeHtmlForLayoutColumn = () => {
    const codeId = `code-${Date.now()}`;
    const defaultCode = `<!DOCTYPE html>
<html>
<head>
  <title>Sample</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`;

    return `
      <div style="width: 100%; max-width: 100%; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; position: relative; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; box-sizing: border-box;"
           data-element-type="code" data-element-id="${codeId}"
           data-settings='${JSON.stringify({
             language: "html",
             theme: "light",
             showLineNumbers: true,
             fontSize: 13,
             tabSize: 2,
             wordWrap: false,
             readOnly: false,
           })}'
           draggable="false" contenteditable="false">
        
        <!-- Compact Language Selector for Layout Column -->
        <div style="background: #f8f9fa; border-bottom: 1px solid #e5e7eb; padding: 6px 12px; display: flex; align-items: center; justify-content: space-between; min-height: 32px;">
          <select style="font-size: 11px; padding: 2px 6px; border: 1px solid #d1d5db; border-radius: 3px; background: white;" data-code-language="true">
            <option value="html">HTML</option>
            <option value="javascript">JS</option>
            <option value="css">CSS</option>
            <option value="python">Python</option>
            <option value="json">JSON</option>
          </select>
          <button style="font-size: 10px; padding: 2px 6px; border: 1px solid #d1d5db; border-radius: 3px; background: white; cursor: pointer;" onclick="copyCodeContent(this)">Copy</button>
        </div>
        
        <div style="display: flex; min-height: 120px;">
          <div style="background-color: #f8f9fa; padding: 12px 6px; color: #6c757d; font-size: 13px; line-height: 1.4; text-align: right; border-right: 1px solid #e5e7eb; user-select: none; min-width: 35px;" data-line-numbers="true">
            ${defaultCode
              .split("\n")
              .map((_, index) => `<div>${index + 1}</div>`)
              .join("")}
          </div>
          <div style="flex: 1; padding: 12px; color: #212529; font-size: 13px; line-height: 1.4; min-height: 120px; white-space: pre; overflow-x: auto; background-color: #ffffff;" contenteditable="true" spellcheck="false" data-code-content="true">${defaultCode}</div>
        </div>
      </div>
    `;
  };

  // Generate an image placeholder HTML that fits inside headers/footers (smaller and inline)
  const generateImagePlaceholderHtmlForHeader = () => {
    return `
      <span style="display: inline-block; padding: 6px; margin: 0 8px; vertical-align: middle; background-color: #f3f4f6; border: 2px dashed #d1d5db; color: #6b7280; border-radius: 4px; cursor: pointer; position: relative; font-size: 10px; text-align: center; transition: all 0.2s ease;"
           data-element-type="image" data-element-id="image-${Date.now()}"
           data-settings='${JSON.stringify({
             src: "",
             alt: "Header Image",
             width: 100,
             height: 60,
             maintainAspectRatio: true,
             alignment: "center",
             borderWidth: 0,
             borderColor: "#e5e7eb",
             borderStyle: "solid",
             borderRadius: 0,
             opacity: 100,
             rotation: 0,
             shadow: false,
             shadowColor: "#000000",
             shadowBlur: 10,
             shadowOffsetX: 0,
             shadowOffsetY: 4,
           })}'
           draggable="false" contenteditable="false"
           onmouseover="this.style.borderColor='#3b82f6'"
           onmouseout="this.style.borderColor='#d1d5db'"
           onclick="this.classList.add('selected')">
        
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 4px;">
          <div style="font-size: 8px; margin-bottom: 2px;">🖼️</div>
         
        </div>
      </span>
      <style>
        [data-element-type="image"].selected {
          border-color: #3b82f6 !important;
          border-style: solid !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
        }
        [data-element-type="image"]:hover {
          border-color: #3b82f6 !important;
        }
      </style>
    `;
  };

  const generateTableHtml = () => {
    const {
      rows,
      columns,
      showBorders,
      borderColor,
      borderWidth,
      headerBackgroundColor,
      headerTextColor,
      cellBackgroundColor,
      cellTextColor,
      cellPadding,
      fontSize,
      fontFamily,
    } = defaultTableSettings;
    const borderStyle = showBorders
      ? `${borderWidth}px solid ${borderColor}`
      : "none";

    const tableData = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: columns }, (_, c) => ({
        content: r === 0 ? `Header ${c + 1}` : `Cell ${r}-${c + 1}`,
        isHeader: r === 0,
        colspan: 1,
        rowspan: 1,
        textAlign: "left" as const,
        merged: false,
      }))
    );

    // Inject the table styles immediately to ensure proper rendering
    const injectTableStyles = () => {
      // Remove any existing table-builder-styles
      const existingStyle = document.getElementById("table-builder-styles");
      if (existingStyle) {
        existingStyle.remove();
      }

      const style = document.createElement("style");
      style.id = "table-builder-styles";
      style.textContent = `
        .table-builder-cell.table-builder-header {
          color: ${headerTextColor} !important;
          background-color: ${headerBackgroundColor} !important;
          font-family: ${fontFamily} !important;
          font-size: ${fontSize}px !important;
          border: ${borderStyle} !important;
        }
        .table-builder-cell.table-builder-body {
          color: ${cellTextColor} !important;
          background-color: ${cellBackgroundColor} !important;
          font-family: ${fontFamily} !important;
          font-size: ${fontSize}px !important;
          border: ${borderStyle} !important;
        }
        .table-builder-cell[data-custom-bg] {
          background-color: var(--custom-bg-color) !important;
        }
        .table-builder-cell[data-custom-align] {
          text-align: var(--custom-text-align) !important;
        }
        .table-builder-cell[data-custom-valign] {
          vertical-align: var(--custom-vertical-align) !important;
        }
      `;
      document.head.appendChild(style);
    };

    // Inject styles immediately
    injectTableStyles();

    // build the raw HTML (with internal newlines and indentation)
    let html = `
   <div class="element-container" style="display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;" contenteditable="false">
     <div style="position: relative;" draggable="false" data-element-type="table" data-element-id="table-${Date.now()}" data-table-settings='${JSON.stringify(
      {
        ...defaultTableSettings,
        data: tableData,
      }
    )}' contenteditable="false">
       
       <table style="width: 100%; border-collapse: collapse; font-family: ${fontFamily}; font-size: ${fontSize}px; border: ${borderStyle};">
         ${tableData
           .map(
             (row, rowIndex) =>
               `<tr>${row
                 .map((cell, colIndex) => {
                   const tag = cell.isHeader ? "th" : "td";
                   const bg = cell.isHeader
                     ? headerBackgroundColor
                     : cellBackgroundColor;
                   const color = cell.isHeader
                     ? headerTextColor
                     : cellTextColor;
                   const weight = cell.isHeader ? "bold" : "normal";
                   const cellClass = cell.isHeader
                     ? "table-builder-cell table-builder-header"
                     : "table-builder-cell table-builder-body";
                   return `<${tag} class="${cellClass}" style="
                     border: ${borderStyle} !important;
                     padding: ${cellPadding}px;
                     background-color: ${bg} !important;
                     font-size: ${fontSize}px;
                     color: ${color} !important;
                     text-align: left;
                     font-weight: ${weight};
                   " data-row="${rowIndex}" data-col="${colIndex}" contenteditable="true">
                     ${cell.content}
                   </${tag}>`;
                 })
                 .join("")}</tr>`
           )
           .join("")}
       </table>
     </div>
   </div>
  `;

    // strip out all internal line breaks + indentation
    return html.trim().replace(/\n\s*/g, "");
  };

  const generateLayoutHtml = () => {
    const layoutId = `layout-${Date.now()}`;
    return `
     <div class="element-container" style="display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;" contenteditable="false">
       <div 
         class="layout-element" 
         data-element-type="layout" 
         data-element-id="${layoutId}" 
         data-settings='{"columns":2,"columnGap":16,"backgroundColor":"#ffffff","borderColor":"#e5e7eb","borderWidth":1,"borderRadius":8,"padding":16,"minHeight":120}' 
         style="width: 100%; min-height: 120px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; display: flex; gap: 16px; position: relative;"
         contenteditable="false" 
       >
        
         
         <div class="layout-column" style="flex: 1; min-height: 80px; border: 2px dashed #d1d5db; border-radius: 4px; padding: 12px; position: relative; display: flex; flex-direction: column;">
           <div class="layout-column-content" contenteditable="true" style="flex: 1; outline: none; font-size: ${effectiveTheme.typography.bodyFontSize}px; color: ${effectiveTheme.colors.text}; line-height: 1.5; min-height: 60px; padding-top: 20px; cursor: text; font-family: ${effectiveTheme.typography.bodyFont};">
           </div>
         </div>
         <div class="layout-column" style="flex: 1; min-height: 80px; border: 2px dashed #d1d5db; border-radius: 4px; padding: 12px; position: relative; display: flex; flex-direction: column;">
           <div class="layout-column-content" contenteditable="true" style="flex: 1; outline: none; font-size: ${effectiveTheme.typography.bodyFontSize}px; color: ${effectiveTheme.colors.text}; line-height: 1.5; min-height: 60px; padding-top: 20px; cursor: text; font-family: ${effectiveTheme.typography.bodyFont};">
           </div>
         </div>
       </div>
     </div>
   `;
  };

  const generateImagePlaceholderHtml = () => {
    return `
    <div class="element-container" style="display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;" contenteditable="false">
      <div style="width: 300px; height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #f3f4f6; border: 2px dashed #d1d5db; color: #6b7280; border-radius: 8px; cursor: default; position: relative;" 
           data-element-type="image" data-element-id="image-${Date.now()}" 
           data-settings='${JSON.stringify({
             src: "",
             alt: "Image",
             width: 300,
             height: 200,
             maintainAspectRatio: true,
             alignment: "left",
             borderWidth: 0,
             borderColor: "#e5e7eb",
             borderStyle: "solid",
             borderRadius: 0,
             opacity: 100,
             rotation: 0,
             shadow: false,
             shadowColor: "#000000",
             shadowBlur: 10,
             shadowOffsetX: 0,
             shadowOffsetY: 4,
           })}' 
           draggable="false" contenteditable="false">
       
        <div style="font-size: 48px; margin-bottom: 8px;">🖼️</div>
        <div style="font-weight: 600; margin-bottom: 4px; color: ${
          effectiveTheme.colors.text
        };">Click to add image</div>
        <div style="font-size: 12px; color: ${
          effectiveTheme.colors.text
        };">or drag and drop</div>
      </div>
    </div>`;
  };

  const generateCodeHtml = () => {
    const codeId = `code-${Date.now()}`;
    const defaultCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample HTML</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a sample HTML document.</p>
</body>
</html>`;

    return `
    <div class="element-container" style="display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;" contenteditable="false">
      <div style="width: 100%; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; position: relative; font-family: 'Consolas', 'Monaco', 'Courier New', monospace;"
           data-element-type="code" data-element-id="${codeId}"
           data-settings='${JSON.stringify({
             language: "html",
             theme: "light",
             showLineNumbers: true,
             fontSize: 14,
             tabSize: 2,
             wordWrap: false,
             readOnly: false,
           })}'
           draggable="false" contenteditable="false">
        
        <!-- Language Selector Header -->
       <div style="background: #f8f9fa; border-bottom: 1px solid #e5e7eb; padding: 8px 16px; display: flex; align-items: center; justify-content: flex-end; min-height: 40px;">
  <div style="display: flex; align-items: center; gap: 12px;">
    <span style="font-size: 12px; font-weight: 500; color: #374151;">Language:</span>
    <select style="font-size: 12px; padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white;" data-code-language="true">
      <option value="html">HTML</option>
      <option value="javascript">JavaScript</option>
      <option value="css">CSS</option>
      <option value="python">Python</option>
      <option value="json">JSON</option>
      <option value="java">Java</option>
      <option value="cpp">C++</option>
      <option value="sql">SQL</option>
      <option value="bash">Bash</option>
      <option value="plain">Plain Text</option>
    </select>
  </div>
</div>

        
        <div style="display: flex; min-height: 200px;">
          <div style="background-color: #f8f9fa; padding: 16px 8px; color: #6c757d; font-size: 14px; line-height: 1.5; text-align: right; border-right: 1px solid #e5e7eb; user-select: none; min-width: 40px;" data-line-numbers="true">
            ${defaultCode
              .split("\n")
              .map((_, index) => `<div>${index + 1}</div>`)
              .join("")}
          </div>
          <div style="flex: 1; padding: 16px; color: #212529; font-size: 14px; line-height: 1.5; min-height: 200px; white-space: pre; overflow-x: auto; background-color: #ffffff;" contenteditable="true" spellcheck="false" data-code-content="true">${defaultCode}</div>
        </div>
      </div>
    </div>`;
  };

  // Function to update line numbers for code blocks
  const updateCodeLineNumbers = (codeElement: HTMLElement) => {
    const lineNumbersContainer = codeElement.querySelector(
      '[data-line-numbers="true"]'
    ) as HTMLElement;
    const codeContent = codeElement.querySelector(
      '[data-code-content="true"]'
    ) as HTMLElement;

    if (lineNumbersContainer && codeContent) {
      const lines = codeContent.textContent?.split("\n") || [""];
      const lineCount = lines.length;

      lineNumbersContainer.innerHTML = "";
      for (let i = 1; i <= lineCount; i++) {
        const lineDiv = document.createElement("div");
        lineDiv.textContent = i.toString();
        lineNumbersContainer.appendChild(lineDiv);
      }
    }
  };

  // Complete code editor functionality - single comprehensive implementation
  useEffect(() => {
    // Language-specific syntax highlighting functions
    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    };

    const highlightJavaScript = (code: string): string => {
      return escapeHtml(code)
        .replace(
          /\b(function|const|let|var|if|else|for|while|return|class|extends|import|export|from|default|async|await|try|catch|finally|throw|new|this|super|typeof|instanceof|break|continue|switch|case|do)\b/g,
          '<span style="color: #d73a49; font-weight: 600;">$1</span>'
        )
        .replace(
          /\b(true|false|null|undefined)\b/g,
          '<span style="color: #005cc5;">$1</span>'
        )
        .replace(/\b(\d+\.?\d*)\b/g, '<span style="color: #005cc5;">$1</span>')
        .replace(
          /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g,
          '<span style="color: #032f62;">$1$2$1</span>'
        )
        .replace(
          /\/\/.*$/gm,
          '<span style="color: #6a737d; font-style: italic;">$&</span>'
        )
        .replace(
          /\/\*[\s\S]*?\*\//g,
          '<span style="color: #6a737d; font-style: italic;">$&</span>'
        );
    };

    const highlightPython = (code: string): string => {
      return escapeHtml(code)
        .replace(
          /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|async|await|and|or|not|in|is|break|continue|pass|raise)\b/g,
          '<span style="color: #d73a49; font-weight: 600;">$1</span>'
        )
        .replace(
          /\b(True|False|None)\b/g,
          '<span style="color: #005cc5;">$1</span>'
        )
        .replace(/\b(\d+\.?\d*)\b/g, '<span style="color: #005cc5;">$1</span>')
        .replace(
          /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g,
          '<span style="color: #032f62;">$1$2$1</span>'
        )
        .replace(
          /#.*$/gm,
          '<span style="color: #6a737d; font-style: italic;">$&</span>'
        );
    };

    const highlightCSS = (code: string): string => {
      return escapeHtml(code)
        .replace(
          /([.#]?[\w-]+)\s*\{/g,
          '<span style="color: #6f42c1;">$1</span> {'
        )
        .replace(/([\w-]+)\s*:/g, '<span style="color: #d73a49;">$1</span>:')
        .replace(/:\s*([^;]+);/g, ': <span style="color: #005cc5;">$1</span>;')
        .replace(
          /\/\*[\s\S]*?\*\//g,
          '<span style="color: #6a737d; font-style: italic;">$&</span>'
        );
    };

    const highlightJSON = (code: string): string => {
      return escapeHtml(code)
        .replace(
          /("(?:[^"\\]|\\.)*")\s*:/g,
          '<span style="color: #6f42c1;">$1</span>:'
        )
        .replace(
          /:\s*("(?:[^"\\]|\\.)*")/g,
          ': <span style="color: #032f62;">$1</span>'
        )
        .replace(
          /:\s*(\d+\.?\d*)/g,
          ': <span style="color: #005cc5;">$1</span>'
        )
        .replace(
          /:\s*(true|false|null)/g,
          ': <span style="color: #005cc5;">$1</span>'
        );
    };

    const highlightHTML = (code: string): string => {
      return code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(
          /(&lt;!--[\s\S]*?--&gt;)/g,
          '<span style="color: #6a737d; font-style: italic;">$1</span>'
        )
        .replace(
          /(&lt;!DOCTYPE[^&]*&gt;)/gi,
          '<span style="color: #6f42c1; font-weight: bold;">$1</span>'
        )
        .replace(
          /(&lt;\/?)([a-zA-Z0-9-]+)([^&]*?)(&gt;)/g,
          '<span style="color: #22863a;">$1</span><span style="color: #d73a49;">$2</span><span style="color: #6f42c1;">$3</span><span style="color: #22863a;">$4</span>'
        );
    };

    // Apply syntax highlighting based on language
    const applySyntaxHighlighting = (codeElement: HTMLElement) => {
      const codeContent = codeElement.querySelector(
        '[data-code-content="true"]'
      ) as HTMLElement;
      const languageSelect = codeElement.querySelector(
        '[data-code-language="true"]'
      ) as HTMLSelectElement;

      if (!codeContent || !languageSelect) return;

      const language = languageSelect.value;

      // Always get the clean text content, not innerHTML
      const text = codeContent.textContent || "";

      // If the text is empty, don't do anything
      if (!text.trim()) return;

      // Save cursor position BEFORE any changes
      const selection = window.getSelection();
      let savedCursorPosition = 0;

      if (selection && selection.rangeCount > 0 && selection.anchorNode) {
        // Check if selection is within our code content
        const range = selection.getRangeAt(0);
        if (codeContent.contains(range.startContainer)) {
          // Calculate text-only offset
          let textOffset = 0;
          const walker = document.createTreeWalker(
            codeContent,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node;
          while ((node = walker.nextNode())) {
            if (node === range.startContainer) {
              savedCursorPosition = textOffset + range.startOffset;
              break;
            }
            textOffset += node.textContent?.length || 0;
          }
        }
      }

      // Apply highlighting based on language
      let highlightedHtml = "";
      switch (language) {
        case "javascript":
          highlightedHtml = highlightJavaScript(text);
          break;
        case "python":
          highlightedHtml = highlightPython(text);
          break;
        case "css":
          highlightedHtml = highlightCSS(text);
          break;
        case "json":
          highlightedHtml = highlightJSON(text);
          break;
        case "html":
          highlightedHtml = highlightHTML(text);
          break;
        default:
          highlightedHtml = escapeHtml(text);
      }

      // Only update if content is actually different
      if (codeContent.innerHTML !== highlightedHtml) {
        // Store original text for comparison
        const originalText = codeContent.textContent;

        // Update the innerHTML
        codeContent.innerHTML = highlightedHtml;

        // Verify the text content hasn't changed
        if (codeContent.textContent !== originalText) {
          // If text changed, something went wrong - revert to plain text
          console.warn(
            "Text content changed during highlighting, reverting to plain text"
          );
          codeContent.textContent = originalText;
          return;
        }

        // Restore cursor position
        requestAnimationFrame(() => {
          if (selection && savedCursorPosition >= 0) {
            try {
              const walker = document.createTreeWalker(
                codeContent,
                NodeFilter.SHOW_TEXT,
                null
              );

              let currentOffset = 0;
              let targetNode = null;
              let node;

              while ((node = walker.nextNode())) {
                const nodeLength = node.textContent?.length || 0;
                if (currentOffset + nodeLength >= savedCursorPosition) {
                  targetNode = node;
                  break;
                }
                currentOffset += nodeLength;
              }

              if (targetNode) {
                const range = document.createRange();
                const relativeOffset = Math.min(
                  Math.max(0, savedCursorPosition - currentOffset),
                  targetNode.textContent?.length || 0
                );
                range.setStart(targetNode, relativeOffset);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            } catch (e) {
              console.log("Cursor restoration failed:", e);
              // Focus the element as fallback
              try {
                codeContent.focus();
              } catch (focusError) {
                console.log("Focus fallback failed:", focusError);
              }
            }
          }
        });
      }
    };

    // Update line numbers
    const updateLineNumbers = (codeElement: HTMLElement) => {
      const lineNumbersContainer = codeElement.querySelector(
        '[data-line-numbers="true"]'
      ) as HTMLElement;
      const codeContent = codeElement.querySelector(
        '[data-code-content="true"]'
      ) as HTMLElement;

      if (lineNumbersContainer && codeContent) {
        const lines = (codeContent.textContent || "").split("\n");
        const lineCount = Math.max(lines.length, 1);

        lineNumbersContainer.innerHTML = "";
        for (let i = 1; i <= lineCount; i++) {
          const lineDiv = document.createElement("div");
          lineDiv.textContent = i.toString();
          lineNumbersContainer.appendChild(lineDiv);
        }
      }
    };

    // Copy functionality
    (window as any).copyCodeContent = (button: HTMLButtonElement) => {
      const codeElement = button.closest('[data-element-type="code"]');
      if (codeElement) {
        const codeContent = codeElement.querySelector(
          '[data-code-content="true"]'
        ) as HTMLElement;
        if (codeContent && navigator.clipboard) {
          navigator.clipboard
            .writeText(codeContent.textContent || "")
            .then(() => {
              const originalText = button.textContent;
              button.textContent = "Copied!";
              button.style.color = "#22863a";
              setTimeout(() => {
                button.textContent = originalText;
                button.style.color = "";
              }, 1500);
            })
            .catch(console.error);
        }
      }
    };

    // BULLETPROOF Keyboard event handler - FIXES ALL CURSOR JUMPING
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Only handle events for code content areas
      if (!target || target.getAttribute("data-code-content") !== "true") {
        return;
      }

      // CRITICAL FIX: Stop ALL event propagation for code editor
      e.stopPropagation();
      e.stopImmediatePropagation();

      const codeElement = target.closest(
        '[data-element-type="code"]'
      ) as HTMLElement;
      if (!codeElement) return;

      // Handle Enter key
      if (e.key === "Enter") {
        e.preventDefault();

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);

          // Get current line for indentation calculation
          const textBefore =
            range.startContainer.textContent?.substring(0, range.startOffset) ||
            "";
          const currentLineStart = textBefore.lastIndexOf("\n") + 1;
          const currentLine = textBefore.substring(currentLineStart);

          // Calculate indentation
          const indentMatch = currentLine.match(/^(\s*)/);
          const currentIndent = indentMatch ? indentMatch[1] : "";

          // Insert new line with proper indentation
          const newLineText = "\n" + currentIndent;

          range.deleteContents();
          const textNode = document.createTextNode(newLineText);
          range.insertNode(textNode);

          // Position cursor after the new line
          range.setStartAfter(textNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);

          // Update line numbers
          setTimeout(() => {
            updateLineNumbers(codeElement);
          }, 0);
        }
        return;
      }

      // Handle Tab key for indentation
      if (e.key === "Tab") {
        e.preventDefault();

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();

          const tabText = "  "; // 2 spaces
          const textNode = document.createTextNode(tabText);
          range.insertNode(textNode);

          range.setStartAfter(textNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        return;
      }

      // For ALL other keys (space, brackets, letters, etc.), allow them
      // but prevent propagation to avoid conflicts with other handlers
    };

    // BULLETPROOF Input event handler - prevents cursor jumping
    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;

      if (target && target.getAttribute("data-code-content") === "true") {
        // CRITICAL FIX: Stop propagation for code editor inputs
        e.stopPropagation();
        e.stopImmediatePropagation();

        const codeElement = target.closest(
          '[data-element-type="code"]'
        ) as HTMLElement;
        if (codeElement) {
          // Update line numbers immediately
          updateLineNumbers(codeElement);

          // Clear any existing timeout for this specific element
          if ((codeElement as any).highlightTimeout) {
            clearTimeout((codeElement as any).highlightTimeout);
          }

          // Store the current text to prevent unnecessary highlighting
          const currentText = target.textContent || "";
          if ((codeElement as any).lastHighlightedText !== currentText) {
            (codeElement as any).lastHighlightedText = currentText;

            // Longer debounce for stability
            (codeElement as any).highlightTimeout = setTimeout(() => {
              // Double-check that the element still exists and hasn't changed
              if (
                codeElement.isConnected &&
                target.getAttribute("data-code-content") === "true"
              ) {
                applySyntaxHighlighting(codeElement);
              }
            }, 800); // Even longer delay for maximum stability
          }

          // Update page content if needed
          if (selectedPage && onUpdatePage) {
            const editor = getCurrentlyFocusedEditor();
            if (editor) {
              setTimeout(() => {
                onUpdatePage(selectedPage.id, { content: editor.innerHTML });
              }, 10);
            }
          }
        }
      }
    };

    // Language change handler with safety checks
    const handleLanguageChange = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      if (target.getAttribute("data-code-language") === "true") {
        const codeElement = target.closest(
          '[data-element-type="code"]'
        ) as HTMLElement;
        if (codeElement) {
          // Clear any pending highlighting timeout
          if ((codeElement as any).highlightTimeout) {
            clearTimeout((codeElement as any).highlightTimeout);
          }

          // Apply highlighting immediately when language changes
          setTimeout(() => {
            if (codeElement.isConnected) {
              applySyntaxHighlighting(codeElement);
            }
          }, 10);
        }
      }
    };

    // Initialize existing code blocks safely
    const initializeCodeBlocks = () => {
      // Wait for DOM to be fully ready
      setTimeout(() => {
        const codeBlocks = document.querySelectorAll(
          '[data-element-type="code"]'
        );
        codeBlocks.forEach((codeElement) => {
          const htmlElement = codeElement as HTMLElement;

          // Initialize line numbers
          updateLineNumbers(htmlElement);

          // Initialize syntax highlighting only if content exists
          const codeContent = htmlElement.querySelector(
            '[data-code-content="true"]'
          ) as HTMLElement;
          if (
            codeContent &&
            codeContent.textContent &&
            codeContent.textContent.trim()
          ) {
            // Mark as initialized to prevent double highlighting
            if (!(htmlElement as any).highlightInitialized) {
              (htmlElement as any).highlightInitialized = true;
              applySyntaxHighlighting(htmlElement);
            }
          }
        });
      }, 100);
    };

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown, true); // Use capture phase
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleLanguageChange);

    // Initialize on mount
    initializeCodeBlocks();

    // Cleanup with better timeout management
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("input", handleInput);
      document.removeEventListener("change", handleLanguageChange);
      delete (window as any).copyCodeContent;

      // Clear all timeouts and cleanup flags
      const codeBlocks = document.querySelectorAll(
        '[data-element-type="code"]'
      );
      codeBlocks.forEach((codeElement) => {
        const htmlElement = codeElement as HTMLElement;
        if ((htmlElement as any).highlightTimeout) {
          clearTimeout((htmlElement as any).highlightTimeout);
          delete (htmlElement as any).highlightTimeout;
        }
        delete (htmlElement as any).lastHighlightedText;
        delete (htmlElement as any).highlightInitialized;
      });
    };
  }, [selectedPage, onUpdatePage]);

  const insertElement = (type: string) => {
    const focusedColumn = getFocusedColumn();
    const focusedHeader = getFocusedHeader();
    const focusedFooter = getFocusedFooter();

    // Check if cursor is inside a table cell - if so, prevent insertion
    let isInsideTableCell = false;
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let element: Node | null = range.commonAncestorContainer;

      // Walk up the DOM tree to find if we're inside a table
      while (element && element.nodeType !== Node.DOCUMENT_NODE) {
        if (element.nodeType === Node.ELEMENT_NODE) {
          const htmlElement = element as HTMLElement;
          // Check if we're inside a table cell (td, th) or any element with data-element-type="table"
          if (
            htmlElement.tagName === "TD" ||
            htmlElement.tagName === "TH" ||
            htmlElement.closest('[data-element-type="table"]')
          ) {
            isInsideTableCell = true;
            break;
          }
        }
        element = element.parentNode;
      }
    }

    // Prevent insertion if cursor is inside a table cell
    if (isInsideTableCell) {
      console.warn(
        "Cannot insert elements inside table cells. Please click outside the table to add new elements."
      );
      // You could replace this with a toast notification or custom alert component
      return;
    }

    // Alternative detection: check if cursor is currently in a layout column
    let isInLayoutColumn = false;
    let detectedLayoutColumn: HTMLElement | null = null;
    const activeElement = document.activeElement;

    if (activeElement) {
      const layoutColumn = activeElement.closest(".layout-column-content");
      if (layoutColumn) {
        isInLayoutColumn = true;
        detectedLayoutColumn = layoutColumn as HTMLElement;
        // If we detected a layout column but focusedColumn is null, set it
        if (!focusedColumn) {
          console.log(
            "Detected layout column via DOM traversal, updating focus tracker"
          );
          setFocusedColumn(layoutColumn as HTMLElement);
        }
      }
    }

    // Additional robust detection: check current selection
    if (!isInLayoutColumn) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const ancestor = range.commonAncestorContainer;
        const parentElement =
          ancestor.nodeType === Node.TEXT_NODE
            ? ancestor.parentElement
            : (ancestor as Element);
        if (parentElement) {
          const layoutColumn = parentElement.closest(".layout-column-content");
          if (layoutColumn) {
            isInLayoutColumn = true;
            detectedLayoutColumn = layoutColumn as HTMLElement;
            console.log("Detected layout column via selection traversal");
            if (!focusedColumn) {
              setFocusedColumn(layoutColumn as HTMLElement);
            }
          }
        }
      }
    }

    // Debug logging
    console.log("Insert element debug:", {
      type,
      focusedColumn: focusedColumn ? "has column" : "no column",
      focusedHeader: focusedHeader ? "has header" : "no header",
      focusedFooter: focusedFooter ? "has footer" : "no footer",
      isInLayoutColumn,
      isInsideTableCell,
      detectedLayoutColumn: detectedLayoutColumn
        ? "detected column"
        : "no detected column",
      selection: window.getSelection()?.toString(),
      activeElement: document.activeElement?.className,
      activeElementTagName: document.activeElement?.tagName,
    });

    let html = "";

    // Use header/footer-specific generators if inside header/footer
    if (focusedHeader || focusedFooter) {
      switch (type) {
        case "image":
          html = generateImagePlaceholderHtmlForHeader();
          break;
        // Only allow image insertion in headers/footers for now
        default:
          console.warn(
            `Element type "${type}" is not supported in headers/footers yet.`
          );
          return;
      }
    }
    // Use layout-specific generators for chart/image if inside a layout column
    else if (focusedColumn || isInLayoutColumn) {
      console.log("Using layout column specific generator for", type);
      switch (type) {
        case "table":
          html = generateTableHtml();
          break;
        case "chart":
          html = generateChartHtmlForLayoutColumn(defaultChartSettings);
          break;
        case "image":
          html = generateImagePlaceholderHtmlForLayoutColumn();
          break;
        case "toc":
          html = generateTocHtml();
          break;
        case "layout":
          html = generateLayoutHtml();
          break;
        case "code":
          html = generateCodeHtmlForLayoutColumn();
          break;
      }
    } else {
      // Default: use original generators for main editor
      // console.log("Using main editor insertion");
      switch (type) {
        case "table":
          html = generateTableHtml();
          break;
        case "chart":
          html = generateChartHtml(defaultChartSettings);
          break;
        case "image":
          html = generateImagePlaceholderHtml();
          break;
        case "toc":
          html = generateTocHtml();
          break;
        case "layout":
          html = generateLayoutHtml();
          break;
        case "code":
          html = generateCodeHtml();
          break;
      }
    }

    if (html) {
      if (focusedColumn || isInLayoutColumn) {
        // Get the actual layout column element
        const targetColumn =
          focusedColumn ||
          detectedLayoutColumn ||
          (activeElement?.closest(".layout-column-content") as HTMLElement);

        if (targetColumn) {
          console.log("Inserting into layout column:", targetColumn);
          // Insert at caret in focused column
          targetColumn.focus();
          const selection = window.getSelection();
          let range: Range;
          if (selection && selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
            if (!targetColumn.contains(range.commonAncestorContainer)) {
              range = document.createRange();
              range.selectNodeContents(targetColumn);
              range.collapse(false);
            }
          } else {
            range = document.createRange();
            range.selectNodeContents(targetColumn);
            range.collapse(false);
          }
          selection?.removeAllRanges();
          selection?.addRange(range);
          document.execCommand("insertHTML", false, html);

          // Trigger overflow check after element insertion
          setTimeout(() => {
            if ((window as any).forceEditorOverflowCheck) {
              (window as any).forceEditorOverflowCheck();
            }
          }, 100);
        } else {
          console.warn("Could not find target layout column for insertion");
        }
      } else if (focusedHeader || focusedFooter) {
        // Insert at caret in focused header or footer
        const targetElement = focusedHeader || focusedFooter;
        if (targetElement) {
          targetElement.focus();
          const selection = window.getSelection();
          let range: Range;
          if (selection && selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
            if (!targetElement.contains(range.commonAncestorContainer)) {
              range = document.createRange();
              range.selectNodeContents(targetElement);
              range.collapse(false);
            }
          } else {
            range = document.createRange();
            range.selectNodeContents(targetElement);
            range.collapse(false);
          }
          selection?.removeAllRanges();
          selection?.addRange(range);
          document.execCommand("insertHTML", false, html);
        }
      } else {
        // Default: insert into currently focused editor
        const editor = getCurrentlyFocusedEditor();
        if (!editor) {
          console.warn("No content editor found for inserting element.");
          return;
        }

        editor.focus();
        const selection = window.getSelection();
        let range: Range;
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
          if (!editor.contains(range.commonAncestorContainer)) {
            range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
          }
        } else {
          range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
        }
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand(
          "insertHTML",
          false,
          `<div class=\"element-container\" style=\"display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;\" contenteditable=\"false\">${html}</div>`
        );

        // Trigger overflow check after element insertion
        setTimeout(() => {
          if ((window as any).forceEditorOverflowCheck) {
            (window as any).forceEditorOverflowCheck();
          }
        }, 100);

        // Attach focus tracking to layout columns if layout was inserted
        if (type === "layout") {
          setTimeout(() => {
            attachFocusTrackingToLayoutColumns();
          }, 10);
        }
        setTimeout(() => {
          if (selectedPage && onUpdatePage) {
            onUpdatePage(selectedPage.id, { content: editor.innerHTML });
          }
        }, 50);
        setTimeout(() => {
          const trailingP = document.createElement("p");
          trailingP.innerHTML = "&nbsp;";
          trailingP.style.color = effectiveTheme.colors.text;
          editor.appendChild(trailingP);
          const newRange = document.createRange();
          newRange.setStartAfter(trailingP);
          newRange.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(newRange);
        }, 100);
      }
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (!url) return;

    const focusedColumn = getFocusedColumn();
    const targetEditor = focusedColumn || getCurrentlyFocusedEditor();
    if (!targetEditor) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (targetEditor.contains(range.commonAncestorContainer)) {
        if (!range.collapsed) {
          // There is a selection, wrap it in an <a>
          const selectedText = range.extractContents();
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.style.color = "#0000ee";
          a.style.textDecoration = "underline";
          a.style.cursor = "pointer";
          a.appendChild(selectedText);
          range.insertNode(a);
        } else {
          // No selection, insert a new <a> with text 'Link'
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = "Link";
          a.style.color = "#0000ee";
          a.style.textDecoration = "underline";
          a.style.cursor = "pointer";
          range.insertNode(a);
          // Move caret after the inserted link
          range.setStartAfter(a);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        // Update page content
        if (selectedPage && onUpdatePage) {
          setTimeout(() => {
            onUpdatePage(selectedPage.id, {
              content: targetEditor.innerHTML,
            });
          }, 10);
        }
      }
    }
  };

  // Function to attach focus tracking events to layout columns
  const attachFocusTrackingToLayoutColumns = () => {
    const layoutColumns = document.querySelectorAll(".layout-column-content");
    layoutColumns.forEach((column) => {
      // Remove existing event listeners to avoid duplicates
      column.removeEventListener("focus", handleColumnFocus);
      column.removeEventListener("blur", handleColumnBlur);
      column.removeEventListener("click", handleColumnClick);
      column.removeEventListener("keydown", handleListKeydown);

      // Add new event listeners
      column.addEventListener("focus", handleColumnFocus);
      column.addEventListener("blur", handleColumnBlur);
      column.addEventListener("click", handleColumnClick);
      column.addEventListener("keydown", handleListKeydown);
    });
  };

  const handleColumnFocus = (e: Event) => {
    console.log("Column focused:", e.target);
    setFocusedColumn(e.target as HTMLElement);
  };

  const handleColumnBlur = (e: Event) => {
    const target = e.target as HTMLElement;
    console.log("Column blurred:", target);
    if (target === getFocusedColumn()) {
      setFocusedColumn(null);
    }
  };

  const handleColumnClick = (e: Event) => {
    console.log("Column clicked:", e.target);
    setFocusedColumn(e.target as HTMLElement);
  };

  // Set up mutation observer to automatically attach focus tracking to new layout columns
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if the added element is a layout column or contains layout columns
              const layoutColumns =
                element.querySelectorAll?.(".layout-column-content") ||
                (element.classList?.contains("layout-column-content")
                  ? [element]
                  : []);
              layoutColumns.forEach((column) => {
                column.removeEventListener("focus", handleColumnFocus);
                column.removeEventListener("blur", handleColumnBlur);
                column.removeEventListener("click", handleColumnClick);
                column.removeEventListener("keydown", handleListKeydown);
                column.addEventListener("focus", handleColumnFocus);
                column.addEventListener("blur", handleColumnBlur);
                column.addEventListener("click", handleColumnClick);
                column.addEventListener("keydown", handleListKeydown);
              });
            }
          });
        }
      });
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial attachment to existing layout columns
    attachFocusTrackingToLayoutColumns();

    return () => {
      observer.disconnect();
    };
  }, []);

  // Make links clickable in edit mode
  useEffect(() => {
    const editors = document.querySelectorAll(
      '.template-builder-editor-content-area [contenteditable="true"]'
    );
    if (!editors.length) return;

    const handleLinkClick = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const target = mouseEvent.target as HTMLElement;
      if (target.tagName === "A") {
        // Only open if not holding modifier keys (so user can still select/edit links)
        if (
          !mouseEvent.ctrlKey &&
          !mouseEvent.metaKey &&
          !mouseEvent.shiftKey &&
          !mouseEvent.altKey
        ) {
          mouseEvent.preventDefault();
          const href = (target as HTMLAnchorElement).href;
          if (href) {
            window.open(href, "_blank", "noopener,noreferrer");
          }
        }
      }
    };

    // Add event listeners to all editors
    editors.forEach((editor) => {
      editor.addEventListener("click", handleLinkClick);
    });

    return () => {
      editors.forEach((editor) => {
        editor.removeEventListener("click", handleLinkClick);
      });
    };
  }, []);

  // Handle Enter key in lists to create new list items
  useEffect(() => {
    const editors = document.querySelectorAll(
      '.template-builder-editor-content-area [contenteditable="true"]'
    );
    if (!editors.length) return;

    // Add event listeners to all editors
    editors.forEach((editor) => {
      editor.addEventListener("keydown", handleListKeydown);
    });

    return () => {
      editors.forEach((editor) => {
        editor.removeEventListener("keydown", handleListKeydown);
      });
    };
  }, [selectedPage, onUpdatePage]); // Include dependencies for the update callback

  // Handle title numbering toggle changes
  useEffect(() => {
    const editors = document.querySelectorAll(
      '.template-builder-editor-content-area [contenteditable="true"]'
    );
    const layoutColumns = document.querySelectorAll(".layout-column-content");
    const allContainers = [
      ...Array.from(editors),
      ...Array.from(layoutColumns),
    ];

    allContainers.forEach((container) => {
      if (template?.theme?.typography?.titleNumbering) {
        updateAllHeadingNumbers(container as HTMLElement, selectedPage);
      } else {
        removeHeadingNumbers(container as HTMLElement);
      }
    });

    // Update page content to persist the changes
    setTimeout(() => {
      if (selectedPage && onUpdatePage) {
        const mainEditor = getCurrentlyFocusedEditor();
        if (mainEditor) {
          onUpdatePage(selectedPage.id, { content: mainEditor.innerHTML });
        }
      }
    }, 100);
  }, [template?.theme?.typography?.titleNumbering]);

  return (
    <div className="bg-background border-b border-border p-2 sticky top-0 z-10 template-builder-toolbar">
      <div className="flex items-center gap-1 flex-wrap">
        <Select value={currentFont} onValueChange={handleFontChange}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-foreground">
            {fontFamilies.map((font) => (
              <SelectItem key={font} value={font}>
                <span style={{ fontFamily: font }}>{font}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={currentSize} onValueChange={handleSizeChange}>
          <SelectTrigger className="w-16 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-foreground">
            {fontSizes.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-foreground"
            >
              <Heading className="h-4 w-4" />
              {currentHeadingLevel && (
                <span className="text-xs font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  {currentHeadingLevel.toUpperCase()}
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="space-y-1">
              {headingLevels.map((h) => (
                <Button
                  key={h.value}
                  variant={
                    currentHeadingLevel === h.value ? "default" : "ghost"
                  }
                  size="sm"
                  className="w-full justify-start h-8 text-foreground"
                  onClick={() => insertHeading(h.value)}
                >
                  <span style={{ fontSize: h.size, fontWeight: "bold" }}>
                    {h.label}
                  </span>
                  {currentHeadingLevel === h.value && (
                    <span className="ml-auto text-xs">Current</span>
                  )}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          variant={isBold ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => execCommand("bold")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={isItalic ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => execCommand("italic")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={isUnderline ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => execCommand("underline")}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Popover>
          <PopoverTrigger asChild>
            {/* <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0 text-foreground'
              onMouseDown={(e) => {
                // Capture current selection before any event
                const selection = window.getSelection();
                if (
                  selection &&
                  selection.rangeCount > 0 &&
                  !selection.isCollapsed
                ) {
                  const range = selection.getRangeAt(0);
                  // Only save if the selection is within our editor areas
                  const editorArea = range.commonAncestorContainer;
                  const isInEditor =
                    editorArea.nodeType === Node.TEXT_NODE
                      ? editorArea.parentElement?.closest(
                          '[contenteditable="true"]'
                        )
                      : (editorArea as Element)?.closest(
                          '[contenteditable="true"]'
                        );

                  if (isInEditor) {
                    setLastActiveSelection(range.cloneRange());

                    // Apply color immediately to current selection
                    // Focus the editable element first
                    const container =
                      selection.getRangeAt(0).commonAncestorContainer;
                    const editableElement =
                      container.nodeType === Node.TEXT_NODE
                        ? container.parentElement?.closest(
                            '[contenteditable="true"]'
                          )
                        : (container as Element)?.closest(
                            '[contenteditable="true"]'
                          );

                    if (editableElement) {
                      (editableElement as HTMLElement).focus();
                    }

                    // For text color, always use fallback method with !important to override CSS
                    try {
                      const range = selection.getRangeAt(0);
                      const selectedContent = range.extractContents();
                      const span = document.createElement('span');
                      span.style.setProperty(
                        'color',
                        colorPickerColor,
                        'important'
                      );
                      span.appendChild(selectedContent);
                      range.insertNode(span);

                      // Update selection to show the result
                      const newRange = document.createRange();
                      newRange.selectNodeContents(span);
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                    } catch (fallbackError) {
                      console.error(
                        'Fallback color application failed:',
                        fallbackError
                      );
                    }

                    // Prevent popover from opening by stopping event propagation
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }
              }}
            >
              <Type className='h-4 w-4' />
            </Button> */}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <ColorPicker
              value={colorPickerColor}
              onChange={(color) => {
                setColorPickerColor(color);
                // Apply the color to any current selection
                const selection = window.getSelection();
                if (
                  selection &&
                  selection.rangeCount > 0 &&
                  !selection.isCollapsed
                ) {
                  // Focus the editable element first
                  const container =
                    selection.getRangeAt(0).commonAncestorContainer;
                  const editableElement =
                    container.nodeType === Node.TEXT_NODE
                      ? container.parentElement?.closest(
                          '[contenteditable="true"]'
                        )
                      : (container as Element)?.closest(
                          '[contenteditable="true"]'
                        );

                  if (editableElement) {
                    (editableElement as HTMLElement).focus();
                  }

                  // For text color, always use fallback method with !important to override CSS
                  try {
                    const range = selection.getRangeAt(0);
                    const selectedContent = range.extractContents();
                    const span = document.createElement("span");
                    span.style.setProperty("color", color, "important");
                    span.appendChild(selectedContent);
                    range.insertNode(span);

                    // Update selection to show the result
                    const newRange = document.createRange();
                    newRange.selectNodeContents(span);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                  } catch (fallbackError) {
                    console.error(
                      "Fallback color application failed:",
                      fallbackError
                    );
                  }
                } else if (lastActiveSelection) {
                  // Apply to last active selection
                  applyColorToLastSelection(color, "foreColor");
                }
              }}
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-foreground"
              onMouseDown={(e) => {
                // Capture current selection before any event
                const selection = window.getSelection();
                if (
                  selection &&
                  selection.rangeCount > 0 &&
                  !selection.isCollapsed
                ) {
                  const range = selection.getRangeAt(0);
                  // Only save if the selection is within our editor areas
                  const editorArea = range.commonAncestorContainer;
                  const isInEditor =
                    editorArea.nodeType === Node.TEXT_NODE
                      ? editorArea.parentElement?.closest(
                          '[contenteditable="true"]'
                        )
                      : (editorArea as Element)?.closest(
                          '[contenteditable="true"]'
                        );

                  if (isInEditor) {
                    setLastActiveSelection(range.cloneRange());

                    // Apply color immediately to current selection
                    document.execCommand("backColor", false, colorPickerColor);

                    // Prevent popover from opening by stopping event propagation
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }
              }}
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <ColorPicker
              value={colorPickerColor}
              onChange={(color) => {
                setColorPickerColor(color);
                // Apply the color to any current selection
                const selection = window.getSelection();
                if (
                  selection &&
                  selection.rangeCount > 0 &&
                  !selection.isCollapsed
                ) {
                  document.execCommand("backColor", false, color);
                } else if (lastActiveSelection) {
                  // Apply to last active selection
                  applyColorToLastSelection(color, "backColor");
                }
              }}
            />
          </PopoverContent>
        </Popover>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => handleAlignment("left")}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => handleAlignment("center")}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => handleAlignment("right")}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => handleAlignment("justify")}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => createList("ul")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => createList("ol")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-foreground"
          onClick={() => insertElement("table")}
        >
          <Table className="h-4 w-4 mr-1" />
          Table
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-foreground"
          onClick={() => insertElement("chart")}
        >
          <BarChart3 className="h-4 w-4 mr-1" />
          Chart
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-foreground"
          onClick={() => insertElement("image")}
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          Image
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-foreground"
          onClick={() => insertElement("toc")}
        >
          <ListOrdered className="h-4 w-4 mr-1" />
          TOC
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-foreground"
          onClick={() => insertElement("layout")}
        >
          <Columns className="h-4 w-4 mr-1" />
          Layout
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-foreground"
          onClick={() => insertElement("code")}
        >
          <Code2 className="h-4 w-4 mr-1" />
          Code
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-foreground"
          onClick={insertLink}
        >
          <Link className="h-4 w-4 mr-1" />
          Link
        </Button>
      </div>
    </div>
  );
}
