"use client"

import type React from "react"

import { useState } from "react"
import { TemplateBuilderSidebar } from "@/components/template-builder/template-builder-sidebar"
import { TemplateBuilderToolbar } from "@/components/template-builder/template-builder-toolbar"
import { TemplateBuilderEditor } from "@/components/template-builder/template-builder-editor"
import { TemplateBuilderPreview } from "@/components/template-builder/template-builder-preview"
import { VariableManager } from "@/components/template-builder/variable-manager"
import { ExportDialog } from "@/components/template-builder/export-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ZoomIn, ZoomOut, Download, Eye, Save } from "lucide-react"

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

export default function TemplateBuilderPage() {
  const [template, setTemplate] = useState({
    id: "template-1",
    name: "Template Builder",
    description: "Create your document template",
    pages: [
      {
        id: "page-1",
        name: "Cover Page",
        order: 1,
        content: "<h1>Document Template</h1><p>Click here to start editing...</p>",
        showHeader: false,
        showFooter: true,
        showPageNumber: true,
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
        bodyFont: "Arial",
        headingFont: "Arial",
        bodyFontSize: 14,
        headingFontSize: 28,
        lineSpacing: 1.4,
      },
      margins: {
        top: 16,
        bottom: 16,
        left: 16,
        right: 16,
        linked: false,
      },
    },
    header: {
      content: "Document Template",
      height: 40,
    },
    footer: {
      content: "Footer Text",
      height: 40,
    },
    variables: [],
  })

  const [selectedPageId, setSelectedPageId] = useState("page-1")
  const [activeTab, setActiveTab] = useState("pages")
  const [zoom, setZoom] = useState(75)
  const [showPreview, setShowPreview] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [designElements, setDesignElements] = useState<DesignElement[]>([])
  const [selectedDesignElement, setSelectedDesignElement] = useState<DesignElement | null>(null)

  const selectedPage = template.pages.find((p) => p.id === selectedPageId)

  const updateTemplate = (updates: any) => {
    setTemplate((prev) => ({ ...prev, ...updates }))
  }

  const updatePage = (pageId: string, updates: any) => {
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((page) => (page.id === pageId ? { ...page, ...updates } : page)),
    }))
  }

  const addPage = (templateType?: string) => {
    const newPage = {
      id: `page-${Date.now()}`,
      name: `Page ${template.pages.length + 1}`,
      order: template.pages.length + 1,
      content: "<p>New page content...</p>",
      showHeader: true,
      showFooter: true,
      showPageNumber: true,
    }
    setTemplate((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
    }))
    setSelectedPageId(newPage.id)
  }

  const deletePage = (pageId: string) => {
    if (template.pages.length <= 1) return // Don't delete the last page

    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.filter((page) => page.id !== pageId),
    }))

    // Select another page if the deleted page was selected
    if (selectedPageId === pageId) {
      const remainingPages = template.pages.filter((page) => page.id !== pageId)
      setSelectedPageId(remainingPages[0]?.id || "")
    }
  }

  const addDesignElement = (elementType: string, position?: { x: number; y: number }) => {
    const defaultPosition = position || { x: 100, y: 100 }

    const elementDefaults = {
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
      line: {
        size: { width: 100, height: 2 },
        style: { stroke: "#6b7280", strokeWidth: 3, opacity: 1 },
      },
      image: {
        size: { width: 120, height: 80 },
        style: { src: "/placeholder.svg?height=80&width=120&text=Design+Image", opacity: 1, borderRadius: 8 },
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

    setDesignElements((prev) => [...prev, newElement])
  }

  const handleDesignElementDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const elementType = e.dataTransfer.getData("application/design-element")

    if (elementType) {
      // Calculate drop position relative to the page
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Adjust for zoom
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
              <p className="text-sm text-muted-foreground text-foreground">{template.description}</p>
            </div>
            <Badge variant="secondary">Draft</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(25, zoom - 25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(200, zoom + 25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? "Edit" : "Preview"}
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

      <div className="flex-1 flex overflow-hidden">
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
          designElements={designElements}
          selectedDesignElement={selectedDesignElement}
          onSelectElement={(elementId) => {
            const element = designElements.find(e => e.id === elementId);
            if (element) {
              setSelectedDesignElement(element);
              setActiveTab('design'); // Switch to design tab when selecting an element
            }
          }}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          {!showPreview && (
            <TemplateBuilderToolbar selectedPage={selectedPage} template={template} onUpdatePage={updatePage} />
          )}

          {/* Editor/Preview */}
          <div className="flex-1 overflow-hidden">
            {showPreview ? (
              <TemplateBuilderPreview template={template} selectedPageId={selectedPageId} />
            ) : (
              <TemplateBuilderEditor
                template={template}
                selectedPage={selectedPage}
                zoom={zoom}
                onUpdatePage={updatePage}
                designElements={designElements}
                onUpdateDesignElements={setDesignElements}
                selectedDesignElement={selectedDesignElement}
                onSelectDesignElement={setSelectedDesignElement}
              />
            )}
          </div>
        </div>

        {/* Variable Manager */}
        {activeTab === "variables" && (
          <VariableManager
            variables={template.variables}
            onUpdateVariables={(variables) => updateTemplate({ variables })}
          />
        )}
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        template={template}
        selectedPageId={selectedPageId}
      />
    </div>
  )
}
