"use client";

import React from "react";
import { log } from "console";

interface TemplateBuilderPreviewProps {
  template: any;
  zoom: number;
}

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

export function TemplateBuilderPreview({
  template,
  zoom,
}: TemplateBuilderPreviewProps) {
  // A4 dimensions in pixels (at 96 DPI)
  const pageWidth = 794;
  const pageHeight = 1123;

  // Inject CSS for table custom background colors, layout border removal, and list styling
  React.useEffect(() => {
    // Create or update CSS for table custom colors, layout border removal, and list styling
    let styleElement = document.getElementById("table-preview-custom-styles");
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "table-preview-custom-styles";
      document.head.appendChild(styleElement);
    }

    // Add CSS rules for custom cell background colors, widths, layout border removal, and list styling
    styleElement.textContent = `
      .table-builder-cell[data-custom-bg] {
        background-color: var(--custom-bg-color) !important;
      }
      .table-builder-cell[data-custom-width] {
        width: var(--custom-width) !important;
        max-width: var(--custom-width) !important;
        min-width: var(--custom-width) !important;
      }
      
      /* Force remove borders from layout elements in preview */
      .layout-element,
      .layout-column {
        border: none !important;
        border-width: 0 !important;
        border-style: none !important;
        border-color: transparent !important;
      }
      
      /* Ensure element containers maintain proper flex behavior in preview */
      .element-container {
        display: flex !important;
        width: 100% !important;
        margin: 16px 0 !important;
        /* Preserve any justify-content set by alignment tools */
      }
      
      .element-container[style*="justify-content: center"] {
        justify-content: center !important;
      }
      
      .element-container[style*="justify-content: flex-end"] {
        justify-content: flex-end !important;
      }
      
      .element-container[style*="justify-content: flex-start"] {
        justify-content: flex-start !important;
      }
      
      .element-container[style*="justify-content: stretch"] {
        justify-content: stretch !important;
      }
      
      /* List styling for preview - ensure bullets and numbers show */
      ul {
        list-style-type: disc !important;
        margin: 0.5em 0 !important;
        padding-left: 2em !important;
        list-style-position: outside !important;
      }
      
      ol {
        list-style-type: decimal !important;
        margin: 0.5em 0 !important;
        padding-left: 2em !important;
        list-style-position: outside !important;
      }
      
      /* Target specific containers to override any framework resets */
      .max-w-none ul {
        list-style-type: disc !important;
        margin: 0.5em 0 !important;
        padding-left: 2em !important;
        list-style-position: outside !important;
      }
      
      .max-w-none ol {
        list-style-type: decimal !important;
        margin: 0.5em 0 !important;
        padding-left: 2em !important;
        list-style-position: outside !important;
      }
      
      .max-w-none li {
        display: list-item !important;
        list-style-type: inherit !important;
      }
      
      li {
        display: list-item !important;
        list-style-type: inherit !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: inherit !important;
      }
      
      /* Nested list styling */
      ul ul {
        list-style-type: circle !important;
      }
      
      ul ul ul {
        list-style-type: square !important;
      }
      
      ol ol {
        list-style-type: lower-alpha !important;
      }
      
      ol ol ol {
        list-style-type: lower-roman !important;
      }
      
      /* More specific selectors to override any conflicting styles */
      ul li {
        list-style-type: disc !important;
      }
      
      ol li {
        list-style-type: decimal !important;
      }
      
      /* Ensure list markers are visible */
      ul, ol {
        list-style-position: outside !important;
      }
      
      /* Override any CSS framework resets (like Tailwind) */
      div ul {
        list-style: disc !important;
      }
      
      div ol {
        list-style: decimal !important;
      }
      
      div ul li {
        list-style: disc !important;
        list-style-type: disc !important;
      }
      
      div ol li {
        list-style: decimal !important;
        list-style-type: decimal !important;
      }
      
      /* Extremely specific selectors to override Tailwind and other resets */
      .bg-white ol {
        list-style-type: decimal !important;
        list-style: decimal !important;
        counter-reset: none !important;
      }
      
      .bg-white ol li {
        list-style-type: decimal !important;
        list-style: decimal !important;
        display: list-item !important;
        counter-increment: none !important;
      }
      
      .bg-white ul {
        list-style-type: disc !important;
        list-style: disc !important;
      }
      
      .bg-white ul li {
        list-style-type: disc !important;
        list-style: disc !important;
        display: list-item !important;
      }
      
      /* Target the exact content container */
      .p-6 ol {
        list-style-type: decimal !important;
        list-style: decimal !important;
        margin: 0.5em 0 !important;
        padding-left: 2em !important;
        list-style-position: outside !important;
      }
      
      .p-6 ol li {
        list-style-type: decimal !important;
        list-style: decimal !important;
        display: list-item !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .p-6 ul {
        list-style-type: disc !important;
        list-style: disc !important;
        margin: 0.5em 0 !important;
        padding-left: 2em !important;
        list-style-position: outside !important;
      }
      
      .p-6 ul li {
        list-style-type: disc !important;
        list-style: disc !important;
        display: list-item !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Word wrapping and text overflow styles for preview */
      p, div, span, h1, h2, h3, h4, h5, h6 {
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        box-sizing: border-box !important;
      }
      
      /* Ensure content containers have proper width constraints */
      .max-w-none {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      
      /* Ensure all text elements respect container boundaries without expanding */
      .max-w-none * {
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        box-sizing: border-box !important;
      }
      
      /* Specific word wrapping for content containers */
      .px-6 {
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      
      .px-6 * {
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        box-sizing: border-box !important;
      }
    `;

    return () => {
      // Clean up on unmount
      const element = document.getElementById("table-preview-custom-styles");
      if (element) {
        element.remove();
      }
    };
  }, []);

  // Process tables with custom colors after DOM is rendered
  React.useEffect(() => {
    const processTablesInDOM = () => {
      // Find all table containers with settings
      const tableContainers = document.querySelectorAll(
        "[data-table-settings]"
      );

      tableContainers.forEach((container) => {
        try {
          const settingsAttr = container.getAttribute("data-table-settings");
          if (!settingsAttr) return;

          const settings = JSON.parse(settingsAttr.replace(/&quot;/g, '"'));
          if (!settings.data) return;

          // Find the table within this container
          const table = container.querySelector(
            'table[data-merged-cells="true"]'
          );
          if (!table) return;

          // Process each cell
          const cells = table.querySelectorAll(
            "td[data-row][data-col], th[data-row][data-col]"
          );
          cells.forEach((cell) => {
            const row = parseInt(cell.getAttribute("data-row") || "-1");
            const col = parseInt(cell.getAttribute("data-col") || "-1");

            if (
              row >= 0 &&
              col >= 0 &&
              settings.data[row] &&
              settings.data[row][col]
            ) {
              const cellData = settings.data[row][col];

              // Handle custom background color
              if (cellData.customBackgroundColor) {
                // Apply custom background color using CSS custom property
                (cell as HTMLElement).style.setProperty(
                  "--custom-bg-color",
                  cellData.customBackgroundColor
                );
                cell.setAttribute("data-custom-bg", "true");
                cell.classList.add("table-builder-cell");

                // Also apply directly to override inline styles
                (cell as HTMLElement).style.backgroundColor =
                  cellData.customBackgroundColor + " !important";
              }

              // Handle custom width
              if (cellData.customWidth) {
                // Apply custom width using CSS custom property
                (cell as HTMLElement).style.setProperty(
                  "--custom-width",
                  `${cellData.customWidth}px`
                );
                cell.setAttribute("data-custom-width", "true");
                cell.classList.add("table-builder-cell");

                // Also apply directly to override inline styles
                (
                  cell as HTMLElement
                ).style.width = `${cellData.customWidth}px !important`;
                (
                  cell as HTMLElement
                ).style.maxWidth = `${cellData.customWidth}px !important`;
                (
                  cell as HTMLElement
                ).style.minWidth = `${cellData.customWidth}px !important`;
              }
            }
          });
        } catch (error) {
          console.error("Error processing table settings in preview:", error);
        }
      });
    };

    // Process tables after content is rendered
    const timer = setTimeout(processTablesInDOM, 100);

    return () => clearTimeout(timer);
  }, [template?.pages?.[0]?.content]); // Re-run when content changes

  const renderDesignElement = (element: DesignElement) => {
    if (!element.visible) return null;

    const renderShape = () => {
      const commonStyle = {
        fill: element.style.fill || "transparent",
        stroke: element.style.stroke || "transparent",
        strokeWidth: element.style.strokeWidth || 0,
        opacity: element.style.opacity || 1,
      };

      switch (element.type) {
        case "rectangle":
          return (
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <rect
                x="0"
                y="0"
                rx={element.style.borderRadius || 0}
                {...commonStyle}
                width="100"
                height="100"
              />
            </svg>
          );
        case "circle":
          return (
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <ellipse cx="50" cy="50" rx="50" ry="50" {...commonStyle} />
            </svg>
          );
        case "triangle":
          return (
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <polygon points="50,0 100,100 0,100" {...commonStyle} />
            </svg>
          );
        case "line":
          return (
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                stroke={element.style.stroke || "#3b82f6"}
                strokeWidth={element.style.strokeWidth || 2}
                opacity={element.style.opacity || 1}
              />
            </svg>
          );
        case "image":
          return (
            <img
              src={element.style.src || "/placeholder.svg?height=100&width=100"}
              alt="Design element"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: element.style.opacity || 1,
                borderRadius: element.style.borderRadius || 0,
              }}
            />
          );
        default:
          return null;
      }
    };

    return (
      <div
        key={element.id}
        className="absolute"
        style={{
          left: element.position.x,
          top: element.position.y,
          width: element.size.width,
          height: element.size.height,
          transform: `rotate(${element.rotation}deg)`,
          zIndex: element.zIndex,
        }}
      >
        {renderShape()}
      </div>
    );
  };

  const renderMarkdown = (content: any) => {
    // Function to process tables and apply custom cell background colors
    const processTablesWithCustomColors = (html: string) => {
      // Find all table containers with data-table-settings and process them
      return html.replace(
        /(<div[^>]*data-table-settings="([^"]*)"[^>]*>[\s\S]*?<\/div>)/gi,
        (match, fullDiv, settingsAttr) => {
          try {
            console.log(
              "Found table with settings:",
              settingsAttr.substring(0, 100) + "..."
            );

            // Decode HTML entities and parse settings
            const decodedSettings = settingsAttr.replace(/&quot;/g, '"');
            const settings = JSON.parse(decodedSettings);

            if (!settings.data) {
              console.log("No data found in settings");
              return match;
            }

            console.log("Table data:", settings.data);

            // Check for custom background colors in the data
            let hasCustomColors = false;
            settings.data.forEach((row: any[], rowIndex: number) => {
              row.forEach((cell: any, colIndex: number) => {
                if (cell.customBackgroundColor) {
                  console.log(
                    `Found custom color at [${rowIndex}][${colIndex}]:`,
                    cell.customBackgroundColor
                  );
                  hasCustomColors = true;
                }
              });
            });

            if (!hasCustomColors) {
              console.log("No custom colors found in data");
              return match;
            }

            // Process the table within this div
            let processedDiv = fullDiv;

            // Find and process each cell by position instead of attributes
            // Since we know the table structure, we can process cells by their position
            let cellIndex = 0;
            processedDiv = processedDiv.replace(
              /<(td|th)([^>]*?)>([^<]*)<\/\1>/gi,
              (
                cellMatch: string,
                tag: string,
                attributes: string,
                content: string
              ) => {
                const totalCols = settings.columns;
                const row = Math.floor(cellIndex / totalCols);
                const col = cellIndex % totalCols;
                cellIndex++;

                console.log(
                  `Processing cell at [${row}][${col}] with content:`,
                  content
                );

                // Apply custom background color if found
                if (
                  row >= 0 &&
                  col >= 0 &&
                  settings.data[row] &&
                  settings.data[row][col]
                ) {
                  const cellData = settings.data[row][col];
                  if (cellData.customBackgroundColor) {
                    console.log(
                      `Applying custom color ${cellData.customBackgroundColor} to cell [${row}][${col}]`
                    );

                    // Update the style attribute to include custom background color
                    let newAttributes = attributes;
                    const styleMatch = attributes.match(/style="([^"]*)"/i);

                    if (styleMatch) {
                      let style = styleMatch[1];
                      // Remove existing background-color and add custom one
                      style = style.replace(/background-color:[^;]*;?/gi, "");
                      style += `background-color: ${cellData.customBackgroundColor} !important;`;
                      newAttributes = attributes.replace(
                        /style="[^"]*"/i,
                        `style="${style}"`
                      );
                    } else {
                      newAttributes += ` style="background-color: ${cellData.customBackgroundColor} !important;"`;
                    }

                    return `<${tag}${newAttributes}>${content}</${tag}>`;
                  }
                }

                return cellMatch;
              }
            );

            return processedDiv;
          } catch (error) {
            console.error("Error processing table settings:", error);
            return match;
          }
        }
      );
    };

    // Function to extract complete chart elements with proper nesting
    const extractChartElements = (html: string) => {
      const chartPlaceholders: string[] = [];
      let result = html;

      // Find all chart div start positions
      const chartRegex = /<div[^>]*data-element-type="chart"[^>]*>/gi;
      let match;
      const charts: { start: number; startTag: string }[] = [];

      while ((match = chartRegex.exec(html)) !== null) {
        charts.push({
          start: match.index,
          startTag: match[0],
        });
      }

      // Process charts from end to start to avoid index shifting
      charts.reverse().forEach((chart) => {
        let divCount = 1;
        let pos = chart.start + chart.startTag.length;
        let end = pos;

        // Find the matching closing div
        while (divCount > 0 && pos < html.length) {
          const nextDiv = html.indexOf("<div", pos);
          const nextCloseDiv = html.indexOf("</div>", pos);

          if (nextCloseDiv === -1) break;

          if (nextDiv !== -1 && nextDiv < nextCloseDiv) {
            divCount++;
            pos = nextDiv + 4;
          } else {
            divCount--;
            pos = nextCloseDiv + 6;
            if (divCount === 0) {
              end = pos;
            }
          }
        }

        if (divCount === 0) {
          const chartContent = html.substring(chart.start, end);
          const placeholder = `__CHART_PLACEHOLDER_${chartPlaceholders.length}__`;
          chartPlaceholders.push(chartContent);
          result =
            result.substring(0, chart.start) +
            placeholder +
            result.substring(end);
          console.log(
            "Extracted chart element of length:",
            chartContent.length
          );
        }
      });

      return { html: result, placeholders: chartPlaceholders };
    };

    // Extract chart elements properly
    const { html: htmlWithoutCharts, placeholders: chartPlaceholders } =
      extractChartElements(content);

    // Remove drag handle divs before any other processing
    let cleanedContent = htmlWithoutCharts
      // Handle escaped quotes in HTML (like from JSON)
      .replace(
        /<div[^>]*class=\\"[^"]*drag-handle[^"]*\\"[^>]*>[\s\S]*?<\/div>/gi,
        ""
      )
      .replace(
        /<div[^>]*class=\\"[^"]*content-element-drag-handle[^"]*\\"[^>]*>[\s\S]*?<\/div>/gi,
        ""
      )
      // Handle both regular and escaped quotes
      .replace(/<div[^>]*title=\\"Select Chart\\"[^>]*>[\s\S]*?<\/div>/gi, "")
      .replace(/<div[^>]*title="Select Chart"[^>]*>[\s\S]*?<\/div>/gi, "");

    // Process tables with custom cell background colors
    let processedContent = processTablesWithCustomColors(cleanedContent);

    // Function to forcefully fix list styles with inline styles
    const forceListStyles = (htmlContent: string) => {
      // Force ordered list styles - only add if not already present or conflicting
      htmlContent = htmlContent.replace(
        /<ol([^>]*)>/gi,
        (match, attributes) => {
          // Check if style attribute already exists
          if (attributes.includes("style=")) {
            // Update existing style to ensure list-style-type is decimal
            return match.replace(
              /style="([^"]*)"/i,
              (styleMatch, styleContent) => {
                // Remove any conflicting list-style properties and add correct ones
                let updatedStyle = styleContent
                  .replace(/list-style-type:\s*[^;]*;?/gi, "")
                  .replace(/list-style:\s*[^;]*;?/gi, "")
                  .replace(/list-style-position:\s*[^;]*;?/gi, "")
                  .replace(/display:\s*[^;]*;?/gi, "");

                // Add the correct styles
                updatedStyle +=
                  " list-style-type: decimal !important; list-style-position: outside !important; display: block !important;";

                // Clean up multiple semicolons and spaces
                updatedStyle = updatedStyle
                  .replace(/;+/g, ";")
                  .replace(/^\s*;\s*/, "")
                  .trim();

                return `style="${updatedStyle}"`;
              }
            );
          } else {
            // Add new style attribute
            return `<ol${attributes} style="list-style-type: decimal !important; margin: 0.5em 0 !important; padding-left: 2em !important; list-style-position: outside !important; display: block !important;">`;
          }
        }
      );

      // Force unordered list styles - only add if not already present or conflicting
      htmlContent = htmlContent.replace(
        /<ul([^>]*)>/gi,
        (match, attributes) => {
          // Check if style attribute already exists
          if (attributes.includes("style=")) {
            // Update existing style to ensure list-style-type is disc
            return match.replace(
              /style="([^"]*)"/i,
              (styleMatch, styleContent) => {
                // Remove any conflicting list-style properties and add correct ones
                let updatedStyle = styleContent
                  .replace(/list-style-type:\s*[^;]*;?/gi, "")
                  .replace(/list-style:\s*[^;]*;?/gi, "")
                  .replace(/list-style-position:\s*[^;]*;?/gi, "")
                  .replace(/display:\s*[^;]*;?/gi, "");

                // Add the correct styles
                updatedStyle +=
                  " list-style-type: disc !important; list-style-position: outside !important; display: block !important;";

                // Clean up multiple semicolons and spaces
                updatedStyle = updatedStyle
                  .replace(/;+/g, ";")
                  .replace(/^\s*;\s*/, "")
                  .trim();

                return `style="${updatedStyle}"`;
              }
            );
          } else {
            // Add new style attribute
            return `<ul${attributes} style="list-style-type: disc !important; margin: 0.5em 0 !important; padding-left: 2em !important; list-style-position: outside !important; display: block !important;">`;
          }
        }
      );

      // Force list item styles
      htmlContent = htmlContent.replace(
        /<li([^>]*)>/gi,
        (match, attributes) => {
          // Check if style attribute already exists
          if (attributes.includes("style=")) {
            // Update existing style to ensure proper display
            return match.replace(
              /style="([^"]*)"/i,
              (styleMatch, styleContent) => {
                // Remove conflicting display and list-style-type properties
                let updatedStyle = styleContent
                  .replace(/display:\s*[^;]*;?/gi, "")
                  .replace(/list-style-type:\s*[^;]*;?/gi, "");

                // Add the correct styles
                updatedStyle +=
                  " display: list-item !important; list-style-type: inherit !important;";

                // Clean up multiple semicolons and spaces
                updatedStyle = updatedStyle
                  .replace(/;+/g, ";")
                  .replace(/^\s*;\s*/, "")
                  .trim();

                return `style="${updatedStyle}"`;
              }
            );
          } else {
            // Add new style attribute
            return `<li${attributes} style="display: list-item !important; list-style-type: inherit !important; margin: 0 !important; padding: 0 !important; line-height: inherit !important;">`;
          }
        }
      );

      return htmlContent;
    };

    // Apply forced list styles
    processedContent = forceListStyles(processedContent);

    // Function to remove borders from layout elements using DOM manipulation
    const removeBordersFromLayoutElements = (htmlContent: string) => {
      try {
        // Create a temporary DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(
          `<div>${htmlContent}</div>`,
          "text/html"
        );

        // Find all elements with layout-element or layout-column classes
        const layoutElements = doc.querySelectorAll(
          ".layout-element, .layout-column"
        );

        console.log(
          `Found ${layoutElements.length} layout elements to process`
        );

        layoutElements.forEach((element, index) => {
          const htmlElement = element as HTMLElement;
          console.log(
            `Processing element ${index + 1}:`,
            htmlElement.className
          );

          // Remove all border-related styles
          if (htmlElement.style) {
            htmlElement.style.border = "";
            htmlElement.style.borderWidth = "";
            htmlElement.style.borderStyle = "";
            htmlElement.style.borderColor = "";
            htmlElement.style.borderTop = "";
            htmlElement.style.borderRight = "";
            htmlElement.style.borderBottom = "";
            htmlElement.style.borderLeft = "";

            // Clean up empty style attribute
            if (!htmlElement.style.cssText.trim()) {
              htmlElement.removeAttribute("style");
            }
          }
        });

        // Get the processed HTML
        const containerDiv = doc.body.firstChild as HTMLElement;
        const processedHtml = containerDiv?.innerHTML || htmlContent;
        console.log("Border removal complete using DOM manipulation");
        return processedHtml;
      } catch (error) {
        console.error(
          "Error in DOM manipulation, falling back to regex:",
          error
        );

        // Fallback to more aggressive regex patterns
        return (
          htmlContent
            // More comprehensive border removal patterns
            .replace(/\bborder(-[a-z]+)?:\s*[^;]+;?/gi, "")
            .replace(/\bstyle="[^"]*border[^"]*"/gi, (match) => {
              // Extract style content and remove border properties
              const styleContent = match.match(/style="([^"]*)"/i)?.[1] || "";
              const cleanedStyle = styleContent
                .replace(/\bborder(-[a-z]+)?:\s*[^;]+;?/gi, "")
                .replace(/;+/g, ";")
                .replace(/^;|;$/g, "")
                .trim();

              return cleanedStyle ? `style="${cleanedStyle}"` : "";
            })
            // Remove empty style attributes
            .replace(/\s*style=""\s*/gi, " ")
            .replace(/\s+/g, " ")
        );
      }
    };

    let html = removeBordersFromLayoutElements(processedContent)
      // Remove drag handle divs that shouldn't appear in preview
      .replace(
        /<div[^>]*class="[^"]*drag-handle[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        ""
      )
      // Remove content-element-drag-handle divs specifically
      .replace(
        /<div[^>]*class="[^"]*content-element-drag-handle[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        ""
      )
      // Remove by specific style pattern with more flexible matching
      .replace(
        /<div[^>]*style="[^"]*position:\s*absolute[^"]*top:\s*8px[^"]*left:\s*-24px[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        ""
      )
      // Remove any div with title="Select Chart" (another identifying attribute)
      .replace(/<div[^>]*title="Select Chart"[^>]*>[\s\S]*?<\/div>/gi, "")
      // More general pattern for drag handles with cursor: grab
      .replace(
        /<div[^>]*style="[^"]*cursor:\s*grab[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        ""
      )
      // Heading / Titles
      .replace(
        /<h1[^>]*>([\s\S]*?)<\/h1>/gi,
        `<h1 style="color: ${
          template?.theme?.colors?.primary || "#dc2626"
        }; font-size: ${32}px; font-family: ${
          template?.theme?.typography?.fontFamily || "Arial, sans-serif"
        }; line-height: ${
          template?.theme?.typography?.lineHeight || "1.5"
        }; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto;" class="font-bold mt-1.5 mb-3">$1</h1>`
      )
      .replace(
        /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
        `<h2 style="color: ${
          template?.theme?.colors?.primary || "#dc2626"
        }; font-size: ${28}px; font-family: ${
          template?.theme?.typography?.fontFamily || "Arial, sans-serif"
        }; line-height: ${
          template?.theme?.typography?.lineHeight || "1.5"
        }; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto;" class="font-bold mt-1.5 mb-3">$1</h2>`
      )
      .replace(
        /<h3[^>]*>([\s\S]*?)<\/h3>/gi,
        `<h3 style="color: ${
          template?.theme?.colors?.primary || "#dc2626"
        }; font-size: ${24}px; font-family: ${
          template?.theme?.typography?.fontFamily || "Arial, sans-serif"
        }; line-height: ${
          template?.theme?.typography?.lineHeight || "1.5"
        }; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto;" class="font-bold mt-1.5 mb-3">$1</h3>`
      )
      .replace(
        /<h4[^>]*>([\s\S]*?)<\/h4>/gi,
        `<h4 style="color: ${
          template?.theme?.colors?.primary || "#dc2626"
        }; font-size: ${20}px; font-family: ${
          template?.theme?.typography?.fontFamily || "Arial, sans-serif"
        }; line-height: ${
          template?.theme?.typography?.lineHeight || "1.5"
        }; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto;" class="font-bold mt-1.5 mb-3">$1</h4>`
      )
      .replace(
        /<h5[^>]*>([\s\S]*?)<\/h5>/gi,
        `<h5 style="color: ${
          template?.theme?.colors?.primary || "#dc2626"
        }; font-size: ${18}px; font-family: ${
          template?.theme?.typography?.fontFamily || "Arial, sans-serif"
        }; line-height: ${
          template?.theme?.typography?.lineHeight || "1.5"
        }; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto;" class="font-bold mt-1.5 mb-3">$1</h5>`
      )
      .replace(
        /<h6[^>]*>([\s\S]*?)<\/h6>/gi,
        `<h6 style="color: ${
          template?.theme?.colors?.primary || "#dc2626"
        }; font-size: ${16}px; font-family: ${
          template?.theme?.typography?.fontFamily || "Arial, sans-serif"
        }; line-height: ${
          template?.theme?.typography?.lineHeight || "1.5"
        }; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto;" class="font-bold mt-1.5 mb-3">$1</h6>`
      )

      // Text Content - now safe to process all p tags since charts are protected
      .replace(
        /<p[^>]*>([\s\S]*?)<\/p>/gi,
        `<p style="color: ${
          template?.theme?.colors?.text || "#000"
        }; font-size: ${
          template?.theme?.typography?.baseFontSize || 14
        }px; font-family: ${
          template?.theme?.typography?.fontFamily || "Arial, sans-serif"
        }; line-height: ${
          template?.theme?.typography?.lineHeight || "1.5"
        }; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto;">$1</p>`
      )

      // TOC (not working)
      // .replace(
      //   /<h3[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/h3>/gi,
      //   `<h3 style="color: ${
      //     template?.theme?.colors?.primary || '#dc2626'
      //   }" "font-family: ${
      //     template?.theme?.typography?.fontFamily || 'Arial, sans-serif'
      //   }" "font-size: ${
      //     (template?.theme?.typography?.baseFontSize || 14) * 0.9
      //   }" "line-height: ${
      //     template?.theme?.typography?.lineHeight || 1.5
      //   } "class="font-semibold mb-2">
      //    $1
      //  </h3>`
      // )
      // .replace(
      //   /<h3[^>]*>([\s\S]*?)<\/h3>/gi,
      //   `<h3 style="color: ${
      //     template?.theme?.colors?.primary || '#dc2626'
      //   }" "font-family: ${
      //     template?.theme?.typography?.fontFamily || 'Arial, sans-serif'
      //   }" "font-size: ${
      //     (template?.theme?.typography?.baseFontSize || 14) * 0.9
      //   }" "line-height: ${
      //     template?.theme?.typography?.lineHeight || 1.5
      //   }" class="font-semibold mb-2">
      //    $1
      //  </h3>`
      // )

      // Handle special elements
      // .replace(
      //   /\[CHART: ([^\]]+)\]\s*\nTitle: ([^\n]+)\s*\nData:\s*\n((?:- [^\n]+\n?)*)/g,
      //   (match, type, title, data) => {
      //     const dataLines = data
      //       .trim()
      //       .split("\n")
      //       .map((line: string) => {
      //         const [name, value] = line.replace("- ", "").split(": ");
      //         return { name, value: Number.parseInt(value) || 0 };
      //       });
      //     return `<div class="border border-gray-300 rounded-lg p-4 my-4">
      //     <div class="flex items-center gap-2 mb-4">
      //       <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v8H3v-8zm4-6h2v14H7Vs7zm4-4h2v18h-2V3zm4 9h2v9h-2v-9zm4-3h2v12h-2V9z"/></svg>
      //       <span class="font-medium">${title}</span>
      //     </div>
      //     <div class="h-48 bg-gray-50 rounded flex items-center justify-center">
      //       <div class="text-center text-gray-500">
      //         <div class="text-sm font-medium mb-2">${type}</div>
      //         ${dataLines
      //           .map(
      //             (item: any) =>
      //               `<div class="text-xs">${item.name}: ${item.value}</div>`
      //           )
      //           .join("")}
      //       </div>
      //     </div>
      //   </div>`;
      //   }
      // )

      // .replace(
      //   /\[TIMELINE: ([^\]]+)\]\s*\n((?:- [^\n]+\n?)*)/g,
      //   (match, title, events) => {
      //     const eventLines = events
      //       .trim()
      //       .split("\n")
      //       .map((line: string) => {
      //         const eventText = line.replace("- ", "");
      //         const [date, ...rest] = eventText.split(": ");
      //         const [eventTitle, description] = rest.join(": ").split(" - ");
      //         return { date, title: eventTitle, description };
      //       });

      //     return `<div class="border border-gray-300 rounded-lg p-4 my-4">
      //     <div class="flex items-center gap-2 mb-4">
      //       <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
      //       <span class="font-medium">${title}</span>
      //     </div>
      //     <div class="space-y-3">
      //       ${eventLines
      //         .map(
      //           (event: any) => `
      //         <div class="flex gap-3">
      //           <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
      //           <div>
      //             <div class="font-medium text-sm">${event.title}</div>
      //             <div class="text-xs text-gray-500">${event.date}</div>
      //             <div class="text-sm text-gray-600">${
      //               event.description || ""
      //             }</div>
      //           </div>
      //         </div>
      //       `
      //         )
      //         .join("")}
      //     </div>
      //   </div>`;
      //   }
      // )

      // Wrap normal text lines in a span with color
      // .replace(
      //   /(^|\n)(?!<)([^\n<][^\n]*)/g,
      //   (match: string, p1: string, p2: string) => {
      //     // Only wrap if not empty and not already HTML
      //     if (p2.trim() === '') return match;
      //     return `${p1}<span style=\"color: ${
      //       template?.theme?.colors?.text || '#000'
      //     }\">${p2}</span>`;
      //   }
      // )

      // Bold and Italic
      .replace(
        /\*\*\*(.*?)\*\*\*/g,
        '<strong class="font-bold"><em class="italic">$1</em></strong>'
      )
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

      // Strikethrough
      .replace(/~~(.*?)~~/g, '<del class="line-through">$1</del>')

      // Code blocks
      .replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        '<pre class="bg-gray-100 border border-gray-300 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono">$2</code></pre>'
      )

      // Inline code
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono border border-gray-300">$1</code>'
      )

      // Links
      .replace(
        /\[([^\]]+)\]\$\$([^)]+)\$\$/g,
        '<a href="$2" class="text-blue-600 hover:text-blue-800 underline transition-colors" target="_blank" rel="noopener noreferrer">$1</a>'
      )

      // Images
      .replace(
        /!\[([^\]]*)\]\$\$([^)]+)\$\$/g,
        '<img src="$2" alt="$1" class="max-w-full h-auto my-4 rounded border border-gray-300" />'
      )

      // Blockquotes
      .replace(
        /^> (.*$)/gm,
        '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic">$1</blockquote>'
      )

      // Horizontal rules
      .replace(/^---$/gm, '<hr class="border-t border-gray-300 my-6">')

      // Unordered lists
      .replace(
        /^- (.*$)/gm,
        '<li class="ml-4 my-1 list-disc list-inside">$1</li>'
      )

      // Ordered lists
      .replace(
        /^\d+\. (.*$)/gm,
        '<li class="ml-4 my-1 list-decimal list-inside">$1</li>'
      )

      // Variables
      .replace(
        /\{\{([^}]+)\}\}/g,
        '<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-mono border border-yellow-300">{{$1}}</span>'
      );

    // Line breaks
    // .replace(/\n/g, "<br>");

    // Note: Do NOT wrap consecutive list items in <ul> as it breaks ordered lists
    // The original HTML structure should be preserved

    // Restore chart elements
    chartPlaceholders.forEach((chartContent, index) => {
      // Clean drag handles from chart content before restoring
      let cleanedChartContent = chartContent
        // Remove drag handles with escaped quotes
        .replace(
          /<div[^>]*class=\\"[^"]*drag-handle[^"]*\\"[^>]*>[\s\S]*?<\/div>/gi,
          ""
        )
        .replace(
          /<div[^>]*class=\\"[^"]*content-element-drag-handle[^"]*\\"[^>]*>[\s\S]*?<\/div>/gi,
          ""
        )
        // Remove drag handles with regular quotes
        .replace(
          /<div[^>]*class="[^"]*drag-handle[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
          ""
        )
        .replace(
          /<div[^>]*class="[^"]*content-element-drag-handle[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
          ""
        )
        // Remove by title attribute
        .replace(/<div[^>]*title=\\"Select Chart\\"[^>]*>[\s\S]*?<\/div>/gi, "")
        .replace(/<div[^>]*title="Select Chart"[^>]*>[\s\S]*?<\/div>/gi, "")
        // Remove by specific positioning style
        .replace(
          /<div[^>]*style=\\"[^"]*position:\s*absolute[^"]*top:\s*8px[^"]*left:\s*-24px[^"]*\\"[^>]*>[\s\S]*?<\/div>/gi,
          ""
        )
        .replace(
          /<div[^>]*style="[^"]*position:\s*absolute[^"]*top:\s*8px[^"]*left:\s*-24px[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
          ""
        )
        // Remove by cursor grab style
        .replace(
          /<div[^>]*style=\\"[^"]*cursor:\s*grab[^"]*\\"[^>]*>[\s\S]*?<\/div>/gi,
          ""
        )
        .replace(
          /<div[^>]*style="[^"]*cursor:\s*grab[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
          ""
        );

      html = html.replace(
        `__CHART_PLACEHOLDER_${index}__`,
        cleanedChartContent
      );
    });

    // Final cleanup - remove any remaining drag handles that might have been missed
    html = html
      .replace(
        /<div[^>]*class=\\"[^"]*drag-handle[^"]*\\"[^>]*>[\s\S]*?<\/div>/gi,
        ""
      )
      .replace(
        /<div[^>]*class=\\"[^"]*content-element-drag-handle[^"]*\\"[^>]*>[\s\S]*?<\/div>/gi,
        ""
      )
      .replace(
        /<div[^>]*class="[^"]*drag-handle[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        ""
      )
      .replace(
        /<div[^>]*class="[^"]*content-element-drag-handle[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        ""
      )
      .replace(/<div[^>]*title=\\"Select Chart\\"[^>]*>[\s\S]*?<\/div>/gi, "")
      .replace(/<div[^>]*title="Select Chart"[^>]*>[\s\S]*?<\/div>/gi, "");

    return html;
  };

  return (
    <div className="flex-1 bg-muted/30 overflow-auto">
      <div className="p-8">
        {/* Preview Container */}
        <div
          className="bg-white shadow-lg mx-auto relative"
          style={{
            width: pageWidth * (100 / 100),
            minHeight: pageHeight * (100 / 100),
            transform: `scale(${100 / 100})`,
            transformOrigin: "top left",
            backgroundColor:
              (template?.page?.backgroundColor !== "#ffffff"
                ? template?.page?.backgroundColor
                : template?.theme?.colors?.pageBackground) || "#fff",
          }}
        >
          {/* Header */}
          {template?.page?.showHeader && (
            <div
              className={`px-6 flex w-full ${
                template?.header?.alignment === "left"
                  ? "justify-start"
                  : template?.header?.alignment === "right"
                  ? "justify-end"
                  : "justify-center"
              } items-center text-md min-h-10`}
              style={{
                backgroundColor: template?.header?.backgroundColor || "#fff",
                color: template?.header?.textColor || "#000",
                fontSize: (template?.header?.fontSize || 12) + "px",
                fontFamily: template?.header?.fontFamily || "Arial",
                height: template?.header?.height + "px",
                padding: "0 48px",
              }}
              dangerouslySetInnerHTML={{
                __html: template.header.content || "",
              }}
            />
          )}

          {/* Content */}
          <div className={`px-12 py-4 relative`}>
            <div
              className="max-w-none"
              style={{
                fontFamily:
                  template?.theme?.typography?.fontFamily || "inherit",
                fontSize:
                  (template?.theme?.typography?.baseFontSize || 14) + "px",
                lineHeight: template?.theme?.typography?.lineHeight || 1.5,
                wordWrap: "break-word",
                overflowWrap: "break-word",
                hyphens: "auto",
              }}
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(template?.page?.content || ""),
                // __html: template?.page?.content,
              }}
            />

            {/* Render Design Elements */}
            {template?.page?.designElements &&
              template.page.designElements.map((element: DesignElement) =>
                renderDesignElement(element)
              )}
          </div>

          {/* Footer */}
          {template?.page?.showFooter && (
            <div
              className={`absolute bottom-0 text-xs px-6 flex w-full justify-between
                  items-center min-h-10`}
              style={{
                backgroundColor: template?.footer?.backgroundColor || "#fff",
                color: template?.footer?.textColor || "#000",
                fontSize: (template?.footer?.fontSize || 12) + "px",
                fontFamily: template?.footer?.fontFamily || "Arial",
                height: template?.footer?.height + "px",
              }}
            >
              <div
                className={`outline-none flex min-h-full items-center w-[92%] ${
                  template?.footer?.alignment === "left"
                    ? "justify-start"
                    : template?.footer?.alignment === "center"
                    ? "justify-center"
                    : template?.footer?.alignment === "right"
                    ? "justify-end"
                    : "justify-between"
                }`}
              >
                <div>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: template.footer.content || "",
                    }}
                  />
                </div>
              </div>
              {template?.page?.showPageNumber && (
                <span>
                  Page {template?.page?.order || template?.pageIndex + 1}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Render SubPages */}
      {template?.page?.subPages.length !== 0 &&
        template?.page?.subPages.map((subPage: any, subIdx: number) => (
          <div className="p-8" key={subPage.id || subIdx}>
            {/* Preview Container */}
            <div
              className="bg-white shadow-lg mx-auto relative"
              style={{
                width: pageWidth * (100 / 100),
                minHeight: pageHeight * (100 / 100),
                transform: `scale(${100 / 100})`,
                transformOrigin: "top left",
                backgroundColor:
                  (template?.page?.backgroundColor !== "#ffffff"
                    ? template?.page?.backgroundColor
                    : template?.theme?.colors?.pageBackground) || "#fff",
              }}
            >
              {/* Header */}
              {template?.page?.showHeader && (
                <div
                  className={`flex px-6 w-full ${
                    template?.header?.alignment === "left"
                      ? "justify-start"
                      : template?.header?.alignment === "right"
                      ? "justify-end"
                      : "justify-center"
                  } items-center !text-md min-h-10 px-4`}
                  style={{
                    backgroundColor:
                      template?.header?.backgroundColor || "#fff",
                    color: template?.header?.textColor || "#000",
                    fontSize: (template?.header?.fontSize || 12) + "px",
                    fontFamily: template?.header?.fontFamily || "Arial",
                    height: template?.header?.height + "px",
                    padding: "0 48px",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: template?.header?.content || "",
                  }}
                />
              )}

              {/* Content */}
              <div className={`px-12 py-4 relative`}>
                <div
                  className="max-w-none"
                  style={{
                    fontFamily:
                      template?.theme?.typography?.fontFamily || "inherit",
                    fontSize:
                      (template?.theme?.typography?.baseFontSize || 14) + "px",
                    lineHeight: template?.theme?.typography?.lineHeight || 1.5,
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    hyphens: "auto",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(subPage?.content || ""),
                    // __html: subPage?.content,
                  }}
                />

                {/* Render Design Elements for SubPage */}
                {subPage?.designElements &&
                  subPage.designElements.map((element: DesignElement) =>
                    renderDesignElement(element)
                  )}
              </div>

              {/* Footer */}
              {template?.page?.showFooter && (
                <div
                  className={`absolute bottom-0 text-xs px-6 flex w-full justify-between
                  items-center min-h-10`}
                  style={{
                    backgroundColor:
                      template?.footer?.backgroundColor || "#fff",
                    color: template?.footer?.textColor || "#000",
                    fontSize: (template?.footer?.fontSize || 12) + "px",
                    fontFamily: template?.footer?.fontFamily || "Arial",
                    height: template?.footer?.height + "px",
                  }}
                >
                  <div
                    className={`outline-none flex min-h-full items-center w-[92%] ${
                      template?.footer?.alignment === "left"
                        ? "justify-start"
                        : template?.footer?.alignment === "center"
                        ? "justify-center"
                        : template?.footer?.alignment === "right"
                        ? "justify-end"
                        : "justify-between"
                    }`}
                  >
                    <div className="w-fit">
                      <div
                        className="w-fit"
                        dangerouslySetInnerHTML={{
                          __html: template.footer.content || "",
                        }}
                      />
                    </div>
                  </div>
                  {template?.page?.showPageNumber && (
                    <span>Page {subPage?.order || subIdx + 1}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
