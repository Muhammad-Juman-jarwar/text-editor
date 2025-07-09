"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Square, Palette, Variable } from "lucide-react"

import { PagesTab } from "./pages-tab"
import { DesignTab } from "./design-tab"
import { ThemeTab } from "./theme-tab"
import { VariablesTab } from "./variables-tab"

// Using the same interface from the original component
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

interface TemplateBuilderSidebarProps {
  template: any
  selectedPageId: string
  activeTab: string
  onTabChange: (tab: string) => void
  onSelectPage: (pageId: string) => void
  onUpdateTemplate: (updates: any) => void
  onUpdatePage: (pageId: string, updates: any) => void
  onAddPage: (templateType?: string) => void
  onDeletePage: (pageId: string) => void
  onAddDesignElement: (elementType: string, position?: { x: number; y: number }) => void
  designElements?: DesignElement[]
  selectedDesignElement?: DesignElement | null
  onSelectElement?: (elementId: string) => void
}

export function TemplateBuilderSidebar({
  template,
  selectedPageId,
  activeTab = "pages",
  onTabChange,
  onSelectPage,
  onUpdateTemplate,
  onUpdatePage,
  onAddPage,
  onDeletePage,
  onAddDesignElement,
  designElements = [],
  selectedDesignElement = null,
  onSelectElement = () => {},
}: TemplateBuilderSidebarProps) {
  return (
    <div className="w-80 bg-background border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pages" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="design" className="text-xs">
              <Square className="h-3 w-3 mr-1" />
              Design
            </TabsTrigger>
            <TabsTrigger value="theme" className="text-xs">
              <Palette className="h-3 w-3 mr-1" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="variables" className="text-xs">
              <Variable className="h-3 w-3 mr-1" />
              Vars
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Tabs value={activeTab} className="w-full">
            {/* Pages Tab */}
            <TabsContent value="pages">
              <PagesTab
                template={template}
                selectedPageId={selectedPageId}
                onSelectPage={onSelectPage}
                onUpdatePage={onUpdatePage}
                onAddPage={onAddPage}
                onDeletePage={onDeletePage}
              />
            </TabsContent>

            {/* Design Tab */}
            <TabsContent value="design">
              <DesignTab
                onAddDesignElement={onAddDesignElement}
                designElements={designElements}
                selectedDesignElement={selectedDesignElement}
                onSelectElement={onSelectElement}
              />
            </TabsContent>

            {/* Theme Tab */}
            <TabsContent value="theme">
              <ThemeTab
                template={template}
                onUpdateTemplate={onUpdateTemplate}
              />
            </TabsContent>

            {/* Variables Tab */}
            <TabsContent value="variables">
              <VariablesTab
                template={template}
                onUpdateTemplate={onUpdateTemplate}
              />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}
