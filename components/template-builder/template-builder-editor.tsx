"use client"

import type React from "react"
import { useRef, useEffect, useCallback, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { TocSettingsPanel } from "./toc-settings-panel"
import { ChartSettingsPanel } from "./chart-settings-panel"
import { TableSettingsPanel } from "./table-settings-panel"
import { ImageSettingsPanel } from "./image-element"
import { DesignElementComponent, DesignElementSettings } from "./design-element"
import { LayoutSettingsPanel } from "./layout-settings-panel"

interface DesignElement {
  id: string
  type: "rectangle" | "circle" | "triangle" | "line" | "image"
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  zIndex: number
  visible: boolean
  locked: boolean
  style: {
    fill?: string
    stroke?: string
    strokeWidth?: number
    opacity?: number
    borderRadius?: number
    src?: string
  }
}

interface TemplateBuilderEditorProps {
  template: any
  selectedPage: any
  zoom: number
  onUpdatePage: (pageId: string, updates: any) => void
  designElements?: DesignElement[]
  onUpdateDesignElements?: (elements: DesignElement[]) => void
  selectedDesignElement?: DesignElement | null
  onSelectDesignElement?: (element: DesignElement | null) => void
}

export function TemplateBuilderEditor({
  template,
  selectedPage,
  zoom,
  onUpdatePage,
  designElements = [],
  onUpdateDesignElements = () => {},
  selectedDesignElement = null,
  onSelectDesignElement = () => {},
}: TemplateBuilderEditorProps) {
  const editorContentRef = useRef<HTMLDivElement>(null)
  const pageContainerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [autoZoom, setAutoZoom] = useState(75)

  type ActivePanelType = "toc" | "chart" | "table" | "image" | "layout" | "design" | null
  const [activeSettingsPanel, setActiveSettingsPanel] = useState<ActivePanelType>(null)
  const [currentSelectedContentElement, setCurrentSelectedContentElement] = useState<HTMLElement | null>(null)
  // We use the global selectedDesignElement state passed from parent

  const pageWidth = 794
  const pageHeight = 1123

  const defaultTheme = {
    colors: {
      text: "#000000",
      pageBackground: "#ffffff",
      primary: "#dc2626",
      secondary: "#6b7280",
    },
    typography: {
      bodyFont: "Arial, sans-serif",
      headingFont: "Arial, sans-serif",
      bodyFontSize: 14,
      headingFontSize: 18,
      lineSpacing: 1.5,
    },
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
  }

  const effectiveTheme = {
    colors: { ...defaultTheme.colors, ...template?.theme?.colors },
    typography: { ...defaultTheme.typography, ...template?.theme?.typography },
    margins: { ...defaultTheme.margins, ...template?.theme?.margins },
  }

  useEffect(() => {
    const calculateAutoZoom = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 64
        const calculatedZoom = Math.min((containerWidth / pageWidth) * 100, 100)
        setAutoZoom(Math.max(calculatedZoom, 25))
      }
    }
    calculateAutoZoom()
    window.addEventListener("resize", calculateAutoZoom)
    return () => window.removeEventListener("resize", calculateAutoZoom)
  }, [])

  const effectiveZoom = zoom === 100 ? autoZoom : zoom
  const scaledWidth = pageWidth
  const scaledHeight = pageHeight
  const headerHeight = selectedPage?.showHeader ? template.header?.height || 40 : 0
  const footerHeight = selectedPage?.showFooter ? template.footer?.height || 40 : 0

  // Effect to set initial content when selectedPage.id changes (due to the key prop)
  useEffect(() => {
    if (editorContentRef.current && selectedPage) {
      const initialContent =
        selectedPage.content || `<p style="color: ${effectiveTheme.colors.text};">Click here to start editing...</p>`
      editorContentRef.current.innerHTML = initialContent
    }
  }, [selectedPage?.id, effectiveTheme.colors.text]) // Rerun if page ID changes

  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (selectedPage && editorContentRef.current) {
      onUpdatePage(selectedPage.id, { content: editorContentRef.current.innerHTML })
    }
  }

  const handleContentBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (
      e.relatedTarget &&
      ((e.relatedTarget as HTMLElement).closest(".settings-panel-container") ||
        (e.relatedTarget as HTMLElement).closest(".template-builder-toolbar"))
    ) {
      return
    }
    if (selectedPage && editorContentRef.current) {
      onUpdatePage(selectedPage.id, { content: editorContentRef.current.innerHTML })
    }
  }

  const handleDesignElementDropOnPage = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const elementType = e.dataTransfer.getData("application/design-element")
      if (elementType && pageContainerRef.current) {
        const pageRect = pageContainerRef.current.getBoundingClientRect()
        const x = (e.clientX - pageRect.left) / (effectiveZoom / 100)
        const y = (e.clientY - pageRect.top) / (effectiveZoom / 100)

        const elementBaseSize = { width: 100, height: 60 }
        const adjustedX = Math.max(0, Math.min(x - elementBaseSize.width / 2, pageWidth - elementBaseSize.width))
        const adjustedY = Math.max(0, Math.min(y - elementBaseSize.height / 2, pageHeight - elementBaseSize.height))

        const elementDefaults: Record<string, Partial<DesignElement>> = {
          rectangle: {
            size: { width: 100, height: 60 },
            style: { fill: "#3b82f6", stroke: "#1e40af", strokeWidth: 2, opacity: 1, borderRadius: 4 },
          },
          circle: {
            size: { width: 80, height: 80 },
            style: { fill: "#10b981", stroke: "#059669", strokeWidth: 2, opacity: 1 },
          },
          triangle: {
            size: { width: 80, height: 80 },
            style: { fill: "#f59e0b", stroke: "#d97706", strokeWidth: 2, opacity: 1 },
          },
          line: { size: { width: 100, height: 2 }, style: { stroke: "#6b7280", strokeWidth: 3, opacity: 1 } },
          image: {
            size: { width: 120, height: 80 },
            style: { src: "/placeholder.svg?height=80&width=120&text=Design+Image", opacity: 1, borderRadius: 8 },
          },
        }
        const defaults = elementDefaults[elementType] || {}
        const newElement: DesignElement = {
          id: `${elementType}-${Date.now()}`,
          type: elementType as DesignElement["type"],
          position: { x: adjustedX, y: adjustedY },
          size: defaults.size || elementBaseSize,
          rotation: 0,
          zIndex: designElements.length,
          visible: true,
          locked: false,
          style: defaults.style || {},
        }
        onUpdateDesignElements([...designElements, newElement])
        setTimeout(() => onSelectDesignElement(newElement), 0)
      }
    },
    [designElements, onUpdateDesignElements, effectiveZoom, pageWidth, pageHeight],
  )

  const handlePageDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  useEffect(() => {
    const editorArea = editorContentRef.current
    if (!editorArea) return

    const handleTableCellEdit = (e: Event) => {
      const customEvent = e as CustomEvent
      const tableElement = customEvent.detail?.tableElement as HTMLElement

      if (tableElement && tableElement.dataset.elementType === 'table') {
        // Ensure table stays selected when editing cells
        document.querySelectorAll(".selected").forEach((el) => {
          if (el !== tableElement) {
            el.classList.remove("selected")
          }
        })

        // Make sure the table is selected
        tableElement.classList.add("selected")

        // Update state to show the table settings panel
        setCurrentSelectedContentElement(tableElement)
        setActiveSettingsPanel("table")
      }
    }

    // Add listener for custom table cell edit event
    document.addEventListener("tablecelledit", handleTableCellEdit)

    return () => {
      document.removeEventListener("tablecelledit", handleTableCellEdit)
    }
  }, [])

  useEffect(() => {
    const editorArea = editorContentRef.current
    if (!editorArea) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Function to reset all selections - defined at the top so it can be used anywhere
      const resetAllSelections = () => {
        document.querySelectorAll(".selected").forEach((el) => {
          // Before removing selected class, ensure tables maintain their styles
          // Cast el to HTMLElement to access dataset property
          if ((el as HTMLElement).dataset.elementType === 'table') {
            // Preserve table styles when deselected
            const settingsStr = el.getAttribute('data-table-settings');
            if (settingsStr) {
              try {
                const settings = JSON.parse(settingsStr);
                const table = el.querySelector('table');
                if (table) {
                  // Make sure borders remain visible when deselected if showBorders is true
                  const borderStyle = settings.showBorders 
                    ? `${settings.borderWidth}px solid ${settings.borderColor}` 
                    : 'none';
                    
                  // Always use collapse for consistent cell spacing regardless of borders
                  table.style.borderCollapse = 'collapse';
                  table.style.borderSpacing = '0';
                  table.style.border = borderStyle;
                  
                  // Ensure all cells maintain their borders when deselected
                  table.querySelectorAll('td, th').forEach((cell) => {
                    (cell as HTMLElement).style.border = borderStyle;
                  });
                }
              } catch (error) {
                console.error('Error preserving table styles during deselection:', error);
              }
            }
          }
          el.classList.remove("selected");
        });
        setActiveSettingsPanel(null);
        setCurrentSelectedContentElement(null);
        onSelectDesignElement(null);
      }

      // Find if the click is within a table structure
      const tableElement = target.closest("[data-element-type='table']")
      const isEditableCell = target.closest(".editable-cell") || target.closest(".main-document-table") || target.closest(".editing-enabled")

      // If clicking on an editable table cell and we already have a table selected
      if (isEditableCell && currentSelectedContentElement?.dataset.elementType === 'table') {
        // Let the table cell handle its own events, but keep the table selected
        return
      }
      
      // If clicking on a table cell or table itself
      if (tableElement) {
        // Ensure we're using the parent table element, not just a cell
        const tableParent = tableElement.closest("[data-element-type='table']") || tableElement;
        
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

      if (target.closest("[data-design-element-id]")) return

      const contentElement = target.closest("[data-element-type]") as HTMLElement
      if (contentElement) {
        const elementType = contentElement.dataset.elementType as ActivePanelType
        if (currentSelectedContentElement === contentElement && activeSettingsPanel === elementType) return
        resetAllSelections()
        contentElement.classList.add("selected")
        setCurrentSelectedContentElement(contentElement)
        setActiveSettingsPanel(elementType)
      } else {
        if (!target.closest(".settings-panel-container, .template-builder-toolbar")) {
          resetAllSelections()
        }
      }
    }
    editorArea.addEventListener("click", handleClick)
    return () => editorArea.removeEventListener("click", handleClick)
  }, [activeSettingsPanel, currentSelectedContentElement])

  const handleDesignElementSelect = (element: DesignElement) => {
    document.querySelectorAll(".selected").forEach((el) => el.classList.remove("selected"))
    setCurrentSelectedContentElement(null)
    onSelectDesignElement(element)
    setActiveSettingsPanel("design")
  }

  const selectElementById = (elementId: string) => {
    const element = designElements.find((e) => e.id === elementId)
    if (element) {
      onSelectDesignElement(element)
    }
  }

  const handleDesignElementUpdate = (elementId: string, updates: Partial<DesignElement>) => {
    const updatedElements = designElements.map((el) => (el.id === elementId ? { ...el, ...updates } : el))
    onUpdateDesignElements(updatedElements)
    if (selectedDesignElement?.id === elementId) {
      // Find the updated element in the updated elements array
      const updatedElement = updatedElements.find(el => el.id === elementId)
      if (updatedElement) {
        onSelectDesignElement(updatedElement)
      }
    }
  }

  const handleDesignElementDelete = (elementId: string) => {
    onUpdateDesignElements(designElements.filter((el) => el.id !== elementId))
    if (selectedDesignElement?.id === elementId) {
      onSelectDesignElement(null)
      setActiveSettingsPanel(null)
    }
  }

  const handleDesignElementDuplicate = (element: DesignElement) => {
    const duplicatedElement: DesignElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      position: { x: element.position.x + 20, y: element.position.y + 20 },
      zIndex: designElements.length,
    }
    onUpdateDesignElements([...designElements, duplicatedElement])
    onSelectDesignElement(duplicatedElement)
    setActiveSettingsPanel("design")
  }

  const handleContentElementUpdate = useCallback((updates: any) => {
    if (!currentSelectedContentElement) return;

    // Handle deletion for any element
    if (updates.deleted) {
        currentSelectedContentElement.closest(".element-container")?.remove();
        currentSelectedContentElement.remove();
        setActiveSettingsPanel(null);
        setCurrentSelectedContentElement(null);
    } 
    // Handle table-specific updates
    else if (currentSelectedContentElement.dataset.elementType === "table" && updates) {
        // The TableSettingsPanel is responsible for updating the element's appearance.
        // This handler's primary job is to persist the final settings to the data attribute.
        
        // Store the updated settings on the table element
        currentSelectedContentElement.setAttribute("data-table-settings", JSON.stringify(updates));
        
        // Force update the visual styling based on the settings to ensure consistency
        const table = currentSelectedContentElement.querySelector('table');
        if (table) {
            // Apply border style based on settings
            const borderStyle = updates.showBorders
                ? `${updates.borderWidth}px solid ${updates.borderColor}`
                : 'none';
                
            // Apply table styles - always using collapse to ensure cells stay adjacent
            table.style.borderCollapse = 'collapse';
            table.style.borderSpacing = '0';
            table.style.border = borderStyle;
            table.style.borderRadius = `${updates.borderRadius}px`;
            
            // Apply cell styles
            table.querySelectorAll('td, th').forEach((cell) => {
                const isHeader = cell.tagName.toLowerCase() === 'th';
                (cell as HTMLElement).style.border = borderStyle;
                (cell as HTMLElement).style.fontFamily = updates.fontFamily;
                (cell as HTMLElement).style.fontSize = `${updates.fontSize}px`;
                (cell as HTMLElement).style.color = isHeader ? updates.headerTextColor : updates.cellTextColor;
                (cell as HTMLElement).style.backgroundColor = isHeader ? updates.headerBackgroundColor : updates.cellBackgroundColor;
            });
        }
    } 
    // Handle image-specific updates
    else if (currentSelectedContentElement.dataset.elementType === "image" && updates.settings) {
        currentSelectedContentElement.setAttribute("data-settings", JSON.stringify(updates.settings));
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
    // Handle generic style updates for other elements
    else if (updates.style) {
        Object.assign(currentSelectedContentElement.style, updates.style);
    }

    // After any update, save the entire page content to ensure persistence.
    if (editorContentRef.current && selectedPage?.id) {
        onUpdatePage(selectedPage.id, { content: editorContentRef.current.innerHTML });
    }
  }, [currentSelectedContentElement, onUpdatePage, selectedPage?.id]);

  if (!selectedPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2 text-foreground">No page selected</h3>
          <p className="text-foreground">Select a page from the sidebar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex h-full">
      <div ref={containerRef} className="flex-1 bg-muted/30 p-8 flex justify-center items-start">
        <div
          ref={pageContainerRef}
          className="relative bg-white shadow-lg"
          style={{
            width: scaledWidth,
            height: scaledHeight,
            transform: `scale(${effectiveZoom / 100})`,
            transformOrigin: "top center",
            margin: "auto",
          }}
          onDrop={handleDesignElementDropOnPage}
          onDragOver={handlePageDragOver}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: selectedPage.backgroundColor || effectiveTheme.colors.pageBackground }}
            onClick={() => {
              // Clear element selection when clicking on the page background
              if (selectedDesignElement) {
                onSelectDesignElement(null)
              }
            }}
          />
          {selectedPage.showHeader && (
            <div
              className="absolute top-0 left-0 right-0 border-b bg-white/80 backdrop-blur-sm flex items-center justify-center"
              style={{
                height: headerHeight,
                fontSize: `${12 * (effectiveZoom / 100)}px`,
                fontFamily: effectiveTheme.typography.headingFont,
                color: effectiveTheme.colors.text,
              }}
            >
              {template.header?.content || "Header"}
            </div>
          )}
          {selectedPage.showFooter && (
            <div
              className="absolute bottom-0 left-0 right-0 border-t bg-white/80 backdrop-blur-sm flex items-center justify-between px-4"
              style={{
                height: footerHeight,
                fontSize: `${10 * (effectiveZoom / 100)}px`,
                fontFamily: effectiveTheme.typography.bodyFont,
                color: effectiveTheme.colors.text,
              }}
            >
              <span>{template.footer?.content || "Footer"}</span>
              {selectedPage.showPageNumber && <span>Page {selectedPage.order || 1}</span>}
            </div>
          )}
          {/* Content Area - Set to z-index: 0 so design elements can be placed behind, at same level, or in front */}
          <div
            className="template-builder-editor-content-area absolute inset-0"
            style={{
              top: headerHeight,
              bottom: footerHeight,
              padding: `${effectiveTheme.margins.top}px ${effectiveTheme.margins.right}px ${effectiveTheme.margins.bottom}px ${effectiveTheme.margins.left}px`,
              zIndex: 0, // Set baseline z-index for content elements
              position: 'relative', // Establish stacking context
              overflow: 'visible' // Allow elements to extend beyond boundaries
            }}
          >
            <div
              key={selectedPage.id} // IMPORTANT: Re-mounts component on page change
              ref={editorContentRef}
              contentEditable
              suppressContentEditableWarning
              className="w-full h-full outline-none max-w-none"
              onClick={(e) => {
                // Only unselect if clicking directly on the content area (not on its children)
                if (e.target === e.currentTarget && selectedDesignElement) {
                  onSelectDesignElement(null)
                }
              }}
              style={
                {
                  fontSize: `${effectiveTheme.typography.bodyFontSize}px`,
                  fontFamily: effectiveTheme.typography.bodyFont,
                  lineHeight: effectiveTheme.typography.lineSpacing,
                  color: `${effectiveTheme.colors.text} !important`,
                  "--text-color": effectiveTheme.colors.text,
                  "--heading-color": effectiveTheme.colors.primary,
                } as React.CSSProperties
              }
              onInput={handleContentInput}
              onBlur={handleContentBlur}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  editorContentRef.current?.focus() // Ensure editor is focused

                  if (e.shiftKey) {
                    document.execCommand("insertHTML", false, "<br>")
                  } else {
                    document.execCommand("insertHTML", false, "<p><br></p>")
                  }

                  // Sync DOM changes back to React state
                  if (editorContentRef.current && selectedPage) {
                    onUpdatePage(selectedPage.id, { content: editorContentRef.current.innerHTML })
                  }
                }
              }}
            />
            <style jsx>{`
              /* Set all content elements to have a z-index of 0 by default */
              .template-builder-editor-content-area [contenteditable] * {
                color: ${effectiveTheme.colors.text} !important;
                position: relative;
                z-index: 0;
              }
              
              /* Allow pointer events to pass through content when a design element is selected */
              ${selectedDesignElement ? `
              .template-builder-editor-content-area [contenteditable] {
                pointer-events: none;
              }
              .template-builder-editor-content-area [contenteditable]:focus {
                pointer-events: auto;
              }
              ` : ''}
              
              /* Ensure tables, charts, and other content elements have proper z-index */
              .template-builder-editor-content-area [data-element-type] {
                position: relative;
                z-index: 0;
              }
              
              /* Basic text styles with z-index */
              .template-builder-editor-content-area [contenteditable] p {
                color: ${effectiveTheme.colors.text} !important;
              }
              .template-builder-editor-content-area [contenteditable] div {
                color: ${effectiveTheme.colors.text} !important;
              }
              .template-builder-editor-content-area [contenteditable] span {
                color: ${effectiveTheme.colors.text} !important;
              }
              .template-builder-editor-content-area [contenteditable] h1,
              .template-builder-editor-content-area [contenteditable] h2,
              .template-builder-editor-content-area [contenteditable] h3,
              .template-builder-editor-content-area [contenteditable] h4,
              .template-builder-editor-content-area [contenteditable] h5,
              .template-builder-editor-content-area [contenteditable] h6 {
                color: ${effectiveTheme.colors.primary} !important;
              }
            `}</style>
            {designElements.map((element) => (
              <DesignElementComponent
                key={element.id}
                element={element}
                isSelected={selectedDesignElement?.id === element.id}
                onSelect={() => handleDesignElementSelect(element)}
                onUpdate={(updates) => handleDesignElementUpdate(element.id, updates)}
                onDelete={() => handleDesignElementDelete(element.id)}
                zoom={effectiveZoom}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="settings-panel-container w-80 flex-shrink-0 border-l bg-background h-full overflow-y-auto">
        {!activeSettingsPanel && (
          <div className="p-4 text-sm text-foreground">Select an element to see its settings.</div>
        )}
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
          />
        )}
        {activeSettingsPanel === "design" && selectedDesignElement && (
          <DesignElementSettings
            element={selectedDesignElement}
            onUpdate={(updates) => handleDesignElementUpdate(selectedDesignElement.id, updates)}
            onDelete={() => handleDesignElementDelete(selectedDesignElement.id)}
            onDuplicate={() => handleDesignElementDuplicate(selectedDesignElement)}
            onClose={() => setActiveSettingsPanel(null)}
          />
        )}
      </div>
    </div>
  )
}
