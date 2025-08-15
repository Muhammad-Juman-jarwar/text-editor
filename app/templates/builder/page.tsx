"use client";

import type React from "react";

import { useState } from "react";
import { TemplateBuilderSidebar } from "@/components/template-builder/template-builder-sidebar";
import { TemplateBuilderToolbar } from "@/components/template-builder/template-builder-toolbar";
import { TemplateBuilderEditor } from "@/components/template-builder/template-builder-editor";
import { VariableManager } from "@/components/template-builder/variable-manager";
import { ExportDialog } from "@/components/template-builder/export-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ZoomIn, ZoomOut, Download, Eye, Save } from "lucide-react";
import { useRouter } from "next/navigation";

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


export default function TemplateBuilderPage() {
  const [template, setTemplate] = useState<{
    id: string
    name: string
    description: string
    pages: Array<{
      id: string
      name: string
      order: number
      content: string
      backgroundColor: string
      showHeader: boolean
      showFooter: boolean
      showPageNumber: boolean
      subPages: Array<{
        id: string
        content: string
        order: number
        showHeader: boolean
        showFooter: boolean
        showPageNumber: boolean
        designElements: DesignElement[]
      }>
      designElements: DesignElement[]
    }>
    theme: any
    header: any
    footer: any
    variables: any[]
  }>({
    id: "template-1",
    name: "Template Builder",
    description: "Create your document template",
    pages: [
      {
        id: "page-1",
        name: "Cover Page",
        order: 1,
        content: `<h1 style="font-family: Arial; font-size: 32px; line-height: 1.5;">Document Template</h1><p style="font-family: Arial; font-size: 14px; line-height: 1.5;">Click here to start editing...</p>`,
        backgroundColor: "#ffffff",
        showHeader: false,
        showFooter: true,
        showPageNumber: true,
        subPages: [],
        designElements: [],
      },
    ],
    theme: {
      colors: {
        primary: "#dc2626",
        secondary: "#1f2937",
        accent: "#3b82f6",
        text: "#000000",
        pageBackground: "#ffffff",
      },
      typography: {
        fontFamily: "Arial",
        baseFontSize: 14,
        lineHeight: 1.5,
        bodyFont: "Arial",
        headingFont: "Arial",
        bodyFontSize: 14,
        headingFontSize: 28,
        lineSpacing: 1.4,
      },
      margins: {
        top: 16,
        bottom: 16,
        left: 48,
        right: 48,
        linked: false,
      },
    },
    header: {
      content: "Document Template",
      height: 40,
      alignment: "center",
    },
    footer: {
      content: "Footer Text",
      height: 40,
      alignment: "justify",
    },
    variables: [],
  })

  const [selectedPageId, setSelectedPageId] = useState("page-1")
  const [activeTab, setActiveTab] = useState("pages")
  const [zoom, setZoom] = useState(100)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [selectedDesignElement, setSelectedDesignElement] = useState<DesignElement | null>(null)

  const selectedPage = template.pages.find((p) => p.id === selectedPageId)

  const updateTemplate = (updates: any) => {
    console.log("updateTemplate called with:", updates)
    setTemplate((prev) => {
      const newTemplate = { ...prev, ...updates }
      console.log("Updated template:", newTemplate)
      return newTemplate
    })
  }

  const updatePage = (pageId: string, updates: any) => {
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((page) => (page.id === pageId ? { ...page, ...updates } : page)),
    }))
  }

  const calculateSubPageOrder = () => {
    const Allorders = template.pages[template.pages.length - 1]?.subPages?.map((subPage) => subPage.order)
    return Allorders.length > 0
      ? Allorders[Allorders.length - 1] + 1
      : template.pages[template.pages.length - 1].order + 1
  }

  const recalculatePageOrders = (pages: typeof template.pages) => {
    let currentOrder = 1

    return pages.map((page) => {
      const updatedPage = { ...page, order: currentOrder++ }

      if (page.subPages && page.subPages.length > 0) {
        updatedPage.subPages = page.subPages.map((subPage) => ({
          ...subPage,
          order: currentOrder++,
        }))
      }

      return updatedPage
    })
  }

  const addPage = (content?: string) => {
    const newPage = {
      id: `page-${Date.now()}`,
      name: `Page ${template.pages.length + 1}`,
      order: calculateSubPageOrder(),
      content: content ? content : "<p>New page content...</p>",
      backgroundColor: "#ffffff",
      showHeader: true,
      showFooter: true,
      showPageNumber: true,
      subPages: [],
      designElements: [],
    }
    setTemplate((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
    }))
    setSelectedPageId(newPage.id)
  }

  const deletePage = (pageId: string) => {
    if (template.pages.length <= 1) return

    const remainingPages = template.pages.filter((page) => page.id !== pageId)
    const reorderedPages = recalculatePageOrders(remainingPages)

    setTemplate((prev) => ({
      ...prev,
      pages: reorderedPages,
    }))

    if (selectedPageId === pageId) {
      setSelectedPageId(reorderedPages[0]?.id || "")
    }
  }

  const addDesignElement = (
    elementType: string,
    position?: { x: number; y: number },
    targetPageId?: string,
    targetSubPageIdx?: number,
  ) => {
    const defaultPosition = position || { x: 100, y: 100 }
    const pageId = targetPageId || selectedPageId

    const elementDefaults = {
      rectangle: {
        size: { width: 100, height: 60 },
        style: {
          fill: "#3b82f6",
          stroke: "#1e40af",
          strokeWidth: 2,
          opacity: 1,
          borderRadius: 4,
        },
      },
      circle: {
        size: { width: 80, height: 80 },
        style: {
          fill: "#10b981",
          stroke: "#059669",
          strokeWidth: 2,
          opacity: 1,
        },
      },
      triangle: {
        size: { width: 80, height: 80 },
        style: {
          fill: "#f59e0b",
          stroke: "#d97706",
          strokeWidth: 2,
          opacity: 1,
        },
      },
      line: {
        size: { width: 100, height: 2 },
        style: { stroke: "#6b7280", strokeWidth: 3, opacity: 1 },
      },
      image: {
        size: { width: 120, height: 80 },
        style: {
          src: "/placeholder.svg?height=80&width=120&text=Design+Image",
          opacity: 1,
          borderRadius: 8,
        },
      },
    }

    const defaults = elementDefaults[elementType as keyof typeof elementDefaults]

    const newElement: DesignElement = {
      id: `${elementType}-${Date.now()}`,
      type: elementType as any,
      position: defaultPosition,
      size: defaults.size,
      rotation: 0,
      zIndex: 0,
      visible: true,
      locked: false,
      style: defaults.style,
    }

    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((page) => {
        if (page.id === pageId) {
          if (targetSubPageIdx !== undefined && page.subPages) {
            const updatedSubPages = [...page.subPages]
            if (updatedSubPages[targetSubPageIdx]) {
              updatedSubPages[targetSubPageIdx] = {
                ...updatedSubPages[targetSubPageIdx],
                designElements: [...(updatedSubPages[targetSubPageIdx].designElements || []), newElement],
              }
            }
            return { ...page, subPages: updatedSubPages }
          } else {
            return {
              ...page,
              designElements: [...(page.designElements || []), newElement],
            }
          }
        }
        return page
      }),
    }))
  }

  const getCurrentPageDesignElements = () => {
    return selectedPage?.designElements || []
  }

  const updateCurrentPageDesignElements = (elements: DesignElement[]) => {
    if (!selectedPage) return
    updatePage(selectedPage.id, { designElements: elements })
  }

  const handleDesignElementDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const elementType = e.dataTransfer.getData("application/design-element")

    if (elementType) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const adjustedX = x / (zoom / 100)
      const adjustedY = y / (zoom / 100)

      addDesignElement(elementType, { x: adjustedX, y: adjustedY })
    }
  }

  const handleDesignElementDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground">{template.name}</h1>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
            <Badge variant="secondary">Draft</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.setItem("template-full-preview", JSON.stringify({ template, zoom }))
                window.open("/templates/preview", "_blank")
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>

            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>

            <Button size="sm" onClick={() => setShowExportDialog(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-x-hidden">
        {/* Sidebar */}
        <TemplateBuilderSidebar
          template={template}
          selectedPageId={selectedPageId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSelectPage={setSelectedPageId}
          onUpdateTemplate={updateTemplate}
          onUpdatePage={updatePage}
          onAddPage={addPage}
          onDeletePage={deletePage}
          onAddDesignElement={addDesignElement}
          designElements={getCurrentPageDesignElements()}
          selectedDesignElement={selectedDesignElement}
          onSelectElement={(elementId: string) => {
            const currentElements = getCurrentPageDesignElements()
            const element = currentElements.find((e: DesignElement) => e.id === elementId)
            if (element) {
              setSelectedDesignElement(element)
              setActiveTab("design")
            }
          }}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <TemplateBuilderToolbar
            selectedPage={selectedPage}
            template={template}
            onUpdatePage={updatePage}
            onUpdateTemplate={updateTemplate}
          />
          {/* Editor */}
  <div
  className="flex-1 overflow-hidden"
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return; // Safety check

      const range = selection.getRangeAt(0);

      // Line break insert
      const br = document.createElement("br");
      range.insertNode(br);

      // Cursor ko visibly neeche le jaane ke liye zero-width space
      const space = document.createTextNode("\u200B");
      range.insertNode(space);

      // Cursor ko new space ke baad le jao
      range.setStartAfter(space);
      range.setEndAfter(space);

      selection.removeAllRanges();
      selection.addRange(range);
    }
  }}
>
  <TemplateBuilderEditor
    template={template}
    selectedPage={selectedPage}
    zoom={zoom}
    theme={template.theme}
    onUpdatePage={updatePage}
    onUpdateTemplate={updateTemplate}
    addPage={addPage}
    designElements={getCurrentPageDesignElements()}
    onUpdateDesignElements={updateCurrentPageDesignElements}
    selectedDesignElement={selectedDesignElement}
    onSelectDesignElement={setSelectedDesignElement}
    onAddDesignElement={addDesignElement}
  />
</div>

        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} template={template} />
    </div>
  )
}
