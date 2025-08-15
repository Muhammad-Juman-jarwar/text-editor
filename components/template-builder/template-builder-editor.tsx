"use client";

import type React from "react";
import { useRef, useEffect, useCallback, useState, createRef } from "react";
import { Badge } from "@/components/ui/badge";
import { TocSettingsPanel } from "./toc-settings-panel";
import { ChartSettingsPanel } from "./chart-settings-panel";
import { TableSettingsPanel } from "./table-settings-panel";
import { ImageSettingsPanel } from "./image-element";
import { HeaderSettingsPanel } from "./header-settings-panel";
import { FooterSettingsPanel } from "./footer-settings-panel";
import {
  DesignElementComponent,
  DesignElementSettings,
} from "./design-element";
import { LayoutSettingsPanel } from "./layout-settings-panel";
import TemplateHeader from "./TemplateHeader";
import TemplateFooter from "./TemplateFooter";
import EditorPage from "../ui/EditorPage";
import { update } from "lodash";

interface DesignElement {
  id: string;
  type: "rectangle" | "circle" | "triangle" | "line" | "image";
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  style: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    borderRadius?: number;
    src?: string;
  };
}

interface TemplateBuilderEditorProps {
  template: any;
  selectedPage: any;
  zoom: number;
  theme: any;
  addPage: (content?: string) => void;
  onUpdatePage: (pageId: string, updates: any) => void;
  onUpdateTemplate: (template: any) => void;
  designElements?: DesignElement[];
  onUpdateDesignElements?: (elements: DesignElement[]) => void;
  selectedDesignElement?: DesignElement | null;
  onSelectDesignElement?: (element: DesignElement | null) => void;
  onAddDesignElement?: (
    elementType: string,
    position?: { x: number; y: number },
    targetPageId?: string,
    targetSubPageIdx?: number
  ) => void;
}

export function TemplateBuilderEditor({
  template,
  selectedPage,
  zoom,
  theme,
  addPage,
  onUpdatePage,
  onUpdateTemplate,
  designElements = [],
  onUpdateDesignElements = () => { },
  selectedDesignElement = null,
  onSelectDesignElement = () => { },
  onAddDesignElement = () => { },
}: TemplateBuilderEditorProps) {
  // --- MULTI-PAGE/SUBPAGE REFS ---
  // Main page + subPages refs
  const mainEditorContentRef = useRef<HTMLDivElement>(null);
  const mainPageContainerRef = useRef<HTMLDivElement>(null);
  // Fix: Add containerRef for the main container
  const containerRef = useRef<HTMLDivElement>(null);
  // For subPages, use array of refs
  const [subPageRefs, setSubPageRefs] = useState<
    React.RefObject<HTMLDivElement>[]
  >([]);
  const [subPageContainerRefs, setSubPageContainerRefs] = useState<
    React.RefObject<HTMLDivElement>[]
  >([]);
  // Track which page/subPage is focused
  const [focusedSubPageIdx, setFocusedSubPageIdx] = useState<number | null>(
    null
  ); // null = main page

  // Update refs if subPages change
  useEffect(() => {
    if (!selectedPage) return;
    const subPages = selectedPage.subPages || [];
    setSubPageRefs((refs) => {
      if (refs.length === subPages.length) return refs;
      // Add explicit types for _ and i
      return subPages.map(
        (_: any, i: number) => refs[i] || createRef<HTMLDivElement>()
      );
    });
    setSubPageContainerRefs((refs) => {
      if (refs.length === subPages.length) return refs;
      return subPages.map(
        (_: any, i: number) => refs[i] || createRef<HTMLDivElement>()
      );
    });
  }, [selectedPage?.subPages?.length]);

  const [autoZoom, setAutoZoom] = useState(75);

  type ActivePanelType =
    | "toc"
    | "chart"
    | "table"
    | "image"
    | "layout"
    | "design"
    | "header"
    | "footer"
    | null;
  const [activeSettingsPanel, setActiveSettingsPanel] =
    useState<ActivePanelType>(null);
  const [currentSelectedContentElement, setCurrentSelectedContentElement] =
    useState<HTMLElement | null>(null);

  // Helper to get ref for a given idx (null = main, else subPage idx)
  const getEditorContentRef = (idx: number | null) => {
    if (idx === null) {
      return mainEditorContentRef;
    }
    // Ensure the subPageRefs array has the requested index
    if (idx >= 0 && idx < subPageRefs.length && subPageRefs[idx]) {
      return subPageRefs[idx];
    }
    return null; // Return null if ref doesn't exist
  };
  const getPageContainerRef = (idx: number | null) => {
    if (idx === null) {
      return mainPageContainerRef;
    }
    // Ensure the subPageContainerRefs array has the requested index
    if (
      idx >= 0 &&
      idx < subPageContainerRefs.length &&
      subPageContainerRefs[idx]
    ) {
      return subPageContainerRefs[idx];
    }
    return null; // Return null if ref doesn't exist
  };

  // Overflow logic for main page and subPages
  const isContentOverflowing = useCallback(
    (idx: number | null = null) => {
      const ref = getEditorContentRef(idx);
      if (!ref || !ref.current) return false;

      // Check if content is overflowing by comparing scroll height with client height
      const scrollHeight = ref.current.scrollHeight;
      const clientHeight = ref.current.clientHeight;
      const isOverflowing = scrollHeight > clientHeight;

      // Add some tolerance for edge cases (1px difference can be from rounding)
      const threshold = 2;

      if (isOverflowing && scrollHeight - clientHeight > threshold) {
        console.log("Content overflow detected:", {
          scrollHeight,
          clientHeight,
          difference: scrollHeight - clientHeight,
          idx,
        });
        return true;
      }

      return false;
    },
    [subPageRefs, mainEditorContentRef]
  );

  // Helper function to recalculate page and subpage orders
  const recalculatePageOrders = useCallback((pages: any[]) => {
    let currentOrder = 1;

    return pages.map((page) => {
      const updatedPage = { ...page, order: currentOrder++ };

      // Recalculate subpage orders
      if (page.subPages && page.subPages.length > 0) {
        updatedPage.subPages = page.subPages.map((subPage: any) => ({
          ...subPage,
          order: currentOrder++,
        }));
      }

      return updatedPage;
    });
  }, []);

  // Function to move overflowing content to next page/subpage
  const redistributeOverflowingContent = useCallback(
    (idx: number | null = null, stayOnCurrentPage = false) => {
      if (!selectedPage) return false;

      const sourceRef = getEditorContentRef(idx);
      if (!sourceRef?.current || !isContentOverflowing(idx)) return false;

      console.log("Content overflowing, redistributing...", {
        idx,
        selectedPage: selectedPage.id,
        actualHeight: sourceRef.current.clientHeight,
      });

      const contentElements = Array.from(sourceRef.current.children);
      if (contentElements.length === 0) return false;

      let cutPoint = -1;
      let accumulatedHeight = 0;
      const containerHeight = sourceRef.current.clientHeight;
      const maxHeight = containerHeight - 20;

      for (let i = 0; i < contentElements.length; i++) {
        const element = contentElements[i] as HTMLElement;
        const elementHeight = element.offsetHeight || element.scrollHeight || 50;

        if (accumulatedHeight + elementHeight > maxHeight) {
          cutPoint = i;
          break;
        }

        accumulatedHeight += elementHeight;

        if (
          elementHeight > containerHeight * 0.5 &&
          i > 0 &&
          accumulatedHeight > containerHeight * 0.3
        ) {
          cutPoint = i;
          break;
        }
      }

      if (cutPoint === -1) {
        if (contentElements.length > 2) {
          cutPoint = Math.max(1, Math.floor(contentElements.length * 0.8));
        } else {
          const lastElement = contentElements[contentElements.length - 1] as HTMLElement;
          if (
            lastElement &&
            (lastElement.offsetHeight || 0) > containerHeight * 0.3 &&
            contentElements.length > 1
          ) {
            cutPoint = contentElements.length - 1;
          } else {
            console.log("Content has few elements and no large elements, not splitting");
            return false;
          }
        }
      }

      if (cutPoint === 0 && contentElements.length > 1) cutPoint = 1;
      if (cutPoint >= contentElements.length || cutPoint <= 0) {
        console.log("No valid cut point found, skipping redistribution");
        return false;
      }

      const elementsToMove = contentElements.slice(cutPoint);
      if (elementsToMove.length === 0) {
        console.log("No elements to move after slicing");
        return false;
      }

      console.log(`Moving ${elementsToMove.length} elements from position ${cutPoint}`, `Accumulated height: ${accumulatedHeight}px`);

      let targetSubPageIdx: number;
      let needsNewSubPage = false;

      if (idx === null) {
        if (!selectedPage.subPages || selectedPage.subPages.length === 0) {
          targetSubPageIdx = 0;
          needsNewSubPage = true;
        } else {
          targetSubPageIdx = 0;
        }
      } else {
        targetSubPageIdx = idx + 1;
        if (!selectedPage.subPages || idx >= selectedPage.subPages.length - 1) {
          needsNewSubPage = true;
        }
      }

      const contentToMove = elementsToMove.map((el) => el.outerHTML).join("");
      elementsToMove.forEach((el) => el.remove());

      if (idx === null) {
        onUpdatePage(selectedPage.id, { content: sourceRef.current.innerHTML });
      } else {
        const updatedSubPages = [...selectedPage.subPages];
        updatedSubPages[idx] = { ...updatedSubPages[idx], content: sourceRef.current.innerHTML };
        onUpdatePage(selectedPage.id, { subPages: updatedSubPages });
      }

      if (needsNewSubPage) {
        console.log("Creating new subpage with moved content");
        const newSubPage = {
          id: `subpage-${Date.now()}`,
          content: contentToMove,
          order: selectedPage?.order + (selectedPage?.subPages?.length || 0) + 1,
          showHeader: selectedPage.showHeader,
          showFooter: selectedPage.showFooter,
          showPageNumber: selectedPage.showPageNumber,
          designElements: [],
        };

        const updatedSubPages = [...(selectedPage.subPages || [])];
        updatedSubPages[targetSubPageIdx] = newSubPage;

        const updatedCurrentPage = { ...selectedPage, subPages: updatedSubPages };
        const updatedPages = template.pages.map((page: any) =>
          page.id === selectedPage.id ? updatedCurrentPage : page
        );

        const reorderedPages = recalculatePageOrders(updatedPages);
        onUpdateTemplate({ ...template, pages: reorderedPages });

        if (!stayOnCurrentPage) {
          setFocusedSubPageIdx(targetSubPageIdx);
        }
      } else {
        console.log("Adding content to existing subpage");
        setTimeout(() => {
          const targetRef = getEditorContentRef(targetSubPageIdx);
          if (targetRef?.current) {
            const existingContent = targetRef.current.innerHTML;
            targetRef.current.innerHTML = contentToMove + existingContent;

            const updatedSubPages = [...selectedPage.subPages];
            updatedSubPages[targetSubPageIdx] = {
              ...updatedSubPages[targetSubPageIdx],
              content: targetRef.current.innerHTML,
            };
            onUpdatePage(selectedPage.id, { subPages: updatedSubPages });

            if (!stayOnCurrentPage) {
              setFocusedSubPageIdx(targetSubPageIdx);
            }
          }
        }, 100);
      }

      return true;
    },
    [
      selectedPage,
      isContentOverflowing,
      getEditorContentRef,
      onUpdatePage,
      setFocusedSubPageIdx,
      template,
      onUpdateTemplate,
      recalculatePageOrders,
    ]
  );


  // Manual overflow check function that can be triggered externally (for toolbar elements)
  const checkAndHandleOverflow = useCallback(
    (stayOnCurrentPage = false) => {
      console.log("Manual overflow check triggered (toolbar element insertion)");

      setTimeout(() => {
        // Main page
        if (isContentOverflowing(null)) {
          console.log("Main page overflowing, redistributing...");
          redistributeOverflowingContent(null, stayOnCurrentPage);
          return;
        }

        // Subpages
        if (selectedPage?.subPages) {
          for (let i = 0; i < selectedPage.subPages.length; i++) {
            if (isContentOverflowing(i)) {
              console.log(`Subpage ${i} overflowing, redistributing...`);
              redistributeOverflowingContent(i, stayOnCurrentPage);
              break;
            }
          }
        }
      }, 200);
    },
    [selectedPage, isContentOverflowing, redistributeOverflowingContent]
  );


  // Enhanced overflow check function for immediate use
  const forceOverflowCheck = useCallback(() => {
    console.log("Force overflow check triggered");

    // Force reflow to ensure height calculations are accurate
    if (mainEditorContentRef.current) {
      mainEditorContentRef.current.offsetHeight;
    }
    subPageRefs.forEach((ref) => {
      if (ref.current) {
        ref.current.offsetHeight;
      }
    });

    // Check immediately without delay
    if (isContentOverflowing(null)) {
      redistributeOverflowingContent(null);
      return;
    }

    if (selectedPage?.subPages) {
      for (let i = 0; i < selectedPage.subPages.length; i++) {
        if (isContentOverflowing(i)) {
          redistributeOverflowingContent(i);
          break;
        }
      }
    }
  }, [
    selectedPage,
    isContentOverflowing,
    redistributeOverflowingContent,
    subPageRefs,
  ]);

  // Expose both overflow check functions globally for toolbar actions
  useEffect(() => {
    (window as any).checkEditorOverflow = checkAndHandleOverflow;
    (window as any).forceEditorOverflowCheck = forceOverflowCheck;
    return () => {
      delete (window as any).checkEditorOverflow;
      delete (window as any).forceEditorOverflowCheck;
    };
  }, [checkAndHandleOverflow, forceOverflowCheck]);

  // --- Focus new subPage editor when added ---
  useEffect(() => {
    if (focusedSubPageIdx !== null && subPageRefs[focusedSubPageIdx]?.current) {
      subPageRefs[focusedSubPageIdx].current?.focus();
    } else if (focusedSubPageIdx === null && mainEditorContentRef.current) {
      mainEditorContentRef.current.focus();
    }
  }, [focusedSubPageIdx, subPageRefs, mainEditorContentRef]);

  // --- Handle content input for main and subPages ---
  const handleContentInput =
    (idx: number | null = null) =>
      (e: React.FormEvent<HTMLDivElement>) => {
        if (!selectedPage) return;
        const ref = getEditorContentRef(idx);
        if (!ref || !ref.current) return;

        // Save content to correct place first
        if (idx === null) {
          onUpdatePage(selectedPage.id, { content: ref.current.innerHTML });
        } else {
          // Update subPage content
          const updatedSubPages = [...selectedPage.subPages];
          updatedSubPages[idx] = {
            ...updatedSubPages[idx],
            content: ref.current.innerHTML,
          };
          onUpdatePage(selectedPage.id, { subPages: updatedSubPages });
        }

        // For normal text overflow, create a clean new subpage without moving content
        // Use requestAnimationFrame for immediate but safe execution after DOM update
        requestAnimationFrame(() => {
          if (isContentOverflowing(idx)) {
            console.log("Content overflowing detected immediately", { idx });
            // Check if this is likely from user typing (cursor is at the end)
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const isAtEnd = range.collapsed && range.endOffset > 0;
              if (isAtEnd) {
                handleNormalTextOverflow(idx);
              }
            } else {
              // If no selection, still handle overflow (for programmatic content additions)
              handleNormalTextOverflow(idx);
            }
          }
        });
      };

  // Handle normal text overflow - creates new clean subpage without moving content
  const handleNormalTextOverflow = useCallback(
    (idx: number | null = null) => {
      if (!selectedPage) return false;

      console.log("Creating new subpage for text overflow (no content moved)", {
        idx,
      });

      // Determine target subpage index
      let targetSubPageIdx: number;

      if (idx === null) {
        // Main page overflow - add subpage after main page
        targetSubPageIdx = selectedPage.subPages
          ? selectedPage.subPages.length
          : 0;
      } else {
        // Subpage overflow - add new subpage after current one
        targetSubPageIdx = idx + 1;
      }

      // Create new empty subpage for continued typing
      const newSubPage = {
        id: `subpage-${Date.now()}`,
        content: "", // Start completely empty - user continues typing here
        order: selectedPage?.order + (selectedPage?.subPages?.length || 0) + 1,
        showHeader: selectedPage.showHeader,
        showFooter: selectedPage.showFooter,
        showPageNumber: selectedPage.showPageNumber,
        designElements: [],
      };

      const updatedSubPages = [...(selectedPage.subPages || [])];
      // Insert at the correct position
      updatedSubPages.splice(targetSubPageIdx, 0, newSubPage);

      // Update the current page with the modified subpages
      const updatedCurrentPage = { ...selectedPage, subPages: updatedSubPages };

      // Update all pages with the current page changes
      const updatedPages = template.pages.map((page: any) =>
        page.id === selectedPage.id ? updatedCurrentPage : page
      );

      // Recalculate orders for all pages and their subpages
      const reorderedPages = recalculatePageOrders(updatedPages);

      // Update the entire template with recalculated orders
      onUpdateTemplate({ ...template, pages: reorderedPages });

      // Focus the new subpage so user can continue typing
      setTimeout(() => {
        setFocusedSubPageIdx(targetSubPageIdx);
      }, 100);

      return true;
    },
    [
      selectedPage,
      onUpdatePage,
      setFocusedSubPageIdx,
      template,
      onUpdateTemplate,
      recalculatePageOrders,
    ]
  );

  // Function to delete a subpage and move focus to previous page/subpage
  const deleteSubPage = useCallback(
    (subPageIdx: number) => {
      if (!selectedPage || !selectedPage.subPages || subPageIdx < 0)
        return false;

      console.log("Deleting subpage at index:", subPageIdx);

      // Remove the subpage
      const updatedSubPages = [...selectedPage.subPages];
      updatedSubPages.splice(subPageIdx, 1);

      // Update the current page with the modified subpages
      const updatedCurrentPage = { ...selectedPage, subPages: updatedSubPages };

      // Update all pages with the current page changes
      const updatedPages = template.pages.map((page: any) =>
        page.id === selectedPage.id ? updatedCurrentPage : page
      );

      // Recalculate orders for all pages and their subpages
      const reorderedPages = recalculatePageOrders(updatedPages);

      // Update the entire template with recalculated orders
      onUpdateTemplate({ ...template, pages: reorderedPages });

      // Focus the previous page/subpage
      if (subPageIdx === 0) {
        // If deleting the first subpage, focus main page
        setFocusedSubPageIdx(null);
        setTimeout(() => {
          if (mainEditorContentRef.current) {
            mainEditorContentRef.current.focus();
            // Position cursor at the end of main page content
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(mainEditorContentRef.current);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }, 100);
      } else {
        // Focus the previous subpage
        const targetIdx = subPageIdx - 1;
        setFocusedSubPageIdx(targetIdx);
        setTimeout(() => {
          const targetRef = subPageRefs[targetIdx];
          if (targetRef?.current) {
            targetRef.current.focus();
            // Position cursor at the end of previous subpage content
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(targetRef.current);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }, 100);
      }

      return true;
    },
    [
      selectedPage,
      template,
      onUpdateTemplate,
      recalculatePageOrders,
      setFocusedSubPageIdx,
      mainEditorContentRef,
      subPageRefs,
    ]
  );

  // Handle key events for subpages (specifically backspace deletion)
  const handleKeyDown = useCallback(
    (idx: number | null = null) =>
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        // Only handle backspace for subpages (not main page)
        if (e.key === "Backspace" && idx !== null && idx >= 0) {
          console.log("Backspace detected on subpage:", idx);

          const ref = getEditorContentRef(idx);
          if (!ref?.current) {
            console.log("No ref found for subpage:", idx);
            return;
          }

          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) {
            console.log("No selection found");
            return;
          }

          const range = selection.getRangeAt(0);
          console.log("Range details:", {
            startOffset: range.startOffset,
            collapsed: range.collapsed,
            startContainer: range.startContainer,
            nodeType: range.startContainer.nodeType,
          });

          // Check if the subpage is empty or only contains minimal content
          const content = ref.current.textContent || "";
          const htmlContent = ref.current.innerHTML || "";
          const isEmpty = content.trim().length === 0;

          console.log("Content check:", {
            textContent: content,
            htmlContent: htmlContent,
            isEmpty: isEmpty,
            trimmedLength: content.trim().length,
          });

          // Check if cursor is at the very beginning of the subpage
          const isAtBeginning = range.startOffset === 0 && range.collapsed;

          // More lenient check for cursor position at start
          const isAtStart = () => {
            // If cursor is at beginning of the first element
            if (isAtBeginning) {
              const startContainer = range.startContainer;

              // If we're in the contenteditable div itself or the first child
              if (startContainer === ref.current) {
                return true;
              }

              // If we're in the first text node at position 0
              if (
                startContainer.nodeType === Node.TEXT_NODE &&
                range.startOffset === 0
              ) {
                // Check if this is the first text node in the subpage
                const walker = document.createTreeWalker(
                  ref.current!,
                  NodeFilter.SHOW_TEXT,
                  null
                );
                const firstTextNode = walker.nextNode();
                return startContainer === firstTextNode;
              }

              // If we're in an element at position 0 and it's the first element
              if (
                startContainer.nodeType === Node.ELEMENT_NODE &&
                range.startOffset === 0
              ) {
                const firstChild = ref.current!.firstChild;
                return (
                  startContainer === firstChild ||
                  ref.current!.contains(startContainer)
                );
              }
            }

            return false;
          };

          // Only delete if BOTH conditions are true: empty content AND cursor at start
          const shouldDelete =
            isEmpty && // Content must be completely empty (not just nearly empty)
            isAtStart() && // AND cursor must be at the very start
            selectedPage.subPages &&
            selectedPage.subPages.length >= 1;

          console.log("Deletion check:", {
            isEmpty,
            isAtStart: isAtStart(),
            contentLength: content.length,
            trimmedLength: content.trim().length,
            hasSubPages:
              selectedPage.subPages && selectedPage.subPages.length >= 1,
            subPagesLength: selectedPage.subPages
              ? selectedPage.subPages.length
              : 0,
            shouldDelete,
          });

          if (shouldDelete) {
            console.log("Deleting subpage:", idx);
            e.preventDefault();
            deleteSubPage(idx);
          }
        }
      },
    [getEditorContentRef, selectedPage, deleteSubPage]
  );

  // --- Handle blur for main and subPages ---
  const handleContentBlur =
    (idx: number | null = null) =>
      (e: React.FocusEvent<HTMLDivElement>) => {
        if (!selectedPage) return;
        const ref = getEditorContentRef(idx);
        if (!ref || !ref.current) return;
        if (idx === null) {
          onUpdatePage(selectedPage.id, { content: ref.current.innerHTML });
        } else {
          const updatedSubPages = [...selectedPage.subPages];
          updatedSubPages[idx] = {
            ...updatedSubPages[idx],
            content: ref.current.innerHTML,
          };
          onUpdatePage(selectedPage.id, { subPages: updatedSubPages });
        }
      };

  // We use the global selectedDesignElement state passed from parent

  const pageWidth = 794;
  const pageHeight = 1123;

  const defaultTheme = {
    colors: {
      text: "#000000",
      pageBackground: "#ffffff",
      primary: "#dc2626",
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
    margins: {
      top: 20,
      right: 48,
      bottom: 20,
      left: 48,
    },
  };

  const effectiveTheme = {
    colors: { ...defaultTheme.colors, ...template?.theme?.colors },
    typography: { ...defaultTheme.typography, ...template?.theme?.typography },
    margins: { ...defaultTheme.margins, ...template?.theme?.margins },
  };

  // Effect to calculate auto zoom based on container width
  useEffect(() => {
    const calculateAutoZoom = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 64;
        const calculatedZoom = Math.min(
          (containerWidth / pageWidth) * 100,
          100
        );
        setAutoZoom(Math.max(calculatedZoom, 25));
      }
    };
    calculateAutoZoom();
    window.addEventListener("resize", calculateAutoZoom);
    return () => window.removeEventListener("resize", calculateAutoZoom);
  }, []);

  // Effect to reset scroll position and focus editor content on page change
  useEffect(() => {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera

    if (mainEditorContentRef.current) {
      mainEditorContentRef.current?.focus();
    }
  }, [selectedPage?.id]);

  // Effect to set initial content when selectedPage.id changes (due to the key prop)
  useEffect(() => {
    if (mainEditorContentRef.current && selectedPage) {
      const initialContent =
        selectedPage.content ||
        `<p style="color: ${effectiveTheme.colors.text}; font-family: ${effectiveTheme.typography.fontFamily ||
        effectiveTheme.typography.bodyFont
        }; font-size: ${effectiveTheme.typography.baseFontSize ||
        effectiveTheme.typography.bodyFontSize
        }px; line-height: ${effectiveTheme.typography.lineHeight ||
        effectiveTheme.typography.lineSpacing
        };">Click here to start editing...</p>`;
      mainEditorContentRef.current.innerHTML = initialContent;

      // Clean up any existing headings with inline color styles
      const headings = mainEditorContentRef.current.querySelectorAll(
        "h1, h2, h3, h4, h5, h6"
      );
      headings.forEach((heading) => {
        const element = heading as HTMLElement;
        if (element.style.color) {
          element.style.removeProperty("color");
        }
      });
    }
  }, [
    selectedPage?.id,
    effectiveTheme.colors.text,
    effectiveTheme.typography.fontFamily,
    effectiveTheme.typography.baseFontSize,
    effectiveTheme.typography.lineHeight,
    effectiveTheme.colors.primary, // Add primary color to dependencies
  ]); // Rerun if page ID or theme changes

  // Effect to handle text input and ensure proper color
  useEffect(() => {
    const editor = mainEditorContentRef.current;
    if (!editor) return;

    const handleBeforeInput = (e: InputEvent) => {
      // Only handle specific input types that need theme styling
      if (e.inputType === "insertCompositionText") {
        e.preventDefault();
        const text = e.data || "";
        if (text) {
          document.execCommand(
            "insertHTML",
            false,
            `<span style="color: ${effectiveTheme.colors.text}; font-family: ${effectiveTheme.typography.fontFamily ||
            effectiveTheme.typography.bodyFont
            }; font-size: ${effectiveTheme.typography.baseFontSize ||
            effectiveTheme.typography.bodyFontSize
            }px; line-height: ${effectiveTheme.typography.lineHeight ||
            effectiveTheme.typography.lineSpacing
            };">${text}</span>`
          );
        }
      }
      // Let regular text input (including spaces) work normally
      // The CSS will apply the theme styles automatically
    };

    editor.addEventListener("beforeinput", handleBeforeInput);
    return () => {
      editor.removeEventListener("beforeinput", handleBeforeInput);
    };
  }, [
    effectiveTheme.colors.text,
    effectiveTheme.typography.fontFamily,
    effectiveTheme.typography.baseFontSize,
    effectiveTheme.typography.lineHeight,
  ]);

  // Effect to clean up heading colors when primary color changes
  useEffect(() => {
    if (mainEditorContentRef.current) {
      const headings = mainEditorContentRef.current.querySelectorAll(
        "h1, h2, h3, h4, h5, h6"
      );
      headings.forEach((heading) => {
        const element = heading as HTMLElement;
        if (element.style.color) {
          element.style.removeProperty("color");
        }
      });
    }
  }, [effectiveTheme.colors.primary]); // Run when primary color changes

  // Effect to monitor content changes and handle overflow from toolbar insertions
  useEffect(() => {
    const observers: MutationObserver[] = [];
    let debounceTimer: NodeJS.Timeout | null = null;

    const checkForOverflow = (idx: number | null, reason: string) => {
      console.log(`Checking for overflow: ${reason}`, { idx });

      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(
        () => {
          const ref = getEditorContentRef(idx);
          if (ref?.current) {
            // Force a reflow to ensure height calculations are accurate
            ref.current.offsetHeight;

            const currentHeight = ref.current.scrollHeight;
            const containerHeight = ref.current.clientHeight;
            console.log(
              `Current scroll height: ${currentHeight}px, container height: ${containerHeight}px`
            );

            // Only redistribute if content is overflowing the container
            if (currentHeight > containerHeight) {
              console.log("Content is overflowing, redistributing...", {
                idx,
                reason,
                scrollHeight: currentHeight,
                containerHeight: containerHeight,
              });
              redistributeOverflowingContent(idx);
            } else {
              console.log(
                "Height within acceptable range, no redistribution needed"
              );
            }
          }
        },
        reason.includes("text") ? 50 : 100
      ); // Faster response for text changes, slower for toolbar elements
    };

    const setupObserver = (
      ref: React.RefObject<HTMLDivElement | null>,
      idx: number | null
    ) => {
      if (!ref.current) return;

      // MutationObserver for DOM changes
      const mutationObserver = new MutationObserver((mutations) => {
        let hasToolbarElement = false;
        let hasSignificantChange = false;
        let hasTextChange = false;

        mutations.forEach((mutation) => {
          // Check for text content changes (typing)
          if (mutation.type === "characterData") {
            hasTextChange = true;
            console.log("Text content change detected");
            return;
          }

          // Check for added nodes (direct toolbar element insertions)
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            for (const node of Array.from(mutation.addedNodes)) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;

                // Check if this element or any descendant is a toolbar element
                const isToolbarElement =
                  element.dataset?.elementType ||
                  element.querySelector?.("[data-element-type]") ||
                  element.classList?.contains("element-container") ||
                  (element.tagName === "TABLE" &&
                    element.querySelector?.("thead")) || // Only tables with headers (not text tables)
                  element.querySelector?.("canvas") || // Charts often use canvas
                  element.classList?.contains("toc-container") ||
                  // Check for images that might be toolbar-inserted
                  (element.tagName === "IMG" &&
                    element.getAttribute("src") !== null) ||
                  // Check for divs with specific toolbar-related classes or attributes
                  element.querySelector?.("img[src]") ||
                  element.querySelector?.("table") ||
                  // Check for elements with data attributes (valid selectors)
                  element.querySelector?.("[data-chart-settings]") ||
                  element.querySelector?.("[data-table-settings]") ||
                  element.querySelector?.("[data-settings]") ||
                  // Check if element itself has data attributes suggesting toolbar insertion
                  (element.hasAttribute &&
                    (element.hasAttribute("data-element-type") ||
                      element.hasAttribute("data-chart-settings") ||
                      element.hasAttribute("data-table-settings") ||
                      element.hasAttribute("data-settings")));

                if (isToolbarElement) {
                  hasToolbarElement = true;
                  console.log(
                    "Toolbar element detected (direct):",
                    element.tagName,
                    element.dataset?.elementType,
                    element.className
                  );
                  break;
                }
              }
            }
          }

          // Also check for modifications to existing nodes that might indicate toolbar insertions
          if (mutation.type === "childList" && mutation.target) {
            const target = mutation.target as HTMLElement;
            // If a paragraph or other container was modified and now contains toolbar elements
            if (
              target.querySelector?.("[data-element-type]") ||
              target.querySelector?.("table") ||
              target.querySelector?.("canvas") ||
              target.querySelector?.("img[src]")
            ) {
              hasToolbarElement = true;
              console.log(
                "Toolbar element detected (within existing content):",
                target.tagName
              );
            }
          }

          // Check for attribute changes that might indicate toolbar element modifications
          if (mutation.type === "attributes" && mutation.target) {
            const target = mutation.target as HTMLElement;
            if (
              target.dataset?.elementType ||
              target.classList?.contains("element-container")
            ) {
              hasSignificantChange = true;
              console.log(
                "Toolbar element attribute change detected:",
                target.tagName
              );
            }
          }
        });

        // Also check for any significant height changes that might indicate content was added
        // even if we didn't catch it through the mutation detection
        if (!hasToolbarElement && !hasSignificantChange) {
          // Check if content height increased significantly (suggesting new content was added)
          setTimeout(() => {
            if (ref.current) {
              const currentHeight = ref.current.clientHeight;
              const previousHeight = (ref.current as any)._lastKnownHeight || 0;
              (ref.current as any)._lastKnownHeight = currentHeight;

              // If height increased by more than 100px, it might be a toolbar element
              if (currentHeight - previousHeight > 100) {
                console.log(
                  "Significant height increase detected:",
                  currentHeight - previousHeight
                );
                hasSignificantChange = true;
                checkForOverflow(idx, "significant height increase");
              }
            }
          }, 50);
        }

        // Handle text changes immediately with faster response
        if (hasTextChange) {
          checkForOverflow(idx, "text change detected");
          return;
        }

        // Trigger overflow check for confirmed toolbar elements or significant changes
        if (hasToolbarElement || hasSignificantChange) {
          checkForOverflow(
            idx,
            hasToolbarElement
              ? "toolbar element added"
              : "significant change detected"
          );
        }
      });

      mutationObserver.observe(ref.current, {
        childList: true, // Watch for added/removed elements
        subtree: true, // Watch the entire subtree
        attributes: true, // Watch for attribute changes
        attributeFilter: ["data-element-type", "class", "data-settings"], // Only specific attributes
        characterData: true, // Watch text content changes for immediate overflow detection
      });

      // ResizeObserver disabled for normal text input - only MutationObserver for toolbar elements
      // const resizeObserver = new ResizeObserver((entries) => {
      //   for (const entry of entries) {
      //     if (entry.target === ref.current) {
      //       const currentHeight = entry.contentRect.height;
      //       if (currentHeight > 900) {
      //         console.log('Significant resize detected:', currentHeight + 'px');
      //         checkForOverflow(idx, 'element resized');
      //       }
      //       break;
      //     }
      //   }
      // });

      // resizeObserver.observe(ref.current);

      observers.push(mutationObserver);
      // resizeObservers.push(resizeObserver);
    };

    // Setup observer for main page
    setupObserver(mainEditorContentRef, null);

    // Setup observers for all subpages
    subPageRefs.forEach((ref, idx) => {
      setupObserver(ref, idx);
    });

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      observers.forEach((observer) => observer.disconnect());
      // resizeObservers.forEach((observer) => observer.disconnect());
    };
  }, [
    subPageRefs,
    selectedPage?.subPages?.length,
    redistributeOverflowingContent,
    isContentOverflowing,
    getEditorContentRef,
  ]);

  const effectiveZoom = zoom === 100 ? autoZoom : zoom;
  const scaledWidth = pageWidth;
  const scaledHeight = pageHeight;
  const headerHeight = selectedPage?.showHeader
    ? template.header?.height || 40
    : 0;
  const footerHeight = selectedPage?.showFooter
    ? template.footer?.height || 40
    : 0;

  const handleDesignElementDropOnPage = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const elementType = e.dataTransfer.getData("application/design-element");
      if (elementType && mainPageContainerRef.current && onAddDesignElement) {
        const pageRect = mainPageContainerRef.current.getBoundingClientRect();
        const x = (e.clientX - pageRect.left) / (effectiveZoom / 100);
        const y = (e.clientY - pageRect.top) / (effectiveZoom / 100);

        const elementBaseSize = { width: 100, height: 60 };
        const adjustedX = Math.max(
          0,
          Math.min(
            x - elementBaseSize.width / 2,
            pageWidth - elementBaseSize.width
          )
        );
        const adjustedY = Math.max(
          0,
          Math.min(
            y - elementBaseSize.height / 2,
            pageHeight - elementBaseSize.height
          )
        );

        // Use the parent's addDesignElement function to ensure page-specific handling
        onAddDesignElement(elementType, { x: adjustedX, y: adjustedY });
      }
    },
    [onAddDesignElement, effectiveZoom, pageWidth, pageHeight]
  );

  const handleDesignElementDropOnSubPage = useCallback(
    (subPageIdx: number) => (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const elementType = e.dataTransfer.getData("application/design-element");
      if (
        elementType &&
        subPageContainerRefs[subPageIdx]?.current &&
        onAddDesignElement
      ) {
        const pageRect =
          subPageContainerRefs[subPageIdx].current!.getBoundingClientRect();
        const x = (e.clientX - pageRect.left) / (effectiveZoom / 100);
        const y = (e.clientY - pageRect.top) / (effectiveZoom / 100);

        const elementBaseSize = { width: 100, height: 60 };
        const adjustedX = Math.max(
          0,
          Math.min(
            x - elementBaseSize.width / 2,
            pageWidth - elementBaseSize.width
          )
        );
        const adjustedY = Math.max(
          0,
          Math.min(
            y - elementBaseSize.height / 2,
            pageHeight - elementBaseSize.height
          )
        );

        // Use the parent's addDesignElement function with subPage targeting
        onAddDesignElement(
          elementType,
          { x: adjustedX, y: adjustedY },
          selectedPage.id,
          subPageIdx
        );
      }
    },
    [
      onAddDesignElement,
      effectiveZoom,
      pageWidth,
      pageHeight,
      selectedPage.id,
      subPageContainerRefs,
    ]
  );

  const handlePageDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  useEffect(() => {
    const editorArea = mainEditorContentRef.current;
    if (!editorArea) return;

    const handleTableCellEdit = (e: Event) => {
      const customEvent = e as CustomEvent;
      const tableElement = customEvent.detail?.tableElement as HTMLElement;

      if (tableElement && tableElement.dataset.elementType === "table") {
        // Ensure table stays selected when editing cells
        document.querySelectorAll(".selected").forEach((el) => {
          if (el !== tableElement) {
            el.classList.remove("selected");
          }
        });

        // Make sure the table is selected
        tableElement.classList.add("selected");

        // Update state to show the table settings panel
        setCurrentSelectedContentElement(tableElement);
        setActiveSettingsPanel("table");
      }
    };

    // Add listener for custom table cell edit event
    document.addEventListener("tablecelledit", handleTableCellEdit);

    return () => {
      document.removeEventListener("tablecelledit", handleTableCellEdit);
    };
  }, []);

  // Create a stable click handler using useCallback
  const handleElementClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Function to reset all selections - defined at the top so it can be used anywhere
      const resetAllSelections = () => {
        document.querySelectorAll(".selected").forEach((el) => {
          // Before removing selected class, ensure tables maintain their styles
          // Cast el to HTMLElement to access dataset property
          if ((el as HTMLElement).dataset.elementType === "table") {
            // Preserve table styles when deselected
            const settingsStr = el.getAttribute("data-table-settings");
            if (settingsStr) {
              try {
                const settings = JSON.parse(settingsStr);
                const table = el.querySelector("table");
                if (table) {
                  // Make sure borders remain visible when deselected if showBorders is true
                  const borderStyle = settings.showBorders
                    ? `${settings.borderWidth}px solid ${settings.borderColor}`
                    : "none";

                  // Always use collapse for consistent cell spacing regardless of borders
                  table.style.borderCollapse = "collapse";
                  table.style.borderSpacing = "0";
                  table.style.border = borderStyle;

                  // Ensure all cells maintain their borders when deselected
                  table.querySelectorAll("td, th").forEach((cell) => {
                    (cell as HTMLElement).style.border = borderStyle;
                  });
                }
              } catch (error) {
                console.error(
                  "Error preserving table styles during deselection:",
                  error
                );
              }
            }
          }
          el.classList.remove("selected");
        });
        setActiveSettingsPanel(null);
        setCurrentSelectedContentElement(null);
        onSelectDesignElement(null);
      };

      // Find if the click is within a table structure
      const tableElement = target.closest("[data-element-type='table']");
      const isEditableCell =
        target.closest(".editable-cell") ||
        target.closest(".main-document-table") ||
        target.closest(".editing-enabled");

      // If clicking on an editable table cell and we already have a table selected
      if (
        isEditableCell &&
        currentSelectedContentElement?.dataset.elementType === "table"
      ) {
        // Let the table cell handle its own events, but keep the table selected
        return;
      }

      // If clicking on a table cell or table itself
      if (tableElement) {
        // Ensure we're using the parent table element, not just a cell
        const tableParent =
          tableElement.closest("[data-element-type='table']") || tableElement;

        // If this is a different table than what's currently selected, or no table is selected
        if (tableParent !== currentSelectedContentElement) {
          resetAllSelections();
          tableParent.classList.add("selected");
          setCurrentSelectedContentElement(tableParent as HTMLElement);
          setActiveSettingsPanel("table");

          // Important: When reselecting a table, ensure its structure is preserved
          // Check if it has saved settings and reapply them if needed
          const tableSettings = tableParent.getAttribute("data-table-settings");
          if (tableSettings) {
            try {
              // No need to regenerate HTML here, the TableSettingsPanel will handle this
              // Just ensure the settings are correctly parsed by the panel
            } catch (e) {
              console.error("Error restoring table settings on reselect:", e);
            }
          }
        }
        return;
      }

      // For non-table clicks, just skip handling if it's on an editable cell
      if (isEditableCell) {
        return; // Let the cell handle its own events
      }

      if (target.closest("[data-design-element-id]")) return;

      const contentElement = target.closest(
        "[data-element-type]"
      ) as HTMLElement;
      if (contentElement) {
        const elementType = contentElement.dataset
          .elementType as ActivePanelType;
        if (
          currentSelectedContentElement === contentElement &&
          activeSettingsPanel === elementType
        )
          return;
        resetAllSelections();
        contentElement.classList.add("selected");
        setCurrentSelectedContentElement(contentElement);
        setActiveSettingsPanel(elementType);
      } else {
        if (
          !target.closest(
            ".settings-panel-container, .template-builder-toolbar"
          )
        ) {
          resetAllSelections();
        }
      }
    },
    [activeSettingsPanel, currentSelectedContentElement, onSelectDesignElement]
  );

  useEffect(() => {
    // Store active event listeners to ensure proper cleanup
    const activeListeners = new Set<HTMLElement>();

    const attachEventListeners = () => {
      // Collect all editor areas: main page + subpages
      const editorAreas: HTMLDivElement[] = [];

      // Add main editor area
      if (mainEditorContentRef.current) {
        editorAreas.push(mainEditorContentRef.current);
      }

      // Add subpage editor areas - only add if ref.current exists
      subPageRefs.forEach((ref) => {
        if (ref.current) {
          editorAreas.push(ref.current);
        }
      });

      // Remove old listeners first
      activeListeners.forEach((element) => {
        element.removeEventListener("click", handleElementClick);
      });
      activeListeners.clear();

      // Add event listeners to all editor areas
      editorAreas.forEach((editorArea) => {
        editorArea.addEventListener("click", handleElementClick);
        activeListeners.add(editorArea);
      });
    };

    // Initial attachment
    attachEventListeners();

    // Use a timeout as fallback to ensure DOM elements are ready after refs are updated
    const timeoutId = setTimeout(attachEventListeners, 100);

    // Setup MutationObserver to detect when new editor content divs are added
    const observer = new MutationObserver((mutations) => {
      let needsReattachment = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Check if new editor content areas were added
            if (
              element.matches('[contenteditable="true"]') ||
              element.querySelector('[contenteditable="true"]')
            ) {
              needsReattachment = true;
            }
          }
        });
      });

      if (needsReattachment) {
        // Small delay to ensure the new elements are fully rendered
        setTimeout(attachEventListeners, 50);
      }
    });

    // Observe the container for changes
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      // Cleanup all active listeners
      activeListeners.forEach((element) => {
        element.removeEventListener("click", handleElementClick);
      });
      activeListeners.clear();
    };
  }, [handleElementClick, subPageRefs, selectedPage?.subPages?.length]);

  const handleDesignElementSelect = (element: DesignElement) => {
    document
      .querySelectorAll(".selected")
      .forEach((el) => el.classList.remove("selected"));
    setCurrentSelectedContentElement(null);
    onSelectDesignElement(element);
    setActiveSettingsPanel("design");
  };

  const selectElementById = (elementId: string) => {
    const element = designElements.find((e) => e.id === elementId);
    if (element) {
      onSelectDesignElement(element);
    }
  };

  const handleDesignElementUpdate = (
    elementId: string,
    updates: Partial<DesignElement>
  ) => {
    const updatedElements = designElements.map((el) =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    onUpdateDesignElements(updatedElements);
    if (selectedDesignElement?.id === elementId) {
      // Find the updated element in the updated elements array
      const updatedElement = updatedElements.find((el) => el.id === elementId);
      if (updatedElement) {
        onSelectDesignElement(updatedElement);
      }
    }
  };

  const handleDesignElementDelete = (elementId: string) => {
    onUpdateDesignElements(designElements.filter((el) => el.id !== elementId));
    if (selectedDesignElement?.id === elementId) {
      onSelectDesignElement(null);
      setActiveSettingsPanel(null);
    }
  };

  const handleDesignElementDuplicate = (element: DesignElement) => {
    const duplicatedElement: DesignElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      position: { x: element.position.x + 20, y: element.position.y + 20 },
      zIndex: designElements.length,
    };
    onUpdateDesignElements([...designElements, duplicatedElement]);
    onSelectDesignElement(duplicatedElement);
    setActiveSettingsPanel("design");
  };

 const handleContentElementUpdate = useCallback(
  (updates: any) => {
    if (!currentSelectedContentElement) return;

    const elementType = currentSelectedContentElement.dataset.elementType;

    // DELETE ELEMENT
    if (updates.deleted) {
      const isInLayoutColumn =
        currentSelectedContentElement.closest(".layout-column-content") !== null ||
        currentSelectedContentElement.closest(".layout-column") !== null;

      if (isInLayoutColumn) {
        currentSelectedContentElement.remove();
      } else {
        const container = currentSelectedContentElement.closest(".element-container");
        if (container) {
          container.remove();
        } else {
          currentSelectedContentElement.remove();
        }
      }

      setActiveSettingsPanel(null);
      setCurrentSelectedContentElement(null);
    }

    // TABLE UPDATES
    else if (elementType === "table" && updates) {
      // Store table-specific settings on the same element
      currentSelectedContentElement.setAttribute(
        "data-table-settings",
        JSON.stringify(updates)
      );

      const table = currentSelectedContentElement.querySelector("table");
      if (table) {
        // Apply table-wide styles
        const tableWidth = updates.fullWidth ? "100%" : "auto";
        const borderStyle = updates.showBorders
          ? `${updates.borderWidth}px solid ${updates.borderColor}`
          : "none";

        currentSelectedContentElement.style.width = tableWidth;
        table.style.borderCollapse = "collapse";
        table.style.borderSpacing = "0";
        table.style.border = borderStyle;
        table.style.borderRadius = `${updates.borderRadius}px`;

        // Apply cell-specific styles
        table.querySelectorAll("td, th").forEach((cell) => {
          const isHeader = cell.tagName.toLowerCase() === "th";
          Object.assign(cell.style, {
            border: borderStyle,
            fontFamily: updates.fontFamily,
            fontSize: `${updates.fontSize}px`,
            color: isHeader ? updates.headerTextColor : updates.cellTextColor,
            backgroundColor: isHeader
              ? updates.headerBackgroundColor
              : updates.cellBackgroundColor,
          });
        });
      }
    }

    // IMAGE UPDATES
    else if (elementType === "image" && updates.settings) {
      currentSelectedContentElement.setAttribute(
        "data-settings",
        JSON.stringify(updates.settings)
      );

      const imgTag = currentSelectedContentElement.querySelector("img");
      if (imgTag) {
        imgTag.src = updates.settings.src || "/placeholder.svg";
        imgTag.alt = updates.settings.alt || "Image";
        Object.assign(imgTag.style, {
          width: `${updates.settings.width}px`,
          height: `${updates.settings.height}px`,
        });
      }
    }

    // GENERIC STYLE UPDATES
    else if (updates.style) {
      Object.assign(currentSelectedContentElement.style, updates.style);
    }

    // SAVE PAGE AFTER ANY CHANGE
    if (mainEditorContentRef.current && selectedPage?.id) {
      onUpdatePage(selectedPage.id, {
        content: mainEditorContentRef.current.innerHTML,
      });
    }
  },
  [currentSelectedContentElement, onUpdatePage, selectedPage?.id]
);

  if (!selectedPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2 text-foreground">
            No page selected
          </h3>
          <p className="text-foreground">Select a page from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full justify-between overflow-scroll">
      <div
        ref={containerRef}
        className="bg-muted/30 flex-1 p-8 flex justify-center items-center flex-col h-fit gap-5 overflow-scroll"
      >
        {/* Render main page */}
        <div className="relative" data-main-page-order={selectedPage.order}>
          {
            (() => {
              try {
                return isContentOverflowing(null);
              } catch {
                return false;
              }
            })()
            // && (
            //   // <div className='absolute top-[-30px] right-0 z-10'>
            //   //   <div className='bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg'>
            //   //     Content overflowing - Consider adding a new page
            //   //   </div>
            //   // </div>
            // )
          }
          <EditorPage
            pageContainerRef={mainPageContainerRef}
            editorContentRef={mainEditorContentRef}
            scaledWidth={scaledWidth}
            scaledHeight={scaledHeight}
            effectiveZoom={effectiveZoom}
            effectiveTheme={effectiveTheme}
            selectedPage={selectedPage}
            selectedDesignElement={selectedDesignElement}
            onSelectDesignElement={onSelectDesignElement}
            template={template}
            headerHeight={headerHeight}
            footerHeight={footerHeight}
            onUpdateTemplate={onUpdateTemplate}
            handleDesignElementDropOnPage={handleDesignElementDropOnPage}
            handlePageDragOver={handlePageDragOver}
            handleContentInput={handleContentInput(null)}
            handleContentBlur={handleContentBlur(null)}
            handleKeyDown={undefined} // Main page doesn't need backspace deletion
            isContentOverflowing={() => isContentOverflowing(null)}
            addPage={addPage}
            onUpdatePage={onUpdatePage}
            designElements={designElements}
            handleDesignElementSelect={handleDesignElementSelect}
            handleDesignElementUpdate={handleDesignElementUpdate}
            handleDesignElementDelete={handleDesignElementDelete}
            setActiveSettingsPanel={setActiveSettingsPanel}
            setCurrentSelectedContentElement={setCurrentSelectedContentElement}
          />
        </div>
        {/* Render subPages */}
        {selectedPage.subPages &&
          selectedPage.subPages.map((subPage: any, idx: number) => (
            <div
              key={subPage.id}
              className="relative"
              data-subpage-order={subPage.order}
              data-subpage-index={idx}
            >
              {
                (() => {
                  try {
                    return isContentOverflowing(idx);
                  } catch {
                    return false;
                  }
                })()
                // && (
                //   // <div className='absolute top-[-30px] right-0 z-10'>
                //   //   <div className='bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg'>
                //   //     Content overflowing - Consider adding a new page
                //   //   </div>
                //   // </div>
                // )
              }
              <EditorPage
                pageContainerRef={subPageContainerRefs[idx]}
                editorContentRef={subPageRefs[idx]}
                scaledWidth={scaledWidth}
                scaledHeight={scaledHeight}
                effectiveZoom={effectiveZoom}
                effectiveTheme={effectiveTheme}
                selectedPage={{
                  ...subPage,
                  backgroundColor: selectedPage.backgroundColor,
                  showHeader: selectedPage.showHeader,
                  showFooter: selectedPage.showFooter,
                }}
                selectedDesignElement={selectedDesignElement}
                onSelectDesignElement={onSelectDesignElement}
                template={template}
                headerHeight={headerHeight}
                footerHeight={footerHeight}
                onUpdateTemplate={onUpdateTemplate}
                handleDesignElementDropOnPage={handleDesignElementDropOnSubPage(
                  idx
                )}
                handlePageDragOver={handlePageDragOver}
                handleContentInput={handleContentInput(idx)}
                handleContentBlur={handleContentBlur(idx)}
                handleKeyDown={handleKeyDown(idx)} // Subpages get backspace deletion
                isContentOverflowing={() => isContentOverflowing(idx)}
                addPage={addPage}
                onUpdatePage={onUpdatePage}
                designElements={subPage.designElements || []}
                handleDesignElementSelect={handleDesignElementSelect}
                handleDesignElementUpdate={handleDesignElementUpdate}
                handleDesignElementDelete={handleDesignElementDelete}
                setActiveSettingsPanel={setActiveSettingsPanel}
                setCurrentSelectedContentElement={
                  setCurrentSelectedContentElement
                }
              />
            </div>
          ))}
        {/* end here */}
      </div>
      <div className="settings-panel-container w-80 flex-shrink-0 border-l bg-background h-full overflow-y-auto sticky top-0 right-0">
       
        {activeSettingsPanel === "toc" && currentSelectedContentElement && (
          <TocSettingsPanel
            selectedElement={currentSelectedContentElement}
            onUpdate={handleContentElementUpdate}
            onClose={() => setActiveSettingsPanel(null)}
          />
        )}
        {activeSettingsPanel === "chart" && currentSelectedContentElement && (
          <ChartSettingsPanel
            selectedElement={currentSelectedContentElement}
            onUpdate={handleContentElementUpdate}
            onClose={() => setActiveSettingsPanel(null)}
          />
        )}
        {activeSettingsPanel === "table" && currentSelectedContentElement && (
          <TableSettingsPanel
            selectedElement={currentSelectedContentElement}
            onUpdate={handleContentElementUpdate}
            onClose={() => setActiveSettingsPanel(null)}
          />
        )}
        {activeSettingsPanel === "image" && currentSelectedContentElement && (
          <ImageSettingsPanel
            element={currentSelectedContentElement}
            onUpdate={handleContentElementUpdate}
            onDelete={() => handleContentElementUpdate({ deleted: true })}
            onClose={() => setActiveSettingsPanel(null)}
          />
        )}
        {activeSettingsPanel === "layout" && currentSelectedContentElement && (
          <LayoutSettingsPanel
            element={currentSelectedContentElement}
            onUpdate={handleContentElementUpdate}
            onClose={() => setActiveSettingsPanel(null)}
            onSyncContent={() => {
              if (mainEditorContentRef.current && selectedPage) {
                onUpdatePage(selectedPage.id, {
                  content: mainEditorContentRef.current.innerHTML,
                });
              }
            }}
          />
        )}
        {activeSettingsPanel === "design" && selectedDesignElement && (
          <DesignElementSettings
            element={selectedDesignElement}
            onUpdate={(updates) =>
              handleDesignElementUpdate(selectedDesignElement.id, updates)
            }
            onDelete={() => handleDesignElementDelete(selectedDesignElement.id)}
            onDuplicate={() =>
              handleDesignElementDuplicate(selectedDesignElement)
            }
            onClose={() => setActiveSettingsPanel(null)}
          />
        )}
        {activeSettingsPanel === "header" && (
          <HeaderSettingsPanel
            template={template}
            onUpdate={onUpdateTemplate}
            onClose={() => setActiveSettingsPanel(null)}
          />
        )}
        {activeSettingsPanel === "footer" && (
          <FooterSettingsPanel
            template={template}
            onUpdate={onUpdateTemplate}
            onClose={() => setActiveSettingsPanel(null)}
          />
        )}
      </div>
    </div>
  );
}
