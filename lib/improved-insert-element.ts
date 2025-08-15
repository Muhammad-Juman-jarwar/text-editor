import { ElementInserter } from "./element-inserter";

export function createImprovedInsertElement(
  selectedPage: any,
  onUpdatePage: any,
  getCurrentlyFocusedEditor: any,
  getFocusedColumn: any,
  getFocusedHeader: any,
  getFocusedFooter: any,
  setFocusedColumn: any,
  generateImagePlaceholderHtmlForHeader: any,
  generateTableHtml: any,
  generateChartHtmlForLayoutColumn: any,
  generateChartHtml: any,
  generateImagePlaceholderHtml: any,
  generateLayoutHtml: any,
  generateTocHtml: any,
  generateButtonHtml: any,
  generateVideoHtml: any,
  generateIconHtml: any,
  generateMapHtml: any,
  generateQRCodeHtml: any,
  defaultChartSettings: any,
  attachFocusTrackingToLayoutColumns: any,
  effectiveTheme: any
) {
  return (type: string) => {
    const focusedColumn = getFocusedColumn();
    const focusedHeader = getFocusedHeader();
    const focusedFooter = getFocusedFooter();

    // Enhanced cursor position detection and preservation
    const selection = window.getSelection();
    const currentRange =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    // Check if cursor is inside a table cell - if so, prevent insertion
    let isInsideTableCell = false;
    if (currentRange) {
      let element: Node | null = currentRange.commonAncestorContainer;
      while (element && element.nodeType !== Node.DOCUMENT_NODE) {
        if (element.nodeType === Node.ELEMENT_NODE) {
          const htmlElement = element as HTMLElement;
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

    if (isInsideTableCell) {
      console.warn(
        "Cannot insert elements inside table cells. Please click outside the table."
      );
      return;
    }

    // Determine target element and editor ID for cursor management
    let targetElement: HTMLElement | null = null;
    let editorId = "";

    if (focusedHeader) {
      targetElement = focusedHeader;
      editorId = "header";
    } else if (focusedFooter) {
      targetElement = focusedFooter;
      editorId = "footer";
    } else if (focusedColumn) {
      targetElement = focusedColumn;
      editorId = `column-${Array.from(
        document.querySelectorAll(".layout-column-content")
      ).indexOf(focusedColumn)}`;
    } else {
      // Use the currently focused editor
      targetElement = getCurrentlyFocusedEditor();
      editorId = targetElement?.id || "main-editor";
    }

    if (!targetElement) {
      console.warn("No target element found for insertion");
      return;
    }

    let html = "";

    // Generate HTML for different element types
    if (focusedHeader || focusedFooter) {
      switch (type) {
        case "image":
          html = generateImagePlaceholderHtmlForHeader();
          break;
        default:
          console.warn(
            `Element type "${type}" is not supported in headers/footers yet.`
          );
          return;
      }
    } else {
      // Generate HTML for main content area or layout columns
      switch (type) {
        case "table":
          html = generateTableHtml();
          break;
        case "chart":
          html = focusedColumn
            ? generateChartHtmlForLayoutColumn(defaultChartSettings)
            : generateChartHtml(defaultChartSettings);
          break;
        case "image":
          html = generateImagePlaceholderHtml();
          break;
        case "layout":
          html = generateLayoutHtml();
          break;
        case "toc":
          html = generateTocHtml();
          break;
        case "button":
          html = generateButtonHtml();
          break;
        case "video":
          html = generateVideoHtml();
          break;
        case "icon":
          html = generateIconHtml();
          break;
        case "map":
          html = generateMapHtml();
          break;
        case "qrcode":
          html = generateQRCodeHtml();
          break;
        default:
          console.warn(`Unknown element type: ${type}`);
          return;
      }
    }

    if (!html) {
      console.warn("No HTML generated for element insertion");
      return;
    }

    // For main content area, wrap in element container
    if (!focusedHeader && !focusedFooter && !focusedColumn) {
      html = `<div class="element-container" style="display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;" contenteditable="false">${html}</div>`;
    }

    // Use the enhanced element inserter
    const context = {
      targetElement,
      editorId,
      preserveCursor: true,
      insertionType: "at-cursor" as const,
    };

    const success = ElementInserter.smartInsert(html, context);

    if (success) {
      // Update page content after successful insertion
      if (selectedPage && onUpdatePage) {
        setTimeout(() => {
          onUpdatePage(selectedPage.id, { content: targetElement!.innerHTML });

          // Trigger overflow check for main content areas
          if (
            !focusedHeader &&
            !focusedFooter &&
            (window as any).forceEditorOverflowCheck
          ) {
            (window as any).forceEditorOverflowCheck();
          }
        }, 50);
      }

      // Special handling for layout insertion
      if (type === "layout") {
        setTimeout(() => {
          attachFocusTrackingToLayoutColumns();
        }, 10);
      }

      // Add trailing paragraph for main content area (for better UX)
      if (!focusedHeader && !focusedFooter && !focusedColumn) {
        setTimeout(() => {
          const selection = window.getSelection();
          const trailingP = document.createElement("p");
          trailingP.innerHTML = "&nbsp;";
          trailingP.style.color = effectiveTheme.colors.text;
          targetElement!.appendChild(trailingP);

          // Position cursor after the trailing paragraph
          const newRange = document.createRange();
          newRange.setStartAfter(trailingP);
          newRange.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(newRange);
        }, 100);
      }

      console.log(`Successfully inserted ${type} element`);
    } else {
      console.error(`Failed to insert ${type} element`);
    }
  };
}
